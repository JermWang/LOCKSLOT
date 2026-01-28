-- Production hardening + epoch settlement primitives

create extension if not exists pgcrypto;

-- Ensure public read access works as intended
alter table public.epochs enable row level security;
alter table public.reward_pool_ledger enable row level security;
alter table public.escrow_deposits enable row level security;

drop policy if exists "Anyone can view epochs" on public.epochs;
create policy "Anyone can view epochs"
  on public.epochs for select using (true);

drop policy if exists "Anyone can view reward ledger" on public.reward_pool_ledger;
create policy "Anyone can view reward ledger"
  on public.reward_pool_ledger for select using (true);

-- Enforce at most one active epoch at a time
create unique index if not exists idx_epochs_single_active
  on public.epochs(status)
  where status = 'active';

-- Track whether a spin's bonus amount has been finalized for an epoch
alter table public.spins
  add column if not exists bonus_finalized boolean not null default false;

alter table public.spins
  add column if not exists bonus_finalized_at timestamptz;

-- Optional helper to mark spins as unlocked based on time
create or replace function mark_unlocked_spins()
returns integer as $$
declare
  v_updated integer;
begin
  update public.spins
    set status = 'unlocked'
  where status = 'locked'
    and unlocks_at <= now();

  get diagnostics v_updated = row_count;
  return v_updated;
end;
$$ language plpgsql;

-- Reveal the epoch server seed after it ends (must match committed hash)
create or replace function reveal_epoch_server_seed(
  p_epoch_id uuid,
  p_server_seed text
) returns void as $$
declare
  v_hash text;
begin
  v_hash := encode(digest(p_server_seed, 'sha256'), 'hex');

  update public.epochs
    set server_seed = p_server_seed
  where id = p_epoch_id
    and server_seed_hash = v_hash;

  if not found then
    raise exception 'Server seed does not match server_seed_hash for epoch %', p_epoch_id;
  end if;
end;
$$ language plpgsql;

-- Bonus distribution for all currently-unlocked winners in an epoch.
-- Intended to be run when processing claims (model A: bonus allocated at unlock time).
create or replace function calculate_bonus_distribution(p_epoch_id uuid)
returns table(spin_id uuid, user_id uuid, bonus_amount bigint) as $$
declare
  v_total_pool bigint;
  v_total_winning_score bigint;
begin
  select reward_pool into v_total_pool
  from public.epochs where id = p_epoch_id;

  select coalesce(sum(ticket_score), 0) into v_total_winning_score
  from public.spins
  where epoch_id = p_epoch_id
    and bonus_eligible = true
    and unlocks_at <= now()
    and status <> 'claimed'
    and bonus_finalized = false;

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
    and s.unlocks_at <= now()
    and s.status <> 'claimed'
    and s.bonus_finalized = false;
end;
$$ language plpgsql;

-- Finalize bonuses for currently unlocked winners (idempotent via bonus_finalized)
create or replace function finalize_unlocked_winner_bonuses(p_epoch_id uuid)
returns bigint as $$
declare
  v_total_paid bigint;
begin
  perform mark_unlocked_spins();

  with dist as (
    select * from calculate_bonus_distribution(p_epoch_id)
  ), updated as (
    update public.spins s
       set bonus_amount = dist.bonus_amount,
           bonus_finalized = true,
           bonus_finalized_at = now()
      from dist
     where s.id = dist.spin_id
       and s.bonus_finalized = false
    returning s.bonus_amount
  )
  select coalesce(sum(bonus_amount), 0) into v_total_paid
  from updated;

  if v_total_paid > 0 then
    update public.epochs
       set reward_pool = greatest(reward_pool - v_total_paid, 0)
     where id = p_epoch_id;
  end if;

  if v_total_paid > 0 then
    insert into public.reward_pool_ledger(epoch_id, type, amount, description)
    values (p_epoch_id, 'bonus_out', v_total_paid, 'Unlocked winner bonus distribution');
  end if;

  return v_total_paid;
end;
$$ language plpgsql;

-- Create the next epoch and roll over remaining pool from a completed epoch.
create or replace function create_next_epoch_with_rollover(
  p_prev_epoch_id uuid,
  p_next_epoch_number int,
  p_next_server_seed_hash text,
  p_start_time timestamptz,
  p_end_time timestamptz
) returns uuid as $$
declare
  v_rollover bigint;
  v_next_epoch_id uuid;
begin
  select reward_pool into v_rollover
  from public.epochs
  where id = p_prev_epoch_id
    and status = 'completed'
  for update;

  insert into public.epochs(
    epoch_number,
    server_seed_hash,
    start_time,
    end_time,
    reward_pool,
    status
  ) values (
    p_next_epoch_number,
    p_next_server_seed_hash,
    p_start_time,
    p_end_time,
    coalesce(v_rollover, 0),
    'active'
  ) returning id into v_next_epoch_id;

  if coalesce(v_rollover, 0) > 0 then
    insert into public.reward_pool_ledger(epoch_id, type, amount, description)
    values (p_prev_epoch_id, 'rollover_out', v_rollover, 'Rollover to next epoch');

    insert into public.reward_pool_ledger(epoch_id, type, amount, description)
    values (v_next_epoch_id, 'rollover_in', v_rollover, 'Rollover from previous epoch');

    update public.epochs
      set reward_pool = 0
    where id = p_prev_epoch_id;
  end if;

  return v_next_epoch_id;
end;
$$ language plpgsql;
