import { Connection, Keypair, PublicKey, Transaction } from '@solana/web3.js'
import { getAssociatedTokenAddress, createTransferInstruction, createAssociatedTokenAccountInstruction, TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token'
import bs58 from 'bs58'

// Initialize connection
function getRpcUrl(): string {
  const urls = process.env.NEXT_PUBLIC_SOLANA_RPC_URLS || process.env.NEXT_PUBLIC_SOLANA_RPC_URL
  if (!urls) return 'https://api.mainnet-beta.solana.com'
  const first = urls
    .split(',')
    .map((u) => u.trim())
    .filter(Boolean)[0]
  return first || 'https://api.mainnet-beta.solana.com'
}

const connection = new Connection(getRpcUrl(), 'confirmed')

let cachedTokenProgramId: {
  mint: string
  programId: PublicKey
} | null = null

// Load escrow wallet from env
function getEscrowKeypair(): Keypair {
  const privateKey = process.env.ESCROW_WALLET_PRIVATE_KEY
  if (!privateKey) {
    throw new Error('ESCROW_WALLET_PRIVATE_KEY not configured')
  }
  return Keypair.fromSecretKey(bs58.decode(privateKey))
}

// Get token mint
function getTokenMint(): PublicKey {
  const mint = process.env.NEXT_PUBLIC_TOKEN_MINT
  if (!mint) {
    throw new Error('NEXT_PUBLIC_TOKEN_MINT not configured')
  }
  return new PublicKey(mint)
}

async function getTokenProgramIdForMint(mint: PublicKey): Promise<PublicKey> {
  const mintKey = mint.toBase58()
  if (cachedTokenProgramId?.mint === mintKey) return cachedTokenProgramId.programId

  const info = await connection.getAccountInfo(mint)
  if (!info) {
    throw new Error('Token mint account not found')
  }

  const programId = info.owner.equals(TOKEN_2022_PROGRAM_ID) ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID
  cachedTokenProgramId = { mint: mintKey, programId }
  return programId
}

// Get fee wallet
function getFeeWallet(): PublicKey {
  const wallet = process.env.FEE_WALLET_ADDRESS
  if (!wallet) {
    throw new Error('FEE_WALLET_ADDRESS not configured')
  }
  return new PublicKey(wallet)
}

export interface DepositResult {
  success: boolean
  txSignature?: string
  amount?: number
  error?: string
}

export interface WithdrawResult {
  success: boolean
  txSignature?: string
  amount?: number
  error?: string
}

// Verify a deposit transaction
export async function verifyDeposit(
  txSignature: string,
  expectedSender: string,
  minAmount: number
): Promise<{ valid: boolean; amount: number; error?: string; confirmations?: number | null; confirmationStatus?: string }> {
  try {
    const escrowWallet = getEscrowKeypair()
    const tokenMint = getTokenMint()

    const tokenProgramId = await getTokenProgramIdForMint(tokenMint)

    if (!Number.isSafeInteger(minAmount) || minAmount < 0) {
      return { valid: false, amount: 0, error: 'Invalid minimum amount' }
    }
    
    // Fetch transaction
    const tx = await connection.getParsedTransaction(txSignature, {
      maxSupportedTransactionVersion: 0
    })
    
    if (!tx) {
      return { valid: false, amount: 0, error: 'Transaction not found' }
    }
    
    if (!tx.meta || tx.meta.err) {
      return { valid: false, amount: 0, error: 'Transaction failed' }
    }
    
    // Find token transfer to escrow
    const escrowAta = await getAssociatedTokenAddress(
      tokenMint,
      escrowWallet.publicKey,
      false,
      tokenProgramId,
      ASSOCIATED_TOKEN_PROGRAM_ID
    )
    
    let depositAmount = 0
    let depositAmountBig = BigInt(0)
    
    // Check post token balances
    if (tx.meta.postTokenBalances && tx.meta.preTokenBalances) {
      for (let i = 0; i < tx.meta.postTokenBalances.length; i++) {
        const post = tx.meta.postTokenBalances[i]
        const pre = tx.meta.preTokenBalances.find(p => p.accountIndex === post.accountIndex)
        
        if (post.mint === tokenMint.toBase58()) {
          let postAmount = BigInt(0)
          try {
            postAmount = BigInt(post.uiTokenAmount.amount)
          } catch {
            return { valid: false, amount: 0, error: 'Invalid token amount' }
          }

          let preAmount = BigInt(0)
          if (pre) {
            try {
              preAmount = BigInt(pre.uiTokenAmount.amount)
            } catch {
              return { valid: false, amount: 0, error: 'Invalid token amount' }
            }
          }

          const diff = postAmount - preAmount
          
          // Check if this is the escrow receiving
          const accountKey = tx.transaction.message.accountKeys[post.accountIndex]
          if (accountKey && accountKey.pubkey.toBase58() === escrowAta.toBase58() && diff > BigInt(0)) {
            depositAmountBig = diff
          }
        }
      }
    }

    if (depositAmountBig > BigInt(Number.MAX_SAFE_INTEGER)) {
      return { valid: false, amount: 0, error: 'Deposit amount too large' }
    }

    depositAmount = Number(depositAmountBig)
    
    if (depositAmount < minAmount) {
      return { valid: false, amount: depositAmount, error: 'Deposit amount too low' }
    }
    
    // Verify sender
    const senderKey = tx.transaction.message.accountKeys[0]
    if (senderKey && senderKey.pubkey.toBase58() !== expectedSender) {
      return { valid: false, amount: depositAmount, error: 'Sender mismatch' }
    }

    const minConfirmations = Number(process.env.DEPOSIT_MIN_CONFIRMATIONS) || 32
    const sigStatus = await connection.getSignatureStatus(txSignature, { searchTransactionHistory: true })
    const status = sigStatus.value
    if (!status) {
      return { valid: false, amount: depositAmount, error: 'Transaction status not found' }
    }

    if (status.err) {
      return { valid: false, amount: depositAmount, error: 'Transaction failed' }
    }

    const confirmationStatus = status.confirmationStatus
    const confirmations = status.confirmations

    const confirmedEnough =
      confirmationStatus === 'finalized' ||
      (typeof confirmations === 'number' && confirmations >= minConfirmations)

    if (!confirmedEnough) {
      return {
        valid: false,
        amount: depositAmount,
        error: 'Insufficient confirmations',
        confirmations,
        confirmationStatus,
      }
    }
    
    return {
      valid: true,
      amount: depositAmount,
      confirmations,
      confirmationStatus,
    }
  } catch (error) {
    console.error('Verify deposit error:', error)
    return { valid: false, amount: 0, error: 'Verification failed' }
  }
}

// Process withdrawal from escrow to user
export async function processWithdrawal(
  userWallet: string,
  amount: number
): Promise<WithdrawResult> {
  try {
    const escrowKeypair = getEscrowKeypair()
    const tokenMint = getTokenMint()
    const tokenProgramId = await getTokenProgramIdForMint(tokenMint)
    const userPubkey = new PublicKey(userWallet)
    
    // Get ATAs
    const escrowAta = await getAssociatedTokenAddress(
      tokenMint,
      escrowKeypair.publicKey,
      false,
      tokenProgramId,
      ASSOCIATED_TOKEN_PROGRAM_ID
    )
    const userAta = await getAssociatedTokenAddress(
      tokenMint,
      userPubkey,
      false,
      tokenProgramId,
      ASSOCIATED_TOKEN_PROGRAM_ID
    )

    const userAtaInfo = await connection.getAccountInfo(userAta)
    
    // Check escrow balance
    const escrowBalance = await connection.getTokenAccountBalance(escrowAta)
    if (Number(escrowBalance.value.amount) < amount) {
      return { success: false, error: 'Insufficient escrow balance' }
    }

    const ixs = [] as any[]

    if (!userAtaInfo) {
      ixs.push(
        createAssociatedTokenAccountInstruction(
          escrowKeypair.publicKey,
          userAta,
          userPubkey,
          tokenMint,
          tokenProgramId,
          ASSOCIATED_TOKEN_PROGRAM_ID
        )
      )
    }
    
    // Create transfer instruction
    const transferIx = createTransferInstruction(
      escrowAta,
      userAta,
      escrowKeypair.publicKey,
      amount,
      [],
      tokenProgramId
    )
    
    // Build and send transaction
    const tx = new Transaction().add(...ixs, transferIx)
    tx.feePayer = escrowKeypair.publicKey
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash
    
    tx.sign(escrowKeypair)
    
    const txSignature = await connection.sendRawTransaction(tx.serialize())
    try {
      await connection.confirmTransaction(txSignature, 'finalized')
      return { success: true, txSignature, amount }
    } catch (error) {
      console.error('Withdrawal confirm error:', error)
      return { success: false, txSignature, amount, error: 'Withdrawal submitted but confirmation pending' }
    }
  } catch (error) {
    console.error('Withdrawal error:', error)
    return { success: false, error: 'Withdrawal failed' }
  }
}

// Transfer fees to fee wallet
export async function transferFees(amount: number): Promise<{ success: boolean; txSignature?: string }> {
  try {
    const escrowKeypair = getEscrowKeypair()
    const tokenMint = getTokenMint()
    const tokenProgramId = await getTokenProgramIdForMint(tokenMint)
    const feeWallet = getFeeWallet()
    
    const escrowAta = await getAssociatedTokenAddress(
      tokenMint,
      escrowKeypair.publicKey,
      false,
      tokenProgramId,
      ASSOCIATED_TOKEN_PROGRAM_ID
    )
    const feeAta = await getAssociatedTokenAddress(
      tokenMint,
      feeWallet,
      false,
      tokenProgramId,
      ASSOCIATED_TOKEN_PROGRAM_ID
    )

    const feeAtaInfo = await connection.getAccountInfo(feeAta)

    const ixs = [] as any[]

    if (!feeAtaInfo) {
      ixs.push(
        createAssociatedTokenAccountInstruction(
          escrowKeypair.publicKey,
          feeAta,
          feeWallet,
          tokenMint,
          tokenProgramId,
          ASSOCIATED_TOKEN_PROGRAM_ID
        )
      )
    }
    
    const transferIx = createTransferInstruction(
      escrowAta,
      feeAta,
      escrowKeypair.publicKey,
      amount,
      [],
      tokenProgramId
    )
    
    const tx = new Transaction().add(...ixs, transferIx)
    tx.feePayer = escrowKeypair.publicKey
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash
    
    tx.sign(escrowKeypair)
    
    const txSignature = await connection.sendRawTransaction(tx.serialize())
    await connection.confirmTransaction(txSignature, 'finalized')
    
    return { success: true, txSignature }
  } catch (error) {
    console.error('Fee transfer error:', error)
    return { success: false }
  }
}

// Get escrow wallet public key (for deposits)
export function getEscrowPublicKey(): string {
  const escrowKeypair = getEscrowKeypair()
  return escrowKeypair.publicKey.toBase58()
}

// Get escrow token account (for deposits)
export async function getEscrowTokenAccount(): Promise<string> {
  const escrowKeypair = getEscrowKeypair()
  const tokenMint = getTokenMint()
  const tokenProgramId = await getTokenProgramIdForMint(tokenMint)
  const ata = await getAssociatedTokenAddress(
    tokenMint,
    escrowKeypair.publicKey,
    false,
    tokenProgramId,
    ASSOCIATED_TOKEN_PROGRAM_ID
  )
  return ata.toBase58()
}
