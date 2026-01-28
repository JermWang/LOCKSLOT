import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { rateLimitGate } from '@/lib/api-guard'

// Get user data and active locks
export async function GET(request: NextRequest) {
  try {
    const limited = rateLimitGate(request, { id: 'user', windowMs: 10_000, max: 30 })
    if (limited) return limited

    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get('wallet')
    
    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address required' }, { status: 400 })
    }
    
    const supabase = createServerClient()
    
    // Get user
    let { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single()
    
    if (!user) {
      // Create new user
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
    
    // Get active locks
    const { data: locks } = await supabase
      .from('spins')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['locked', 'unlocked'])
      .order('created_at', { ascending: false })
    
    // Get recent transactions
    const { data: transactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)
    
    // Get current epoch
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
        totalWon: user.total_won
      },
      locks: locks?.map(lock => ({
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
        bonusAmount: lock.bonus_amount
      })) || [],
      transactions: transactions || [],
      epoch: epoch ? {
        id: epoch.id,
        epochNumber: epoch.epoch_number,
        rewardPool: epoch.reward_pool,
        totalSpins: epoch.total_spins,
        startTime: epoch.start_time,
        endTime: epoch.end_time,
        serverSeedHash: epoch.server_seed_hash
      } : null
    })
    
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
