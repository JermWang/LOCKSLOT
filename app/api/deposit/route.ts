import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { verifyDeposit, getEscrowTokenAccount } from '@/lib/escrow'
import { rateLimitGate } from '@/lib/api-guard'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const limited = rateLimitGate(request, { id: 'deposit', windowMs: 30_000, max: 10 })
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
        return NextResponse.json({ error: 'Deposit already processed' }, { status: 400 })
      }

      // Re-check pending deposits so they can confirm once finalized
      const minAmount = Number(expectedAmount || 0)
      if (!Number.isFinite(minAmount) || minAmount < 0) {
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

      // Confirm and credit
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

      const { data: confirmedDeposit, error: confirmError } = await supabase
        .from('escrow_deposits')
        .update({
          user_id: user.id,
          wallet_address: walletAddress,
          amount: verification.amount,
          status: 'confirmed',
          confirmations: verification.confirmations ?? existingDeposit.confirmations ?? 0,
          confirmed_at: new Date().toISOString(),
        })
        .eq('id', existingDeposit.id)
        .select()
        .single()

      if (confirmError) {
        return NextResponse.json({ error: 'Failed to record deposit' }, { status: 500 })
      }

      const newBalance = user.balance + verification.amount

      const { error: updateError } = await supabase
        .from('users')
        .update({
          balance: newBalance,
          total_deposited: user.total_deposited + verification.amount,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (updateError) {
        return NextResponse.json({ error: 'Failed to update balance' }, { status: 500 })
      }

      await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: 'deposit',
          amount: verification.amount,
          balance_before: user.balance,
          balance_after: newBalance,
          tx_signature: txSignature
        })

      return NextResponse.json({
        success: true,
        amount: verification.amount,
        newBalance,
        deposit: confirmedDeposit,
      })
    }
    
    // Verify the deposit on-chain
    const minAmount = Number(expectedAmount || 0)
    if (!Number.isFinite(minAmount) || minAmount < 0) {
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
          .insert({
            user_id: user?.id ?? null,
            wallet_address: walletAddress,
            amount: verification.amount,
            tx_signature: txSignature,
            status: 'pending',
            confirmations: verification.confirmations ?? 0,
          })
          .select()
          .single()

        return NextResponse.json({ status: 'pending', deposit: pendingDeposit })
      }

      return NextResponse.json({ error: verification.error || 'Invalid deposit' }, { status: 400 })
    }
    
    // Get or create user
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
    
    // Record deposit
    const { data: deposit, error: depositError } = await supabase
      .from('escrow_deposits')
      .insert({
        user_id: user.id,
        wallet_address: walletAddress,
        amount: verification.amount,
        tx_signature: txSignature,
        status: 'confirmed',
        confirmations: verification.confirmations ?? 0,
        confirmed_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (depositError) {
      return NextResponse.json({ error: 'Failed to record deposit' }, { status: 500 })
    }
    
    // Update user balance
    const newBalance = user.balance + verification.amount
    
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        balance: newBalance,
        total_deposited: user.total_deposited + verification.amount,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
    
    if (updateError) {
      return NextResponse.json({ error: 'Failed to update balance' }, { status: 500 })
    }
    
    // Record transaction
    await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        type: 'deposit',
        amount: verification.amount,
        balance_before: user.balance,
        balance_after: newBalance,
        tx_signature: txSignature
      })
    
    return NextResponse.json({
      success: true,
      amount: verification.amount,
      newBalance,
      deposit
    })
    
  } catch (error) {
    console.error('Deposit error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Get escrow address for deposits
export async function GET(request: NextRequest) {
  try {
    const limited = rateLimitGate(request, { id: 'deposit_get', windowMs: 30_000, max: 60 })
    if (limited) return limited

    const escrowTokenAccount = await getEscrowTokenAccount()
    
    return NextResponse.json({
      escrowTokenAccount,
      tokenMint: process.env.NEXT_PUBLIC_TOKEN_MINT
    })
  } catch (error) {
    console.error('Get escrow error:', error)
    return NextResponse.json({ error: 'Failed to get escrow address' }, { status: 500 })
  }
}
