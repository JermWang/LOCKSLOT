import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { verifyDeposit, getEscrowTokenAccount, getEscrowPublicKey } from '@/lib/escrow'
import { rateLimitGate } from '@/lib/api-guard'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const limited = await rateLimitGate(request, { id: 'deposit', windowMs: 30_000, max: 10 })
    if (limited) return limited

    const { walletAddress, txSignature, expectedAmount } = await request.json()
    
    if (!walletAddress || !txSignature) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (typeof txSignature !== 'string' || txSignature.length < 20) {
      return NextResponse.json({ error: 'Invalid transaction signature' }, { status: 400 })
    }
    
    const supabase = createServerClient()
    
    // Check if tx already processed
    const { data: existingDeposit } = await supabase
      .from('escrow_deposits')
      .select('*')
      .eq('tx_signature', txSignature)
      .single()
    
    if (existingDeposit) {
      if (existingDeposit.status === 'confirmed') {
        const { data: user } = await supabase
          .from('users')
          .select('balance')
          .eq('wallet_address', walletAddress)
          .single()

        return NextResponse.json({ success: true, amount: existingDeposit.amount, newBalance: user?.balance ?? null, deposit: existingDeposit })
      }

      // Re-check pending deposits so they can confirm once finalized
      const minAmount = Number(expectedAmount || 0)
      if (!Number.isFinite(minAmount) || minAmount < 0 || !Number.isSafeInteger(minAmount)) {
        return NextResponse.json({ error: 'Invalid expected amount' }, { status: 400 })
      }

      const verification = await verifyDeposit(txSignature, walletAddress, minAmount)

      if (!verification.valid) {
        if (verification.error === 'Insufficient confirmations') {
          const { data: updatedPending } = await supabase
            .from('escrow_deposits')
            .update({ confirmations: verification.confirmations ?? existingDeposit.confirmations ?? 0 })
            .eq('id', existingDeposit.id)
            .select()
            .single()

          return NextResponse.json({ status: 'pending', deposit: updatedPending || existingDeposit })
        }

        return NextResponse.json({ error: verification.error || 'Invalid deposit' }, { status: 400 })
      }

      const { data: confirmedRows, error: confirmError } = await supabase.rpc('confirm_deposit', {
        p_wallet_address: walletAddress,
        p_tx_signature: txSignature,
        p_amount: verification.amount,
        p_confirmations: verification.confirmations ?? existingDeposit.confirmations ?? 0,
      })

      if (confirmError || !confirmedRows || confirmedRows.length === 0) {
        return NextResponse.json({ error: confirmError?.message || 'Failed to confirm deposit' }, { status: 500 })
      }

      const confirmed = confirmedRows[0] as any
      return NextResponse.json({
        success: true,
        amount: verification.amount,
        newBalance: confirmed.new_balance,
        deposit: { ...existingDeposit, status: 'confirmed' },
      })
    }
    
    // Verify the deposit on-chain
    const minAmount = Number(expectedAmount || 0)
    if (!Number.isFinite(minAmount) || minAmount < 0 || !Number.isSafeInteger(minAmount)) {
      return NextResponse.json({ error: 'Invalid expected amount' }, { status: 400 })
    }

    const verification = await verifyDeposit(txSignature, walletAddress, minAmount)
    
    if (!verification.valid) {
      if (verification.error === 'Insufficient confirmations') {
        let { data: user } = await supabase
          .from('users')
          .select('id')
          .eq('wallet_address', walletAddress)
          .single()

        const { data: pendingDeposit } = await supabase
          .from('escrow_deposits')
          .upsert({
            user_id: user?.id ?? null,
            wallet_address: walletAddress,
            amount: verification.amount,
            tx_signature: txSignature,
            status: 'pending',
            confirmations: verification.confirmations ?? 0,
          }, { onConflict: 'tx_signature' })
          .select()
          .single()

        return NextResponse.json({ status: 'pending', deposit: pendingDeposit })
      }

      return NextResponse.json({ error: verification.error || 'Invalid deposit' }, { status: 400 })
    }

    const { data: confirmedRows, error: confirmError } = await supabase.rpc('confirm_deposit', {
      p_wallet_address: walletAddress,
      p_tx_signature: txSignature,
      p_amount: verification.amount,
      p_confirmations: verification.confirmations ?? 0,
    })

    if (confirmError || !confirmedRows || confirmedRows.length === 0) {
      return NextResponse.json({ error: confirmError?.message || 'Failed to confirm deposit' }, { status: 500 })
    }

    const confirmed = confirmedRows[0] as any

    return NextResponse.json({
      success: true,
      amount: verification.amount,
      newBalance: confirmed.new_balance,
      deposit: { id: confirmed.deposit_id, tx_signature: txSignature, status: 'confirmed' },
    })
    
  } catch (error) {
    console.error('Deposit error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Get escrow address for deposits
export async function GET(request: NextRequest) {
  try {
    const limited = await rateLimitGate(request, { id: 'deposit_get', windowMs: 30_000, max: 60 })
    if (limited) return limited

    const escrowTokenAccount = await getEscrowTokenAccount()
    const escrowPublicKey = getEscrowPublicKey()
    
    return NextResponse.json({
      escrowTokenAccount,
      escrowPublicKey,
      tokenMint: process.env.NEXT_PUBLIC_TOKEN_MINT
    })
  } catch (error) {
    console.error('Get escrow error:', error)
    return NextResponse.json({ error: 'Failed to get escrow address' }, { status: 500 })
  }
}
