-- ==========================================
-- LOCK SLOT - Supabase Database Schema
-- ==========================================
-- Run this in your Supabase SQL editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Enable crypto helpers (sha256)
create extension if not exists "pgcrypto";

-- ==========================================
-- USERS TABLE
-- ==========================================
create table if not exists public.users (
  id uuid primary key default uuid_generate_v4(),
  wallet_address text unique not null,
  username text unique, -- Optional display name
  balance bigint default 0, -- User's deposited balance (in base units)
  total_deposited bigint default 0,
  total_withdrawn bigint default 0,
  total_spins int default 0,
  total_won bigint default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Index for username lookups
create index if not exists idx_users_username on public.users(username) where username is not null;

-- Index for wallet lookups
create index if not exists idx_users_wallet on public.users(wallet_address);

-- ==========================================
-- GAME EPOCHS TABLE
-- ==========================================
create table if not exists public.epochs (
  id uuid primary key default uuid_generate_v4(),
  epoch_number int unique not null,
  server_seed_hash text not null, -- Published before epoch starts
  server_seed text, -- Revealed after epoch ends
  start_time timestamptz not null,
  end_time timestamptz not null,
  reward_pool bigint default 0,
  total_spins int default 0,
  total_fees bigint default 0,
  status text default 'active' check (status in ('pending', 'active', 'distributing', 'completed')),
  created_at timestamptz default now()
);

create unique index if not exists idx_epochs_single_active
  on public.epochs(status)
  where status = 'active';

create table if not exists public.epoch_secrets (
  epoch_id uuid primary key references public.epochs(id) on delete cascade,
  server_seed text not null,
  created_at timestamptz default now()
);

-- Index for active epoch lookup
create index if not exists idx_epochs_status on public.epochs(status);

-- ==========================================
-- SPINS TABLE
-- ==========================================
create table if not exists public.spins (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) not null,
  epoch_id uuid references public.epochs(id) not null,
  
  -- Spin input
  stake_amount bigint not null,
  fee_amount bigint not null,
  client_seed text not null,
  nonce int not null,
  
  -- RNG result
  combined_hash text not null, -- hash(serverSeed || clientSeed || nonce)
  roll_value decimal(10, 8) not null, -- 0.00000000 to 0.99999999
  
  -- Outcome
  tier text not null check (tier in ('brick', 'mid', 'hot', 'legendary', 'mythic')),
  lock_duration int not null, -- in hours
  multiplier decimal(4, 2) not null,
  ticket_score bigint not null, -- stake * multiplier
  
  -- Lock timing
  locked_at timestamptz default now(),
  unlocks_at timestamptz not null,
  
  -- Status
  status text default 'locked' check (status in ('locked', 'unlocked', 'claimed')),
  bonus_eligible boolean default false,
  bonus_amount bigint default 0,
  
  created_at timestamptz default now()
);

-- Indexes for common queries
create index if not exists idx_spins_user on public.spins(user_id);
create index if not exists idx_spins_epoch on public.spins(epoch_id);
create index if not exists idx_spins_status on public.spins(status);
create index if not exists idx_spins_unlocks_at on public.spins(unlocks_at);
create index if not exists idx_spins_bonus_eligible on public.spins(bonus_eligible) where bonus_eligible = true;

-- Ensure per-user epoch nonces are unique
create unique index if not exists idx_spins_user_epoch_nonce on public.spins(user_id, epoch_id, nonce);

-- ==========================================
-- TRANSACTIONS TABLE (Audit Log)
-- ==========================================
create table if not exists public.transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) not null,
  type text not null check (type in ('deposit', 'withdraw', 'spin_fee', 'bonus_payout', 'early_exit_penalty')),
  amount bigint not null,
  balance_before bigint not null,
  balance_after bigint not null,
  
  -- Blockchain reference (for deposits/withdrawals)
  tx_signature text,
  
  -- Related entities
  spin_id uuid references public.spins(id),
  epoch_id uuid references public.epochs(id),
  
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

-- Index for user transaction history
create index if not exists idx_transactions_user on public.transactions(user_id, created_at desc);

create unique index if not exists idx_transactions_deposit_tx_signature
  on public.transactions(tx_signature)
  where type = 'deposit';

