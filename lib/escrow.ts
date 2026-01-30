import { Connection, Keypair, PublicKey, Transaction } from '@solana/web3.js'
import { getAssociatedTokenAddress, createTransferInstruction, createAssociatedTokenAccountInstruction, TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token'
import bs58 from 'bs58'

// Initialize connection
function getRpcUrls(): string[] {
  const urls = process.env.NEXT_PUBLIC_SOLANA_RPC_URLS || process.env.NEXT_PUBLIC_SOLANA_RPC_URL
  if (!urls) return ['https://api.mainnet-beta.solana.com']
  const list = urls
    .split(',')
    .map((u) => u.trim())
    .filter(Boolean)
  return list.length ? list : ['https://api.mainnet-beta.solana.com']
}

const rpcUrls = getRpcUrls()
let rpcIndex = 0

function buildConnection(url: string): Connection {
  return new Connection(url, 'confirmed')
}

function isUnauthorized(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error)
  return message.includes('401') || message.toLowerCase().includes('unauthorized')
}

function isRateLimited(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error)
  return message.includes('429') || message.toLowerCase().includes('too many requests')
}

function isRetryableRpcError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error)
  return (
    isUnauthorized(error) ||
    isRateLimited(error) ||
    message.includes('503') ||
    message.toLowerCase().includes('timeout')
  )
}

async function withRpcFallback<T>(fn: (conn: Connection) => Promise<T>): Promise<T> {
  let lastError: unknown
  for (let offset = 0; offset < rpcUrls.length; offset += 1) {
    const candidateIndex = (rpcIndex + offset) % rpcUrls.length
    const candidateUrl = rpcUrls[candidateIndex]
    const candidateConn = candidateIndex === rpcIndex ? connection : buildConnection(candidateUrl)

    try {
      const result = await fn(candidateConn)
      if (candidateIndex !== rpcIndex) {
        rpcIndex = candidateIndex
        connection = candidateConn
        console.warn(`[escrow] Switched RPC to ${candidateUrl}`)
      }
      return result
    } catch (error) {
      lastError = error
      if (!isRetryableRpcError(error) || offset === rpcUrls.length - 1) {
        throw error
      }
    }
  }

  throw lastError
}

// Build a withdrawal transaction that the user signs/pays for
export async function buildWithdrawalTransaction(
  userWallet: string,
  amount: number
): Promise<WithdrawBuildResult> {
  try {
    const escrowKeypair = getEscrowKeypair()
    const tokenMint = getTokenMint()
    const tokenProgramId = await getTokenProgramIdForMint(tokenMint)
    const userPubkey = new PublicKey(userWallet)

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

    const userAtaInfo = await withRpcFallback((conn) => conn.getAccountInfo(userAta))

    const escrowBalance = await withRpcFallback((conn) => conn.getTokenAccountBalance(escrowAta))
    if (Number(escrowBalance.value.amount) < amount) {
      return { success: false, error: "Insufficient escrow balance" }
    }

    const ixs = [] as any[]
    if (!userAtaInfo) {
      ixs.push(
        createAssociatedTokenAccountInstruction(
          userPubkey,
          userAta,
          userPubkey,
          tokenMint,
          tokenProgramId,
          ASSOCIATED_TOKEN_PROGRAM_ID
        )
      )
    }

    const transferIx = createTransferInstruction(
      escrowAta,
      userAta,
      escrowKeypair.publicKey,
      amount,
      [],
      tokenProgramId
    )

    const tx = new Transaction().add(...ixs, transferIx)
    tx.feePayer = userPubkey
    const { blockhash, lastValidBlockHeight } = await withRpcFallback((conn) => conn.getLatestBlockhash("confirmed"))
    tx.recentBlockhash = blockhash
    tx.lastValidBlockHeight = lastValidBlockHeight

    tx.partialSign(escrowKeypair)

    const serialized = tx.serialize({ requireAllSignatures: false })

    return {
      success: true,
      transaction: Buffer.from(serialized).toString("base64"),
      blockhash,
      lastValidBlockHeight,
    }
  } catch (error) {
    console.error("Build withdrawal transaction error:", error)
    return { success: false, error: "Withdrawal build failed" }
  }
}

let connection = buildConnection(rpcUrls[rpcIndex])

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

  const info = await withRpcFallback((conn) => conn.getAccountInfo(mint))
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

export interface WithdrawBuildResult {
  success: boolean
  transaction?: string
  blockhash?: string
  lastValidBlockHeight?: number
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
    const tx = await withRpcFallback((conn) =>
      conn.getParsedTransaction(txSignature, {
        maxSupportedTransactionVersion: 0,
      })
    )
    
    if (!tx) {
      return { valid: false, amount: 0, error: 'Insufficient confirmations', confirmations: null }
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
    
    // Verify sender (do not assume accountKeys[0] is the sender; check signer set)
    const senderSigned = tx.transaction.message.accountKeys.some((k: any) => {
      const signer = !!k?.signer || !!k?.isSigner
      const pubkey = k?.pubkey?.toBase58 ? k.pubkey.toBase58() : undefined
      return signer && pubkey === expectedSender
    })
    if (!senderSigned) {
      return { valid: false, amount: depositAmount, error: 'Sender mismatch' }
    }

    const minConfirmations = Number(process.env.DEPOSIT_MIN_CONFIRMATIONS) || 32
    const sigStatus = await withRpcFallback((conn) =>
      conn.getSignatureStatus(txSignature, { searchTransactionHistory: true })
    )
    const status = sigStatus.value
    if (!status) {
      return {
        valid: false,
        amount: depositAmount,
        error: 'Insufficient confirmations',
        confirmations: null,
      }
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

    const userAtaInfo = await withRpcFallback((conn) => conn.getAccountInfo(userAta))
    
    // Check escrow balance
    const escrowBalance = await withRpcFallback((conn) => conn.getTokenAccountBalance(escrowAta))
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
    tx.recentBlockhash = (await withRpcFallback((conn) => conn.getLatestBlockhash())).blockhash
    
    tx.sign(escrowKeypair)
    
    const txSignature = await withRpcFallback((conn) => conn.sendRawTransaction(tx.serialize()))
    try {
      await withRpcFallback((conn) => conn.confirmTransaction(txSignature, 'finalized'))
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

    const feeAtaInfo = await withRpcFallback((conn) => conn.getAccountInfo(feeAta))

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
    tx.recentBlockhash = (await withRpcFallback((conn) => conn.getLatestBlockhash())).blockhash
    
    tx.sign(escrowKeypair)
    
    const txSignature = await withRpcFallback((conn) => conn.sendRawTransaction(tx.serialize()))
    await withRpcFallback((conn) => conn.confirmTransaction(txSignature, 'finalized'))
    
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
