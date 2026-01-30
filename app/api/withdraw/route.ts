import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { buildWithdrawalTransaction } from '@/lib/escrow'
import { verifyAuth } from '@/lib/auth-server'
import { maintenanceGate, rateLimitGate } from '@/lib/api-guard'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const maintenance = maintenanceGate()
    if (maintenance) return maintenance

    const limited = await rateLimitGate(request, { id: 'withdraw', windowMs: 30_000, max: 5 })
    if (limited) return limited

    const { walletAddress, amount, auth, txId, txSignature } = await request.json()
    
    if (!walletAddress || !auth) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (txId || txSignature) {
      if (!txId || !txSignature) {
        return NextResponse.json({ error: 'Missing withdrawal submission fields' }, { status: 400 })
      }

      if (typeof txSignature !== 'string' || txSignature.length < 20) {
        return NextResponse.json({ error: 'Invalid transaction signature' }, { status: 400 })
      }

      const authResult = verifyAuth({
        action: "withdraw_submit",
        walletAddress,
        payload: { txId, txSignature },
        auth,
      })
      if (!authResult.ok) {
        return NextResponse.json({ error: authResult.error }, { status: 401 })
      }

      const supabase = createServerClient()
      const { error: markError } = await supabase.rpc('mark_withdrawal_submitted', {
        p_tx_id: txId,
        p_tx_signature: txSignature,
      })

      if (markError) {
        return NextResponse.json(
          { error: markError.message || 'Failed to mark withdrawal submitted' },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true, status: 'submitted', txId, txSignature })
    }

    if (amount === undefined || amount === null) {
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
    if (!Number.isFinite(withdrawAmount) || withdrawAmount <= 0 || !Number.isSafeInteger(withdrawAmount)) {
      return NextResponse.json({ error: 'Invalid withdrawal amount' }, { status: 400 })
    }

    const maxWithdraw = Number(process.env.WITHDRAW_MAX_AMOUNT || 0)
    if (Number.isFinite(maxWithdraw) && maxWithdraw > 0 && withdrawAmount > maxWithdraw) {
      return NextResponse.json({ error: 'Withdrawal amount exceeds limit' }, { status: 400 })
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

    const manualThreshold = Number(process.env.WITHDRAW_MANUAL_THRESHOLD || 0)
    if (Number.isFinite(manualThreshold) && manualThreshold > 0 && withdrawAmount >= manualThreshold) {
      await supabase
        .from('transactions')
        .update({ metadata: { status: 'manual_review' } })
        .eq('id', reserved.tx_id)

      return NextResponse.json(
        {
          success: true,
          amount: withdrawAmount,
          newBalance: reserved.balance_after,
          status: 'manual_review',
          txId: reserved.tx_id,
        },
        { status: 202 }
      )
    }

    const buildResult = await buildWithdrawalTransaction(walletAddress, withdrawAmount)

    if (!buildResult.success || !buildResult.transaction) {
      const { data: refundedBalance } = await supabase.rpc('fail_withdrawal', {
        p_tx_id: reserved.tx_id,
        p_reason: buildResult.error || 'Withdrawal build failed',
      })

      return NextResponse.json(
        {
          error: buildResult.error || 'Withdrawal build failed',
          newBalance: refundedBalance ?? null,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      amount: withdrawAmount,
      newBalance: reserved.balance_after,
      txId: reserved.tx_id,
      transaction: buildResult.transaction,
      blockhash: buildResult.blockhash,
      lastValidBlockHeight: buildResult.lastValidBlockHeight,
    })
    
  } catch (error) {
    console.error('Withdraw error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