-- ==========================================
-- REWARD POOL LEDGER
-- ==========================================
create table if not exists public.reward_pool_ledger (
  id uuid primary key default uuid_generate_v4(),
  epoch_id uuid references public.epochs(id) not null,
  type text not null check (type in ('fee_in', 'penalty_in', 'bonus_out', 'rollover_in', 'rollover_out')),
  amount bigint not null,
  description text,
  created_at timestamptz default now()
);

create index if not exists idx_reward_ledger_epoch on public.reward_pool_ledger(epoch_id);

-- ==========================================
-- ESCROW DEPOSITS (Pending blockchain confirmations)
-- ==========================================
create table if not exists public.escrow_deposits (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id),
  wallet_address text not null,
  amount bigint not null,
  tx_signature text unique not null,
  status text default 'pending' check (status in ('pending', 'confirmed', 'failed')),
  confirmations int default 0,
  created_at timestamptz default now(),
  confirmed_at timestamptz
);

create index if not exists idx_escrow_deposits_status on public.escrow_deposits(status);
create index if not exists idx_escrow_deposits_tx on public.escrow_deposits(tx_signature);

-- ==========================================
-- CHAT MESSAGES (Global chat history)
-- ==========================================
create table if not exists public.chat_messages (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id),
  wallet_address text not null,
  message text not null,
  created_at timestamptz default now()
);

create index if not exists idx_chat_messages_created_at on public.chat_messages(created_at);
create index if not exists idx_chat_messages_wallet on public.chat_messages(wallet_address);

-- ==========================================
-- FUNCTIONS
-- ==========================================

-- Function to update user balance atomically
create or replace function update_user_balance(
  p_user_id uuid,
  p_amount bigint,
  p_type text
) returns bigint as $$
declare
  v_current_balance bigint;
  v_new_balance bigint;
begin
  -- Lock the user row
  select balance into v_current_balance
  from public.users
  where id = p_user_id
  for update;
  
  v_new_balance := v_current_balance + p_amount;
  
  -- Prevent negative balance
  if v_new_balance < 0 then
    raise exception 'Insufficient balance';
  end if;
  
  -- Update balance
  update public.users
  set balance = v_new_balance,
      updated_at = now()
  where id = p_user_id;
  
  return v_new_balance;
end;
$$ language plpgsql;

-- Function to get active epoch
create or replace function get_active_epoch()
returns public.epochs as $$
  select * from public.epochs
  where status = 'active'
  and now() between start_time and end_time
  limit 1;
$$ language sql;

create or replace function confirm_deposit(
  p_wallet_address text,
  p_tx_signature text,
  p_amount bigint,
  p_confirmations int
) returns table(
  deposit_id uuid,
  new_balance bigint
) as $$
declare
  v_user public.users;
  v_deposit public.escrow_deposits;
  v_before bigint;
  v_after bigint;
begin
  if p_wallet_address is null or length(p_wallet_address) = 0 then
    raise exception 'Missing wallet address';
  end if;

  if p_tx_signature is null or length(p_tx_signature) = 0 then
    raise exception 'Missing tx signature';
  end if;

  if p_amount <= 0 then
    raise exception 'Invalid deposit amount';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('deposit:' || p_tx_signature, 0));

  select * into v_user
  from public.users
  where wallet_address = p_wallet_address
  for update;

  if v_user.id is null then
    insert into public.users (wallet_address, balance)
    values (p_wallet_address, 0)
    returning * into v_user;
  end if;

  select * into v_deposit
  from public.escrow_deposits
  where tx_signature = p_tx_signature
  for update;

  if v_deposit.id is null then
    insert into public.escrow_deposits (
      user_id,
      wallet_address,
      amount,
      tx_signature,
      status,
      confirmations,
      confirmed_at
    ) values (
      v_user.id,
      p_wallet_address,
      p_amount,
      p_tx_signature,
      'confirmed',
      coalesce(p_confirmations, 0),
      now()
    ) returning * into v_deposit;
  else
    update public.escrow_deposits
    set user_id = v_user.id,
        wallet_address = p_wallet_address,
        amount = p_amount,
        status = 'confirmed',
        confirmations = greatest(coalesce(confirmations, 0), coalesce(p_confirmations, 0)),
        confirmed_at = coalesce(confirmed_at, now())
    where id = v_deposit.id;
  end if;

  if exists (
    select 1
    from public.transactions
    where type = 'deposit'
    and tx_signature = p_tx_signature
  ) then
    deposit_id := v_deposit.id;
    new_balance := v_user.balance;
    return next;
  end if;

  v_before := v_user.balance;
  v_after := v_before + p_amount;

  update public.users
  set balance = v_after,
      total_deposited = coalesce(total_deposited, 0) + p_amount,
      updated_at = now()
  where id = v_user.id;

  insert into public.transactions (
    user_id,
    type,
    amount,
    balance_before,
    balance_after,
    tx_signature
  ) values (
    v_user.id,
    'deposit',
    p_amount,
    v_before,
    v_after,
    p_tx_signature
  );

  deposit_id := v_deposit.id;
  new_balance := v_after;
  return next;
