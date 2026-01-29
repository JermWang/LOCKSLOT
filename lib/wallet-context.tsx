"use client"

import React, { createContext, useContext, useState, useCallback, useEffect } from "react"
import { 
  Connection, 
  PublicKey, 
  Transaction, 
  VersionedTransaction,
  TransactionInstruction 
} from "@solana/web3.js"
import { 
  getAssociatedTokenAddress, 
  createTransferInstruction,
  createAssociatedTokenAccountInstruction,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID
} from "@solana/spl-token"

// RPC connection
function getRpcUrl(): string {
  const urls = process.env.NEXT_PUBLIC_SOLANA_RPC_URLS || process.env.NEXT_PUBLIC_SOLANA_RPC_URL
  if (!urls) return "https://api.mainnet-beta.solana.com"
  return urls.split(",").map(u => u.trim()).filter(Boolean)[0] || "https://api.mainnet-beta.solana.com"
}

const connection = new Connection(getRpcUrl(), "confirmed")

// Token mint from env
function getTokenMint(): PublicKey | null {
  const mint = process.env.NEXT_PUBLIC_TOKEN_MINT
  if (!mint) return null
  try {
    return new PublicKey(mint)
  } catch {
    return null
  }
}

export interface TransactionPreview {
  amount: number           // Amount in token base units
  displayAmount: string    // Human-readable amount
  recipient: string        // Escrow token account
  tokenMint: string        // Token mint address
  estimatedFee: number     // Estimated SOL fee in lamports
}

interface WalletContextType {
  connected: boolean
  publicKey: string | null
  connecting: boolean
  connect: () => Promise<void>
  disconnect: () => void
  walletName: string | null
  // SPL Token transactions
  signAndSendTransaction: (tx: Transaction | VersionedTransaction) => Promise<string>
  buildDepositTransaction: (amount: number, escrowTokenAccount: string) => Promise<{ tx: Transaction; preview: TransactionPreview }>
  getTokenBalance: () => Promise<number>
}

const WalletContext = createContext<WalletContextType>({
  connected: false,
  publicKey: null,
  connecting: false,
  connect: async () => {},
  disconnect: () => {},
  walletName: null,
  signAndSendTransaction: async () => { throw new Error("Not connected") },
  buildDepositTransaction: async () => { throw new Error("Not connected") },
  getTokenBalance: async () => 0,
})

export function useWallet() {
  return useContext(WalletContext)
}

