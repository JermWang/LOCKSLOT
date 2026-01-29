import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { verifyAuth } from '@/lib/auth-server'
import { maintenanceGate, rateLimitGate } from '@/lib/api-guard'

export const runtime = 'nodejs'

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

// Get user data and active locks (authenticated)
export async function POST(request: NextRequest) {
  try {
    const maintenance = maintenanceGate()
    if (maintenance) return maintenance

    const limited = await rateLimitGate(request, { id: 'user', windowMs: 10_000, max: 30 })
    if (limited) return limited

    const { walletAddress, auth } = await request.json()

    if (!walletAddress || !auth) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const authResult = verifyAuth({
      action: 'get_user',
      walletAddress,
      payload: {},
      auth,
    })
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: 401 })
    }

    const supabase = createServerClient()

    let { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single()

    if (!user) {
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({ wallet_address: walletAddress, balance: 0 })
        .select()
        .single()

      if (createError) {
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
      }
      user = newUser
    }

    const { data: locks } = await supabase
      .from('spins')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['locked', 'unlocked'])
      .order('created_at', { ascending: false })

    const { data: transactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)

    const { data: epoch } = await supabase
      .from('epochs')
      .select('*')
      .eq('status', 'active')
      .single()

    return NextResponse.json({
      user: {
        id: user.id,
        walletAddress: user.wallet_address,
        balance: user.balance,
        totalDeposited: user.total_deposited,
        totalWithdrawn: user.total_withdrawn,
        totalSpins: user.total_spins,
        totalWon: user.total_won,
      },
      locks:
        locks?.map((lock) => ({
          id: lock.id,
          tier: lock.tier,
          stakeAmount: lock.stake_amount,
          multiplier: lock.multiplier,
          duration: lock.lock_duration,
          ticketScore: lock.ticket_score,
          lockedAt: lock.locked_at,
          unlocksAt: lock.unlocks_at,
          status: lock.status,
          bonusEligible: lock.bonus_eligible,
          bonusAmount: lock.bonus_amount,
        })) || [],
      transactions: transactions || [],
      epoch: epoch
        ? {
            id: epoch.id,
            epochNumber: epoch.epoch_number,
            rewardPool: epoch.reward_pool,
            totalSpins: epoch.total_spins,
            startTime: epoch.start_time,
            endTime: epoch.end_time,
            serverSeedHash: epoch.server_seed_hash,
          }
        : null,
    })
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