end;
$$ language plpgsql;

-- Function to calculate bonus distribution
create or replace function calculate_bonus_distribution(p_epoch_id uuid)
returns table(spin_id uuid, user_id uuid, bonus_amount bigint) as $$
declare
  v_total_pool bigint;
  v_total_winning_score bigint;
begin
  -- Get total pool for this epoch
  select reward_pool into v_total_pool
  from public.epochs where id = p_epoch_id;
  
  -- Get total ticket score of all winners
  select coalesce(sum(ticket_score), 0) into v_total_winning_score
  from public.spins
  where epoch_id = p_epoch_id
  and bonus_eligible = true
  and status = 'unlocked';
  
  -- Return distribution
  return query
  select 
    s.id as spin_id,
    s.user_id,
    case 
      when v_total_winning_score > 0 
      then (v_total_pool * s.ticket_score / v_total_winning_score)::bigint
      else 0::bigint
    end as bonus_amount
  from public.spins s
  where s.epoch_id = p_epoch_id
  and s.bonus_eligible = true
  and s.status = 'unlocked';
end;
$$ language plpgsql;

-- Finalize bonuses for all unlocked winners in an epoch
drop function if exists public.finalize_unlocked_winner_bonuses(uuid);
create or replace function finalize_unlocked_winner_bonuses(p_epoch_id uuid)
returns void as $$
declare
  v_distributed bigint;
begin
  perform pg_advisory_xact_lock(hashtextextended('bonus:' || p_epoch_id::text, 0));

  -- Mark spins unlocked once their unlock time has passed
  update public.spins
  set status = 'unlocked'
  where epoch_id = p_epoch_id
  and status = 'locked'
  and unlocks_at <= now();

  -- Assign bonuses (idempotent)
  with dist as (
    select *
    from public.calculate_bonus_distribution(p_epoch_id)
  ), updated as (
    update public.spins s
    set bonus_amount = dist.bonus_amount
    from dist
    where s.id = dist.spin_id
    and s.bonus_amount = 0
    returning dist.bonus_amount as bonus_amount
  )
  select coalesce(sum(bonus_amount), 0) into v_distributed
  from updated;

  if v_distributed > 0 then
    update public.epochs
    set reward_pool = reward_pool - v_distributed
    where id = p_epoch_id
    and reward_pool >= v_distributed;

    if not found then
      raise exception 'Insufficient reward pool';
    end if;

    insert into public.reward_pool_ledger (epoch_id, type, amount, description)
    values (p_epoch_id, 'bonus_out', v_distributed, 'Winner bonus distribution');
  end if;