declare global {
  interface Window {
    solana?: {
      isPhantom?: boolean
      connect: () => Promise<{ publicKey: { toString: () => string } }>
      disconnect: () => Promise<void>
      on: (event: string, callback: () => void) => void
      publicKey?: { toString: () => string; toBytes: () => Uint8Array }
      isConnected?: boolean
      signAndSendTransaction: (tx: Transaction | VersionedTransaction, options?: any) => Promise<{ signature: string }>
      signTransaction: (tx: Transaction | VersionedTransaction) => Promise<Transaction | VersionedTransaction>
    }
    solflare?: {
      isSolflare?: boolean
      connect: () => Promise<{ publicKey: { toString: () => string } }>
      disconnect: () => Promise<void>
      on: (event: string, callback: () => void) => void
      publicKey?: { toString: () => string; toBytes: () => Uint8Array }
      isConnected?: boolean
      signAndSendTransaction: (tx: Transaction | VersionedTransaction, options?: any) => Promise<{ signature: string }>
      signTransaction: (tx: Transaction | VersionedTransaction) => Promise<Transaction | VersionedTransaction>
    }
  }
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [connected, setConnected] = useState(false)
  const [publicKey, setPublicKey] = useState<string | null>(null)
  const [connecting, setConnecting] = useState(false)
  const [walletName, setWalletName] = useState<string | null>(null)

  // Check for existing connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window === "undefined") return
      
      // Check Phantom
      if (window.solana?.isPhantom && window.solana.isConnected && window.solana.publicKey) {
        setConnected(true)
        setPublicKey(window.solana.publicKey.toString())
        setWalletName("Phantom")
      }
      // Check Solflare
      else if (window.solflare?.isSolflare && window.solflare.isConnected && window.solflare.publicKey) {
        setConnected(true)
        setPublicKey(window.solflare.publicKey.toString())
        setWalletName("Solflare")
      }
    }
    
    checkConnection()
  }, [])

  const connect = useCallback(async () => {
    if (typeof window === "undefined") return
    setConnecting(true)

    try {
      // Try Phantom first
      if (window.solana?.isPhantom) {
        const response = await window.solana.connect()
        setConnected(true)
        setPublicKey(response.publicKey.toString())
        setWalletName("Phantom")
        
        window.solana.on("disconnect", () => {
          setConnected(false)
          setPublicKey(null)
          setWalletName(null)
        })
      }
      // Try Solflare
      else if (window.solflare?.isSolflare) {
        const response = await window.solflare.connect()
        setConnected(true)
        setPublicKey(response.publicKey.toString())
        setWalletName("Solflare")
        
        window.solflare.on("disconnect", () => {
          setConnected(false)
          setPublicKey(null)
          setWalletName(null)
        })
      }
      // No wallet found
      else {
        window.open("https://phantom.app/", "_blank")
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error)
    } finally {
      setConnecting(false)
    }
  }, [])

  const disconnect = useCallback(async () => {
    if (typeof window === "undefined") return

    try {
      if (window.solana?.isPhantom) {
        await window.solana.disconnect()
      } else if (window.solflare?.isSolflare) {
        await window.solflare.disconnect()
      }
    } catch (error) {
      console.error("Failed to disconnect:", error)
    }

    setConnected(false)
    setPublicKey(null)
    setWalletName(null)
  }, [])

  // Sign and send a transaction using the connected wallet
  const signAndSendTransaction = useCallback(async (tx: Transaction | VersionedTransaction): Promise<string> => {
    if (typeof window === "undefined") throw new Error("Not in browser")
    if (!connected || !publicKey) throw new Error("Wallet not connected")

    let signature: string

    if (window.solana?.isPhantom) {
      const result = await window.solana.signAndSendTransaction(tx)
      signature = result.signature
    } else if (window.solflare?.isSolflare) {
      const result = await window.solflare.signAndSendTransaction(tx)
      signature = result.signature
    } else {
      throw new Error("No compatible wallet found")
    }

    // Wait for confirmation
    await connection.confirmTransaction(signature, "confirmed")
    return signature
  }, [connected, publicKey])

  // Build a deposit transaction for SPL token transfer to escrow
  const buildDepositTransaction = useCallback(async (
    amount: number, 
    escrowTokenAccount: string
  ): Promise<{ tx: Transaction; preview: TransactionPreview }> => {
    if (!connected || !publicKey) throw new Error("Wallet not connected")
    
    const tokenMint = getTokenMint()
    if (!tokenMint) throw new Error("Token mint not configured")

    const userPubkey = new PublicKey(publicKey)
    const escrowAta = new PublicKey(escrowTokenAccount)
    
    // Get user's associated token account
    const userAta = await getAssociatedTokenAddress(tokenMint, userPubkey)
    
    // Check if user has the token account
    const userAtaInfo = await connection.getAccountInfo(userAta)
    if (!userAtaInfo) {
      throw new Error("You don't have a token account. Please ensure you have tokens first.")
    }

    // Verify user has enough balance
    const userTokenBalance = await connection.getTokenAccountBalance(userAta)
    const userBalance = Number(userTokenBalance.value.amount)
    if (userBalance < amount) {
      throw new Error(`Insufficient token balance. You have ${userTokenBalance.value.uiAmountString} tokens.`)
    }

    // Build transfer instruction
    const transferIx = createTransferInstruction(
      userAta,           // source (user's token account)
      escrowAta,         // destination (escrow token account)
      userPubkey,        // owner/authority
      amount,            // amount in base units
      [],                // no multisig
      TOKEN_PROGRAM_ID
    )

    // Build transaction
    const tx = new Transaction()
    tx.add(transferIx)
    tx.feePayer = userPubkey
    
    // Get recent blockhash
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed")
    tx.recentBlockhash = blockhash
    tx.lastValidBlockHeight = lastValidBlockHeight

    // Calculate display amount (assuming 9 decimals, adjust as needed)
    const decimals = userTokenBalance.value.decimals
    const displayAmount = (amount / Math.pow(10, decimals)).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals
    })

    // Estimate transaction fee
    const feeEstimate = await connection.getFeeForMessage(tx.compileMessage(), "confirmed")
    const estimatedFee = feeEstimate.value || 5000 // default 5000 lamports

    const preview: TransactionPreview = {
      amount,
      displayAmount,
      recipient: escrowTokenAccount,
      tokenMint: tokenMint.toBase58(),
      estimatedFee,
    }

    return { tx, preview }
  }, [connected, publicKey])

  // Get user's SPL token balance
  const getTokenBalance = useCallback(async (): Promise<number> => {
    if (!connected || !publicKey) {
      console.log("[getTokenBalance] Not connected or no publicKey")
      return 0
    }
    
    const tokenMint = getTokenMint()
    if (!tokenMint) {
      console.error("[getTokenBalance] NEXT_PUBLIC_TOKEN_MINT not configured:", process.env.NEXT_PUBLIC_TOKEN_MINT)
      return 0
    }
    
    console.log("[getTokenBalance] Token mint:", tokenMint.toBase58())

    try {
      const userPubkey = new PublicKey(publicKey)
      const userAta = await getAssociatedTokenAddress(tokenMint, userPubkey)
      console.log("[getTokenBalance] User ATA:", userAta.toBase58())
      const balance = await connection.getTokenAccountBalance(userAta)
      console.log("[getTokenBalance] Balance:", balance.value.amount, "uiAmount:", balance.value.uiAmountString)
      return Number(balance.value.amount)
    } catch (err) {
      console.error("[getTokenBalance] Error fetching balance:", err)
      return 0
    }
  }, [connected, publicKey])

  return (
    <WalletContext.Provider
      value={{
        connected,
        publicKey,
        connecting,
        connect,
        disconnect,
        walletName,
        signAndSendTransaction,
        buildDepositTransaction,
        getTokenBalance,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}
