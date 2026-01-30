"use client"

import { useState, useEffect, useCallback } from "react"
import { useWallet } from "@/lib/wallet-context"
import { useGameStore } from "@/lib/game-store"
import { Transaction } from "@solana/web3.js"
import { ArrowDownToLine, ArrowUpFromLine, Loader2, RefreshCw, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { 
  toBaseUnits, 
  fromBaseUnits, 
  formatTokenAmount, 
  formatTokenAmountFromBase,
  formatTokenAmountFullFromBase 
} from "@/lib/token-utils"
import { gameToast } from "@/lib/toast"
import { gameSounds } from "@/lib/sounds"

const TOKEN_SYMBOL = process.env.NEXT_PUBLIC_TOKEN_SYMBOL || "TOKENS"

type Tab = "deposit" | "withdraw"

export function DepositWithdraw() {
  const { connected, publicKey, getTokenBalance, buildDepositTransaction, signAndSendTransaction } = useWallet()
  const { userBalance, deposit, withdraw, submitWithdrawal } = useGameStore()
  
  const [activeTab, setActiveTab] = useState<Tab>("deposit")
  const [amount, setAmount] = useState("")
  const [walletBalance, setWalletBalance] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [escrowAccount, setEscrowAccount] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const decodeBase64 = (value: string) => {
    if (typeof window !== "undefined" && typeof window.atob === "function") {
      const binary = window.atob(value)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i)
      }
      return bytes
    }

    const nodeBuffer = (globalThis as any).Buffer
    if (nodeBuffer?.from) {
      return new Uint8Array(nodeBuffer.from(value, "base64"))
    }

    throw new Error("Base64 decoding unavailable")
  }

  // Fetch wallet balance
  const fetchWalletBalance = useCallback(async () => {
    if (!connected) {
      setWalletBalance(null)
      return
    }
    try {
      const bal = await getTokenBalance()
      setWalletBalance(bal)
    } catch {
      setWalletBalance(null)
    }
  }, [connected, getTokenBalance])

  // Fetch escrow account on mount
  useEffect(() => {
    const fetchEscrow = async () => {
      try {
        const res = await fetch("/api/deposit")
        if (res.ok) {
          const data = await res.json()
          setEscrowAccount(data.escrowTokenAccount)
        }
      } catch (err) {
        console.error("Failed to fetch escrow account:", err)
      }
    }
    fetchEscrow()
  }, [])

  // Fetch wallet balance on connect
  useEffect(() => {
    if (connected) {
      fetchWalletBalance()
      const interval = setInterval(fetchWalletBalance, 30000)
      return () => clearInterval(interval)
    } else {
      setWalletBalance(null)
    }
  }, [connected, fetchWalletBalance])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchWalletBalance()
    setTimeout(() => setRefreshing(false), 500)
  }

  const parsedAmount = parseFloat(amount) || 0
  const amountInBaseUnits = toBaseUnits(parsedAmount)

  const maxDeposit = walletBalance !== null ? fromBaseUnits(walletBalance) : 0
  const maxWithdraw = fromBaseUnits(userBalance)

  const canDeposit = parsedAmount > 0 && amountInBaseUnits <= (walletBalance || 0) && escrowAccount
  const canWithdraw = parsedAmount > 0 && amountInBaseUnits <= userBalance

  const handleSetMax = () => {
    if (activeTab === "deposit" && walletBalance !== null) {
      setAmount(fromBaseUnits(walletBalance).toString())
    } else if (activeTab === "withdraw") {
      setAmount(fromBaseUnits(userBalance).toString())
    }
  }

  const handleDeposit = async () => {
    if (!canDeposit || !escrowAccount) return
    setError(null)
    setLoading(true)
    gameSounds.click()

    try {
      // Build transaction
      const { tx, preview } = await buildDepositTransaction(amountInBaseUnits, escrowAccount)
      
      // Sign and send
      const txSignature = await signAndSendTransaction(tx)
      
      // Record deposit in backend
      await deposit(txSignature, amountInBaseUnits)
      
      // Clear form and refresh
      setAmount("")
      await fetchWalletBalance()
    } catch (err: any) {
      console.error("Deposit error:", err)
      const msg = err?.message || "Deposit failed"
      setError(msg)
      gameToast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleWithdraw = async () => {
    if (!canWithdraw) return
    setError(null)
    setLoading(true)
    gameSounds.click()

    try {
      const result = await withdraw(amountInBaseUnits)

      if (result.status === "manual_review") {
        setAmount("")
        setError("Withdrawal queued for manual review.")
        return
      }

      if (result.status === "submitted") {
        gameToast.withdraw(amountInBaseUnits, result.txSignature)
        setAmount("")
        await fetchWalletBalance()
        return
      }

      const txBytes = decodeBase64(result.transaction)
      const tx = Transaction.from(txBytes)
      const txSignature = await signAndSendTransaction(tx)

      try {
        await submitWithdrawal(result.txId, txSignature)
      } catch (submitError: any) {
        setError(
          submitError?.message ||
            "Withdrawal submitted on-chain but failed to record. Please refresh and try again."
        )
      }

      gameToast.withdraw(amountInBaseUnits, txSignature)

      // Clear form and refresh
      setAmount("")
      await fetchWalletBalance()
    } catch (err: any) {
      console.error("Withdraw error:", err)
      const msg = err?.message || "Withdrawal failed"
      setError(msg)
      gameToast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  if (!connected) {
    return (
      <div className="cyber-panel p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-[#1a3a4a]/30 flex items-center justify-center">
            <ArrowDownToLine className="h-4 w-4 text-[#00d4aa]" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-[#e8f4f8] uppercase tracking-wider">Deposit / Withdraw</h3>
            <p className="text-[10px] text-[#6b8a9a]">Connect wallet to manage funds</p>
          </div>
        </div>
        <div className="text-center py-4 text-sm text-[#6b8a9a]">
          Connect your wallet to deposit or withdraw tokens
        </div>
      </div>
    )
  }

  return (
    <div className="cyber-panel p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#1a3a4a]/30 flex items-center justify-center">
            {activeTab === "deposit" ? (
              <ArrowDownToLine className="h-4 w-4 text-[#00d4aa]" />
            ) : (
              <ArrowUpFromLine className="h-4 w-4 text-[#00b4d8]" />
            )}
          </div>
          <div>
            <h3 className="text-xs font-semibold text-[#e8f4f8] uppercase tracking-wider">Manage Funds</h3>
            <p className="text-[10px] text-[#6b8a9a]">Deposit or withdraw tokens</p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-1.5 rounded-lg bg-[#1a3a4a]/30 border border-[#1a3a4a]/50
                     hover:bg-[#1a3a4a]/50 hover:border-[#00d4aa]/30 
                     transition-all duration-200 disabled:opacity-50"
          title="Refresh balances"
        >
          <RefreshCw className={cn(
            "h-3.5 w-3.5 text-[#6b8a9a]",
            refreshing && "animate-spin text-[#00d4aa]"
          )} />
        </button>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-1 p-1 bg-[#081420] rounded-lg mb-4">
        <button
          onClick={() => { setActiveTab("deposit"); setAmount(""); setError(null); }}
          className={cn(
            "flex-1 py-2 px-3 rounded-md text-sm font-semibold transition-all duration-200",
            activeTab === "deposit"
              ? "bg-[#00d4aa]/20 text-[#00d4aa] border border-[#00d4aa]/30"
              : "text-[#6b8a9a] hover:text-[#e8f4f8] hover:bg-[#1a3a4a]/30"
          )}
        >
          <ArrowDownToLine className="h-4 w-4 inline mr-1.5" />
          Deposit
        </button>
        <button
          onClick={() => { setActiveTab("withdraw"); setAmount(""); setError(null); }}
          className={cn(
            "flex-1 py-2 px-3 rounded-md text-sm font-semibold transition-all duration-200",
            activeTab === "withdraw"
              ? "bg-[#00b4d8]/20 text-[#00b4d8] border border-[#00b4d8]/30"
              : "text-[#6b8a9a] hover:text-[#e8f4f8] hover:bg-[#1a3a4a]/30"
          )}
        >
          <ArrowUpFromLine className="h-4 w-4 inline mr-1.5" />
          Withdraw
        </button>
      </div>

      {/* Balance Display */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 rounded-lg bg-[#081420] border border-[#1a3a4a]/50">
          <p className="text-[10px] text-[#6b8a9a] uppercase mb-1">Wallet Balance</p>
          <p className="font-mono text-sm font-bold text-[#e8f4f8]">
            {walletBalance !== null ? formatTokenAmountFromBase(walletBalance) : "..."}
          </p>
          <p className="text-[9px] text-[#6b8a9a]">{TOKEN_SYMBOL}</p>
        </div>
        <div className="p-3 rounded-lg bg-[#081420] border border-[#1a3a4a]/50">
          <p className="text-[10px] text-[#6b8a9a] uppercase mb-1">Game Balance</p>
          <p className="font-mono text-sm font-bold text-[#00d4aa]">
            {formatTokenAmountFromBase(userBalance)}
          </p>
          <p className="text-[9px] text-[#6b8a9a]">{TOKEN_SYMBOL}</p>
        </div>
      </div>

      {/* Amount Input */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between">
          <label className="text-xs text-[#6b8a9a]">Amount ({TOKEN_SYMBOL})</label>
          <button
            onClick={handleSetMax}
            className="text-[10px] text-[#00d4aa] hover:text-[#00d4aa]/80 font-semibold"
          >
            MAX: {formatTokenAmount(activeTab === "deposit" ? maxDeposit : maxWithdraw)}
          </button>
        </div>
        <div className="relative">
          <input
            type="number"
            value={amount}
            onChange={(e) => { setAmount(e.target.value); setError(null); }}
            placeholder="0.00"
            min="0"
            step="any"
            disabled={loading}
            className="w-full px-4 py-3 rounded-lg bg-[#081420] border border-[#1a3a4a]/50 
                       text-[#e8f4f8] font-mono text-lg placeholder:text-[#3a5a6a]
                       focus:outline-none focus:border-[#00d4aa]/50 focus:ring-1 focus:ring-[#00d4aa]/20
                       disabled:opacity-50 disabled:cursor-not-allowed
                       [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <Image src="/logo.png" alt="" width={20} height={20} className="rounded" />
            <span className="text-xs text-[#6b8a9a] font-semibold">{TOKEN_SYMBOL}</span>
          </div>
        </div>
        
        {/* Amount in base units preview */}
        {parsedAmount > 0 && (
          <p className="text-[10px] text-[#6b8a9a] font-mono">
            = {amountInBaseUnits.toLocaleString()} base units
          </p>
        )}
      </div>

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-2"
          >
            <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-400">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Button */}
      {activeTab === "deposit" ? (
        <button
          onClick={handleDeposit}
          disabled={!canDeposit || loading}
          className={cn(
            "w-full py-3 rounded-lg font-semibold text-sm transition-all duration-200",
            "bg-gradient-to-r from-[#00d4aa] to-[#00b4d8] text-[#0a1628]",
            "hover:from-[#00d4aa]/90 hover:to-[#00b4d8]/90",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:from-[#1a3a4a] disabled:to-[#1a3a4a] disabled:text-[#6b8a9a]",
            "shadow-lg shadow-[#00d4aa]/20"
          )}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <ArrowDownToLine className="h-4 w-4" />
              Deposit {parsedAmount > 0 ? formatTokenAmount(parsedAmount) : ""} {TOKEN_SYMBOL}
            </span>
          )}
        </button>
      ) : (
        <button
          onClick={handleWithdraw}
          disabled={!canWithdraw || loading}
          className={cn(
            "w-full py-3 rounded-lg font-semibold text-sm transition-all duration-200",
            "bg-gradient-to-r from-[#00b4d8] to-[#0077b6] text-white",
            "hover:from-[#00b4d8]/90 hover:to-[#0077b6]/90",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:from-[#1a3a4a] disabled:to-[#1a3a4a] disabled:text-[#6b8a9a]",
            "shadow-lg shadow-[#00b4d8]/20"
          )}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <ArrowUpFromLine className="h-4 w-4" />
              Withdraw {parsedAmount > 0 ? formatTokenAmount(parsedAmount) : ""} {TOKEN_SYMBOL}
            </span>
          )}
        </button>
      )}

      {/* Info text */}
      <p className="mt-3 text-[10px] text-[#6b8a9a] text-center">
        {activeTab === "deposit" 
          ? "Tokens are transferred to the game escrow. You can withdraw anytime (unless locked)."
          : "Withdrawals are processed from your available game balance."
        }
      </p>
    </div>
  )
}