end;
$$ language plpgsql;

 -- Atomic spin execution (debit stake, insert spin, update epoch pool/ledger)
 create or replace function perform_spin(
   p_wallet_address text,
   p_stake_amount bigint,
   p_client_seed text,
   p_server_seed text,
   p_fee_bps int
 ) returns table(
   spin_id uuid,
   epoch_id uuid,
   nonce int,
   tier text,
   lock_duration int,
   multiplier numeric,
   ticket_score bigint,
   combined_hash text,
   roll_value numeric,
   fee_amount bigint,
   locked_at timestamptz,
   unlocks_at timestamptz,
   bonus_eligible boolean,
   new_balance bigint
 ) as $$
 declare
   v_user public.users;
   v_epoch public.epochs;
   v_nonce int;
   v_hash text;
   v_fee bigint;
   v_roll numeric;
   v_tier text;
   v_duration int;
   v_multiplier numeric;
   v_ticket_score bigint;
   v_locked_at timestamptz;
   v_unlocks_at timestamptz;
   v_bonus_eligible boolean;
   v_seed_hash text;
   v_int numeric;
   v_norm numeric;
   v_min_d int;
   v_max_d int;
   v_min_m numeric;
   v_max_m numeric;
   v_spin_id uuid;
   v_new_balance bigint;
 begin
   if p_stake_amount <= 0 then
     raise exception 'Invalid stake amount';
   end if;

   if p_client_seed is null or length(p_client_seed) = 0 then
     raise exception 'Missing client seed';
   end if;

   select * into v_epoch
   from public.epochs
   where status = 'active'
   and now() between start_time and end_time
   limit 1;

   if v_epoch.id is null then
     raise exception 'No active game epoch';
   end if;

   v_seed_hash := encode(digest(p_server_seed, 'sha256'), 'hex');
   if v_seed_hash <> v_epoch.server_seed_hash then
     raise exception 'Server seed mismatch';
   end if;

   select * into v_user
   from public.users
   where wallet_address = p_wallet_address
   for update;

   if v_user.id is null then
     insert into public.users (wallet_address, balance)
     values (p_wallet_address, 0)
     returning * into v_user;
   end if;

   if v_user.balance < p_stake_amount then
     raise exception 'Insufficient balance';
   end if;

   perform pg_advisory_xact_lock(hashtextextended(p_wallet_address || ':' || v_epoch.id::text, 0));

   select coalesce(max(sp.nonce), 0) + 1 into v_nonce
  from public.spins sp
  where sp.user_id = v_user.id
  and sp.epoch_id = v_epoch.id;

   v_fee := floor((p_stake_amount::numeric * p_fee_bps::numeric) / 10000::numeric)::bigint;
   v_locked_at := now();
   v_hash := encode(digest(p_server_seed || ':' || p_client_seed || ':' || v_nonce::text, 'sha256'), 'hex');

   v_int := ('x' || substring(v_hash from 1 for 8))::bit(32)::bigint;
   v_roll := v_int::numeric / 4294967296::numeric;

   -- Durations in HOURS (max 48h)
   if v_roll < 0.45 then
     v_tier := 'brick';
     v_min_d := 36; v_max_d := 48; v_min_m := 1.2; v_max_m := 2.0;  -- 36-48 hours
   elsif v_roll < 0.73 then
     v_tier := 'mid';
     v_min_d := 18; v_max_d := 36; v_min_m := 1.8; v_max_m := 3.5;  -- 18-36 hours
   elsif v_roll < 0.88 then
     v_tier := 'hot';
     v_min_d := 8; v_max_d := 18; v_min_m := 3.0; v_max_m := 7.0;   -- 8-18 hours
   elsif v_roll < 0.97 then
     v_tier := 'legendary';
     v_min_d := 3; v_max_d := 8; v_min_m := 5.0; v_max_m := 8.0;    -- 3-8 hours
   else
     v_tier := 'mythic';
     v_min_d := 1; v_max_d := 3; v_min_m := 8.0; v_max_m := 15.0;   -- 1-3 hours
   end if;

   v_int := ('x' || substring(v_hash from 9 for 8))::bit(32)::bigint;
   v_norm := v_int::numeric / 4294967296::numeric;
   v_duration := round(v_min_d + v_norm * (v_max_d - v_min_d))::int;

   v_int := ('x' || substring(v_hash from 17 for 8))::bit(32)::bigint;
   v_norm := v_int::numeric / 4294967296::numeric;
   v_multiplier := round((v_min_m + v_norm * (v_max_m - v_min_m))::numeric, 1);

   v_ticket_score := floor(p_stake_amount::numeric * v_multiplier)::bigint;
   v_unlocks_at := v_locked_at + (v_duration::text || ' hours')::interval;
   v_bonus_eligible := (v_tier = 'legendary' or v_tier = 'mythic');

   v_new_balance := v_user.balance - p_stake_amount;
   update public.users
   set balance = v_new_balance,
       total_spins = coalesce(total_spins, 0) + 1,
       updated_at = now()
   where id = v_user.id;

   insert into public.spins (
     user_id,
     epoch_id,
     stake_amount,
     fee_amount,
     client_seed,
     nonce,
     combined_hash,
     roll_value,
     tier,
     lock_duration,
     multiplier,
     ticket_score,
     locked_at,
     unlocks_at,
     bonus_eligible,
     status
   ) values (
     v_user.id,
     v_epoch.id,
     p_stake_amount,
     v_fee,
     p_client_seed,
     v_nonce,
     v_hash,
     v_roll,
     v_tier,
     v_duration,
     v_multiplier,
     v_ticket_score,
     v_locked_at,
     v_unlocks_at,
     v_bonus_eligible,
     'locked'
   ) returning id into v_spin_id;

   insert into public.transactions (
     user_id,
     type,
     amount,
     balance_before,
     balance_after,
     spin_id,
     epoch_id
   ) values (
     v_user.id,
     'spin_fee',
     -p_stake_amount,
     v_user.balance,
     v_new_balance,
     v_spin_id,
     v_epoch.id
   );

   update public.epochs
   set reward_pool = reward_pool + v_fee,
       total_spins = total_spins + 1,
       total_fees = total_fees + v_fee
   where id = v_epoch.id;

   insert into public.reward_pool_ledger (epoch_id, type, amount, description)
   values (v_epoch.id, 'fee_in', v_fee, 'Spin fee');

   spin_id := v_spin_id;
   epoch_id := v_epoch.id;
   nonce := v_nonce;
   tier := v_tier;
   lock_duration := v_duration;
   multiplier := v_multiplier;
   ticket_score := v_ticket_score;
   combined_hash := v_hash;
   roll_value := v_roll;
   fee_amount := v_fee;
   locked_at := v_locked_at;
   unlocks_at := v_unlocks_at;
   bonus_eligible := v_bonus_eligible;
   new_balance := v_new_balance;
   return next;
 end;
 $$ language plpgsql;

