import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { verifyAuth } from '@/lib/auth-server'
import { maintenanceGate, rateLimitGate } from '@/lib/api-guard'

export const runtime = 'nodejs'

// Claim unlocked principal + any bonus
export async function POST(request: NextRequest) {
  try {
    const maintenance = maintenanceGate()
    if (maintenance) return maintenance

    const limited = rateLimitGate(request, { id: 'claim', windowMs: 10_000, max: 10 })
    if (limited) return limited

    const { walletAddress, spinId, auth } = await request.json()
    
    if (!walletAddress || !spinId || !auth) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const authResult = verifyAuth({
      action: "claim",
      walletAddress,
      payload: { spinId },
      auth,
    })
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: 401 })
    }
    
    const supabase = createServerClient()
    
    // Get user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    // Get spin
    const { data: spin, error: spinError } = await supabase
      .from('spins')
      .select('*')
      .eq('id', spinId)
      .eq('user_id', user.id)
      .single()
    
    if (spinError || !spin) {
      return NextResponse.json({ error: 'Spin not found' }, { status: 404 })
    }
    
    // Check if already claimed
    if (spin.status === 'claimed') {
      return NextResponse.json({ error: 'Already claimed' }, { status: 400 })
    }
    
    // Check if unlocked
    const now = new Date()
    const unlocksAt = new Date(spin.unlocks_at)
    
    if (now < unlocksAt) {
      return NextResponse.json({ 
        error: 'Still locked',
        unlocksAt: spin.unlocks_at,
        remainingMs: unlocksAt.getTime() - now.getTime()
      }, { status: 400 })
    }

    const { data: claimedRows, error: claimError } = await supabase.rpc('claim_unlocked_spin', {
      p_wallet_address: walletAddress,
      p_spin_id: spinId,
    })

    if (claimError || !claimedRows || claimedRows.length === 0) {
      const message = claimError?.message || 'Failed to claim'
      const status =
        message.includes('Still locked') ||
        message.includes('Already claimed') ||
        message.includes('Spin not found') ||
        message.includes('User not found')
          ? 400
          : 500

      return NextResponse.json({ error: message }, { status })
    }

    const claimed = claimedRows[0] as any

    return NextResponse.json({
      success: true,
      principal: claimed.principal,
      bonus: claimed.bonus,
      totalPayout: claimed.total_payout,
      newBalance: claimed.new_balance,
    })
    
  } catch (error) {
    console.error('Claim error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Check claimable locks
export async function GET(request: NextRequest) {
  try {
    const maintenance = maintenanceGate()
    if (maintenance) return maintenance

    const limited = rateLimitGate(request, { id: 'claim_get', windowMs: 10_000, max: 30 })
    if (limited) return limited

    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get('wallet')
    
    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address required' }, { status: 400 })
    }
    
    const supabase = createServerClient()
    
    // Get user
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('wallet_address', walletAddress)
      .single()
    
    if (!user) {
      return NextResponse.json({ claimable: [] })
    }
    
    // Get claimable locks (unlocked but not claimed)
    const now = new Date().toISOString()
    
    const { data: claimable } = await supabase
      .from('spins')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['locked', 'unlocked'])
      .lte('unlocks_at', now)
    
    return NextResponse.json({
      claimable: claimable?.map((spin: any) => ({
        id: spin.id,
        tier: spin.tier,
        principal: spin.stake_amount - spin.fee_amount,
        bonus: spin.bonus_amount || 0,
        total: (spin.stake_amount - spin.fee_amount) + (spin.bonus_amount || 0),
        unlockedAt: spin.unlocks_at
      })) || []
    })
    
  } catch (error) {
    console.error('Get claimable error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
