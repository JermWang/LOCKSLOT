import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client-side Supabase client (uses anon key, respects RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side Supabase client (uses service role, bypasses RLS)
export function createServerClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Types for database tables
export interface User {
  id: string
  wallet_address: string
  balance: number
  total_deposited: number
  total_withdrawn: number
  total_spins: number
  total_won: number
  created_at: string
  updated_at: string
}

export interface Epoch {
  id: string
  epoch_number: number
  server_seed_hash: string
  server_seed: string | null
  start_time: string
  end_time: string
  reward_pool: number
  total_spins: number
  total_fees: number
  status: 'pending' | 'active' | 'distributing' | 'completed'
  created_at: string
}

export interface Spin {
  id: string
  user_id: string
  epoch_id: string
  stake_amount: number
  fee_amount: number
  client_seed: string
  nonce: number
  combined_hash: string
  roll_value: number
  tier: 'brick' | 'mid' | 'hot' | 'legendary' | 'mythic'
  lock_duration: number
  multiplier: number
  ticket_score: number
  locked_at: string
  unlocks_at: string
  status: 'locked' | 'unlocked' | 'claimed'
  bonus_eligible: boolean
  bonus_amount: number
  created_at: string
}

export interface Transaction {
  id: string
  user_id: string
  type: 'deposit' | 'withdraw' | 'spin_fee' | 'bonus_payout' | 'early_exit_penalty'
  amount: number
  balance_before: number
  balance_after: number
  tx_signature: string | null
  spin_id: string | null
  epoch_id: string | null
  metadata: Record<string, unknown>
  created_at: string
}