-- Atomic claim (finalize bonuses + mark claimed + credit user)
create or replace function claim_unlocked_spin(
  p_wallet_address text,
  p_spin_id uuid
) returns table(
  principal bigint,
  bonus bigint,
  total_payout bigint,
  new_balance bigint
) as $$
declare
  v_user public.users;
  v_spin public.spins;
  v_principal bigint;
  v_bonus bigint;
  v_total bigint;
  v_before bigint;
  v_after bigint;
begin
  select * into v_user
  from public.users
  where wallet_address = p_wallet_address
  for update;

  if v_user.id is null then
    raise exception 'User not found';
  end if;

  select * into v_spin
  from public.spins
  where id = p_spin_id
  and user_id = v_user.id
  for update;

  if v_spin.id is null then
    raise exception 'Spin not found';
  end if;

  if v_spin.status = 'claimed' then
    raise exception 'Already claimed';
  end if;

  if v_spin.unlocks_at > now() then
    raise exception 'Still locked';
  end if;

  perform public.finalize_unlocked_winner_bonuses(v_spin.epoch_id);

  select * into v_spin
  from public.spins
  where id = p_spin_id
  and user_id = v_user.id
  for update;

  if v_spin.status = 'claimed' then
    raise exception 'Already claimed';
  end if;

  v_principal := v_spin.stake_amount - v_spin.fee_amount;
  v_bonus := coalesce(v_spin.bonus_amount, 0);
  v_total := v_principal + v_bonus;

  update public.spins
  set status = 'claimed'
  where id = p_spin_id
  and user_id = v_user.id;

  v_before := v_user.balance;
  v_after := v_before + v_total;

  update public.users
  set balance = v_after,
      total_won = coalesce(total_won, 0) + v_bonus,
      updated_at = now()
  where id = v_user.id;

  insert into public.transactions (
    user_id,
    type,
    amount,
    balance_before,
    balance_after,
    spin_id,
    metadata
  ) values (
    v_user.id,
    'deposit',
    v_principal,
    v_before,
    v_before + v_principal,
    p_spin_id,
    jsonb_build_object('type', 'principal_return')
  );

  if v_bonus > 0 then
    insert into public.transactions (
      user_id,
      type,
      amount,
      balance_before,
      balance_after,
      spin_id,
      epoch_id
    ) values (
      v_user.id,
      'bonus_payout',
      v_bonus,
      v_before + v_principal,
      v_after,
      p_spin_id,
      v_spin.epoch_id
    );
  end if;

  principal := v_principal;
  bonus := v_bonus;
  total_payout := v_total;
  new_balance := v_after;
  return next;
end;
$$ language plpgsql;

