import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { verifyAuth } from '@/lib/auth-server'
import { getSessionFromRequest } from '@/lib/session'
import { maintenanceGate, rateLimitGate } from '@/lib/api-guard'

export const runtime = 'nodejs'

const FEE_BPS = Number(process.env.NEXT_PUBLIC_FEE_BPS) || 500 // 5%

export async function POST(request: NextRequest) {
  try {
    const maintenance = maintenanceGate()
    if (maintenance) return maintenance

    const limited = await rateLimitGate(request, { id: 'spin', windowMs: 10_000, max: 10 })
    if (limited) return limited

    const { walletAddress, stakeAmount, clientSeed: providedClientSeed, auth } = await request.json()
    
    if (!walletAddress || !stakeAmount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!providedClientSeed) {
      return NextResponse.json({ error: 'Missing client seed' }, { status: 400 })
    }

    if (auth) {
      const authResult = verifyAuth({
        action: "spin",
        walletAddress,
        payload: { stakeAmount, clientSeed: providedClientSeed },
        auth,
      })
      if (!authResult.ok) {
        return NextResponse.json({ error: authResult.error }, { status: 401 })
      }
    } else {
      const session = getSessionFromRequest(request)
      if (!session.ok) {
        return NextResponse.json({ error: session.error }, { status: 401 })
      }
      if (session.walletAddress !== walletAddress) {
        return NextResponse.json({ error: 'Session wallet mismatch' }, { status: 401 })
      }
    }
    
    const stake = Number(stakeAmount)
    if (!Number.isFinite(stake) || stake <= 0 || !Number.isSafeInteger(stake)) {
      return NextResponse.json({ error: 'Invalid stake amount' }, { status: 400 })
    }

    const minStake = Number(process.env.NEXT_PUBLIC_MIN_STAKE) || 0
    const maxStake = Number(process.env.NEXT_PUBLIC_MAX_STAKE) || Number.MAX_SAFE_INTEGER
    if (stake < minStake || stake > maxStake) {
      return NextResponse.json({ error: 'Stake amount out of bounds' }, { status: 400 })
    }

    if (!Number.isInteger(stake)) {
      return NextResponse.json({ error: 'Stake amount must be an integer' }, { status: 400 })
    }
    
    const supabase = createServerClient()

    const { data: epoch, error: epochError } = await supabase
      .from('epochs')
      .select('id, server_seed_hash')
      .eq('status', 'active')
      .lte('start_time', new Date().toISOString())
      .gte('end_time', new Date().toISOString())
      .order('start_time', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (epochError) {
      return NextResponse.json({ error: 'Failed to load active epoch' }, { status: 500 })
    }
    if (!epoch?.id) {
      return NextResponse.json({ error: 'No active game epoch' }, { status: 400 })
    }

    const { data: secretRow, error: secretError } = await supabase
      .from('epoch_secrets')
      .select('server_seed')
      .eq('epoch_id', epoch.id)
      .maybeSingle()

    if (secretError) {
      return NextResponse.json({ error: 'Failed to load epoch secret' }, { status: 500 })
    }
    const serverSeed = (secretRow as any)?.server_seed as string | undefined
    if (!serverSeed) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const { data: spinRows, error: spinError } = await supabase.rpc('perform_spin', {
      p_wallet_address: walletAddress,
      p_stake_amount: stake,
      p_client_seed: providedClientSeed,
      p_server_seed: serverSeed,
      p_fee_bps: FEE_BPS,
    })

    if (spinError || !spinRows || spinRows.length === 0) {
      const message = spinError?.message || 'Spin failed'
      const status =
        message.includes('Insufficient balance') ||
        message.includes('No active game epoch') ||
        message.includes('Invalid stake amount') ||
        message.includes('Missing client seed')
          ? 400
          : 500
      return NextResponse.json({ error: message }, { status })
    }

    const row = spinRows[0] as any

    return NextResponse.json({
      success: true,
      spin: {
        id: row.spin_id,
        tier: row.tier,
        duration: row.lock_duration,
        multiplier: Number(row.multiplier),
        ticketScore: Number(row.ticket_score),
        bonusEligible: row.bonus_eligible,
        lockedAt: row.locked_at,
        unlocksAt: row.unlocks_at,
        stakeAmount: stake,
        feeAmount: Number(row.fee_amount),
        clientSeed: providedClientSeed,
        nonce: row.nonce,
        combinedHash: row.combined_hash,
      },
      newBalance: Number(row.new_balance),
    })
    
  } catch (error) {
    console.error('Spin error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
