import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { processWithdrawal } from '@/lib/escrow'
import { verifyAuth } from '@/lib/auth-server'
import { maintenanceGate, rateLimitGate } from '@/lib/api-guard'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const maintenance = maintenanceGate()
    if (maintenance) return maintenance

    const limited = rateLimitGate(request, { id: 'withdraw', windowMs: 30_000, max: 5 })
    if (limited) return limited

    const { walletAddress, amount, auth } = await request.json()
    
    if (!walletAddress || !amount || !auth) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const authResult = verifyAuth({
      action: "withdraw",
      walletAddress,
      payload: { amount },
      auth,
    })
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: 401 })
    }
    
    const withdrawAmount = Number(amount)
    if (!Number.isFinite(withdrawAmount) || withdrawAmount <= 0) {
      return NextResponse.json({ error: 'Invalid withdrawal amount' }, { status: 400 })
    }
    
    const supabase = createServerClient()

    const { data: reservedRows, error: reserveError } = await supabase.rpc('reserve_withdrawal', {
      p_wallet_address: walletAddress,
      p_amount: withdrawAmount,
    })

    if (reserveError || !reservedRows || reservedRows.length === 0) {
      const message = reserveError?.message || 'Failed to reserve withdrawal'
      const status =
        message.includes('Insufficient balance') || message.includes('User not found')
          ? 400
          : 500
      return NextResponse.json({ error: message }, { status })
    }

    const reserved = reservedRows[0] as any

    const result = await processWithdrawal(walletAddress, withdrawAmount)

    if (!result.success) {
      const { data: refundedBalance } = await supabase.rpc('fail_withdrawal', {
        p_tx_id: reserved.tx_id,
        p_reason: result.error || 'Withdrawal failed',
      })

      return NextResponse.json(
        {
          error: result.error || 'Withdrawal failed',
          newBalance: refundedBalance ?? null,
        },
        { status: 500 }
      )
    }

    const { error: finalizeError } = await supabase.rpc('finalize_withdrawal', {
      p_tx_id: reserved.tx_id,
      p_tx_signature: result.txSignature,
    })

    if (finalizeError) {
      return NextResponse.json(
        {
          error: 'Withdrawal finalized on-chain but failed to finalize in database',
          txSignature: result.txSignature,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      amount: withdrawAmount,
      newBalance: reserved.balance_after,
      txSignature: result.txSignature,
    })
    
  } catch (error) {
    console.error('Withdraw error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