-- Reserve a withdrawal by debiting balance and recording a pending transaction
create or replace function reserve_withdrawal(
  p_wallet_address text,
  p_amount bigint
) returns table(
  tx_id uuid,
  user_id uuid,
  balance_before bigint,
  balance_after bigint
) as $$
declare
  v_user public.users;
  v_before bigint;
  v_after bigint;
  v_tx uuid;
begin
  if p_amount <= 0 then
    raise exception 'Invalid withdrawal amount';
  end if;

  select * into v_user
  from public.users
  where wallet_address = p_wallet_address
  for update;

  if v_user.id is null then
    raise exception 'User not found';
  end if;

  v_before := v_user.balance;
  if v_before < p_amount then
    raise exception 'Insufficient balance';
  end if;

  v_after := v_before - p_amount;

  update public.users
  set balance = v_after,
      updated_at = now()
  where id = v_user.id;

  insert into public.transactions (
    user_id,
    type,
    amount,
    balance_before,
    balance_after,
    metadata
  ) values (
    v_user.id,
    'withdraw',
    -p_amount,
    v_before,
    v_after,
    jsonb_build_object('status', 'pending')
  ) returning id into v_tx;

  tx_id := v_tx;
  user_id := v_user.id;
  balance_before := v_before;
  balance_after := v_after;
  return next;
end;
$$ language plpgsql;

create or replace function mark_withdrawal_submitted(
  p_tx_id uuid,
  p_tx_signature text
) returns void as $$
declare
  v_tx public.transactions;
  v_status text;
begin
  select * into v_tx
  from public.transactions
  where id = p_tx_id
  for update;

  if v_tx.id is null then
    raise exception 'Withdrawal tx not found';
  end if;

  if v_tx.type <> 'withdraw' then
    raise exception 'Not a withdraw transaction';
  end if;

  v_status := coalesce(v_tx.metadata->>'status', '');
  if v_status = 'confirmed' then
    if v_tx.tx_signature is not null and v_tx.tx_signature <> p_tx_signature then
      raise exception 'Withdrawal already confirmed with different signature';
    end if;
    return;
  end if;

  if v_status = 'failed' then
    raise exception 'Withdrawal already failed';
  end if;

  if v_status <> 'pending' then
    raise exception 'Withdrawal not pending';
  end if;

  update public.transactions
  set tx_signature = p_tx_signature,
      metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object('status', 'submitted')
  where id = p_tx_id;
end;
$$ language plpgsql;

-- Finalize a pending withdrawal after on-chain confirmation
create or replace function finalize_withdrawal(
  p_tx_id uuid,
  p_tx_signature text
) returns void as $$
declare
  v_tx public.transactions;
  v_amount bigint;
  v_status text;
begin
  select * into v_tx
  from public.transactions
  where id = p_tx_id
  for update;

  if v_tx.id is null then
    raise exception 'Withdrawal tx not found';
  end if;

  if v_tx.type <> 'withdraw' then
    raise exception 'Not a withdraw transaction';
  end if;

  v_status := coalesce(v_tx.metadata->>'status', '');
  if v_status = 'confirmed' then
    if v_tx.tx_signature is not null and v_tx.tx_signature <> p_tx_signature then
      raise exception 'Withdrawal already confirmed with different signature';
    end if;
    if v_tx.tx_signature is null then
      update public.transactions
      set tx_signature = p_tx_signature,
          metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object('status', 'confirmed')
      where id = p_tx_id;
    end if;
    return;
  end if;

  if v_status <> 'pending' and v_status <> 'submitted' then
    raise exception 'Withdrawal not pending';
  end if;

  update public.transactions
  set tx_signature = p_tx_signature,
      metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object('status', 'confirmed')
  where id = p_tx_id;

  v_amount := -v_tx.amount;
  update public.users
  set total_withdrawn = coalesce(total_withdrawn, 0) + v_amount,
      updated_at = now()
  where id = v_tx.user_id;
end;
$$ language plpgsql;

-- Fail a pending withdrawal and refund the reserved balance
create or replace function fail_withdrawal(
  p_tx_id uuid,
  p_reason text
) returns bigint as $$
declare
  v_tx public.transactions;
  v_user public.users;
  v_amount bigint;
  v_status text;
  v_new_balance bigint;
begin
  select * into v_tx
  from public.transactions
  where id = p_tx_id
  for update;

  if v_tx.id is null then
    raise exception 'Withdrawal tx not found';
  end if;

  if v_tx.type <> 'withdraw' then
    raise exception 'Not a withdraw transaction';
  end if;

  v_status := coalesce(v_tx.metadata->>'status', '');
  if v_status = 'failed' then
    select * into v_user
    from public.users
    where id = v_tx.user_id
    for update;

    if v_user.id is null then
      raise exception 'User not found';
    end if;

    return v_user.balance;
  end if;

  if v_status = 'confirmed' then
    raise exception 'Withdrawal already confirmed';
  end if;

  if v_status <> 'pending' and v_status <> 'submitted' then
    raise exception 'Withdrawal not pending';
  end if;

  v_amount := -v_tx.amount;

  select * into v_user
  from public.users
  where id = v_tx.user_id
  for update;

  if v_user.id is null then
    raise exception 'User not found';
  end if;

  v_new_balance := v_user.balance + v_amount;
  update public.users
  set balance = v_new_balance,
      updated_at = now()
  where id = v_user.id;

  update public.transactions
  set metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object('status', 'failed', 'reason', p_reason)
  where id = p_tx_id;

  return v_new_balance;
end;
$$ language plpgsql;

-- ==========================================
-- ROW LEVEL SECURITY
-- ==========================================

-- Enable RLS
alter table public.users enable row level security;
alter table public.spins enable row level security;
alter table public.transactions enable row level security;
alter table public.epochs enable row level security;
alter table public.epoch_secrets enable row level security;
alter table public.reward_pool_ledger enable row level security;
alter table public.escrow_deposits enable row level security;
alter table public.chat_messages enable row level security;

-- Users can only see their own data
drop policy if exists "Users can view own profile" on public.users;
create policy "Users can view own profile"
  on public.users for select
  using (wallet_address = current_setting('app.wallet_address', true));

drop policy if exists "Users can view own spins" on public.spins;
create policy "Users can view own spins"
  on public.spins for select
  using (user_id in (
    select id from public.users 
    where wallet_address = current_setting('app.wallet_address', true)
  ));

drop policy if exists "Users can view own transactions" on public.transactions;
create policy "Users can view own transactions"
  on public.transactions for select
  using (user_id in (
    select id from public.users 
    where wallet_address = current_setting('app.wallet_address', true)
  ));

-- Epochs and reward ledger are public read
drop policy if exists "Anyone can view epochs" on public.epochs;
create policy "Anyone can view epochs"
  on public.epochs for select using (true);

drop policy if exists "Anyone can view reward ledger" on public.reward_pool_ledger;
create policy "Anyone can view reward ledger"
  on public.reward_pool_ledger for select using (true);

drop policy if exists "Anyone can view chat messages" on public.chat_messages;
create policy "Anyone can view chat messages"
  on public.chat_messages for select using (true);

revoke all on function public.perform_spin(text, bigint, text, text, int) from public;
revoke all on function public.claim_unlocked_spin(text, uuid) from public;
revoke all on function public.reserve_withdrawal(text, bigint) from public;
revoke all on function public.finalize_withdrawal(uuid, text) from public;
revoke all on function public.fail_withdrawal(uuid, text) from public;
revoke all on function public.confirm_deposit(text, text, bigint, int) from public;
revoke all on function public.mark_withdrawal_submitted(uuid, text) from public;
revoke all on function public.finalize_unlocked_winner_bonuses(uuid) from public;
revoke all on function public.calculate_bonus_distribution(uuid) from public;

grant execute on function public.perform_spin(text, bigint, text, text, int) to service_role;
grant execute on function public.claim_unlocked_spin(text, uuid) to service_role;
grant execute on function public.reserve_withdrawal(text, bigint) to service_role;
grant execute on function public.finalize_withdrawal(uuid, text) to service_role;
grant execute on function public.fail_withdrawal(uuid, text) to service_role;
grant execute on function public.confirm_deposit(text, text, bigint, int) to service_role;
grant execute on function public.mark_withdrawal_submitted(uuid, text) to service_role;
grant execute on function public.finalize_unlocked_winner_bonuses(uuid) to service_role;
grant execute on function public.calculate_bonus_distribution(uuid) to service_role;

-- ==========================================
-- TRIGGERS
-- ==========================================

-- Auto-update updated_at timestamp
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists users_updated_at on public.users;
create trigger users_updated_at
  before update on public.users
  for each row execute function update_updated_at();
