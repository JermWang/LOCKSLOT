"use client"

import { useState, useEffect, useCallback } from "react"
import { useWallet } from "@/lib/wallet-context"
import { Wallet, RefreshCw, TrendingUp, Coins } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

// Token decimals - adjust based on your token
const TOKEN_DECIMALS = 9
const TOKEN_SYMBOL = process.env.NEXT_PUBLIC_TOKEN_SYMBOL || "TOKENS"

function formatBalance(rawBalance: number): string {
  const balance = rawBalance / Math.pow(10, TOKEN_DECIMALS)
  if (balance >= 1_000_000) {
    return `${(balance / 1_000_000).toFixed(2)}M`
  } else if (balance >= 1_000) {
    return `${(balance / 1_000).toFixed(2)}K`
  } else if (balance >= 1) {
    return balance.toFixed(2)
  } else {
    return balance.toFixed(4)
  }
}

function formatFullBalance(rawBalance: number): string {
  const balance = rawBalance / Math.pow(10, TOKEN_DECIMALS)
  return balance.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4
  })
}

export function TokenBalance() {
  const { connected, publicKey, getTokenBalance, connect, connecting } = useWallet()
  const [balance, setBalance] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchBalance = useCallback(async () => {
    if (!connected) {
      setBalance(null)
      return
    }

    setLoading(true)
    try {
      const bal = await getTokenBalance()
      setBalance(bal)
      setLastUpdate(new Date())
    } catch (error) {
      console.error("Failed to fetch balance:", error)
      setBalance(null)
    } finally {
      setLoading(false)
    }
  }, [connected, getTokenBalance])

  // Fetch balance on connect and set up polling
  useEffect(() => {
    if (connected) {
      fetchBalance()
      // Poll every 30 seconds for live updates
      const interval = setInterval(fetchBalance, 30000)
      return () => clearInterval(interval)
    } else {
      setBalance(null)
    }
  }, [connected, fetchBalance])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchBalance()
    setTimeout(() => setIsRefreshing(false), 500)
  }

  // Not connected state
  if (!connected) {
    return (
      <div className="cyber-panel cyber-corners p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#1a3a4a]/50 flex items-center justify-center">
              <Wallet className="h-4 w-4 text-[#00d4aa]" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-[#e8f4f8] uppercase tracking-wider">Token Balance</h3>
              <p className="text-[10px] text-[#6b8a9a]">Connect to view</p>
            </div>
          </div>
        </div>
        
        <button
          onClick={connect}
          disabled={connecting}
          className="w-full py-2.5 rounded-lg bg-gradient-to-r from-[#00d4aa]/20 to-[#00d4aa]/10 
                     border border-[#00d4aa]/30 text-[#00d4aa] text-sm font-semibold
                     hover:from-[#00d4aa]/30 hover:to-[#00d4aa]/20 hover:border-[#00d4aa]/50
                     transition-all duration-200 disabled:opacity-50"
        >
          {connecting ? (
            <span className="flex items-center justify-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Connecting...
            </span>
          ) : (
            "Connect Wallet"
          )}
        </button>
      </div>
    )
  }

  return (
    <div className="cyber-panel cyber-corners p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00d4aa]/20 to-[#00d4aa]/5 
                          border border-[#00d4aa]/30 flex items-center justify-center">
            <Coins className="h-4 w-4 text-[#00d4aa]" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-[#e8f4f8] uppercase tracking-wider">Your Balance</h3>
            <p className="text-[10px] text-[#6b8a9a] font-mono">
              {publicKey?.slice(0, 4)}...{publicKey?.slice(-4)}
            </p>
          </div>
        </div>
        
        {/* Refresh button */}
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="p-1.5 rounded-lg bg-[#1a3a4a]/30 border border-[#1a3a4a]/50
                     hover:bg-[#1a3a4a]/50 hover:border-[#00d4aa]/30 
                     transition-all duration-200 disabled:opacity-50"
          title="Refresh balance"
        >
          <RefreshCw className={cn(
            "h-3.5 w-3.5 text-[#6b8a9a]",
            isRefreshing && "animate-spin text-[#00d4aa]"
          )} />
        </button>
      </div>

      {/* Balance Display */}
      <div className="relative">
        <AnimatePresence mode="wait">
          {loading && balance === null ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-12 flex items-center justify-center"
            >
              <div className="flex items-center gap-2 text-[#6b8a9a]">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span className="text-sm">Loading...</span>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="balance"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-1"
            >
              {/* Main balance */}
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black font-mono text-[#e8f4f8] tracking-tight">
                  {balance !== null ? formatBalance(balance) : "0.00"}
                </span>
                <span className="text-sm font-semibold text-[#00d4aa]">{TOKEN_SYMBOL}</span>
              </div>
              
              {/* Full balance tooltip */}
              {balance !== null && balance > 0 && (
                <p className="text-[10px] font-mono text-[#6b8a9a]">
                  ≈ {formatFullBalance(balance)} tokens
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Live indicator */}
        <div className="absolute top-0 right-0 flex items-center gap-1">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00d4aa] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00d4aa]"></span>
          </span>
          <span className="text-[9px] text-[#6b8a9a] uppercase tracking-wider">Live</span>
        </div>
      </div>

      {/* Divider */}
      <div className="my-3 h-px bg-gradient-to-r from-transparent via-[#1a3a4a] to-transparent" />

      {/* Quick stats */}
      <div className="flex items-center justify-between text-[10px]">
        <div className="flex items-center gap-1 text-[#6b8a9a]">
          <TrendingUp className="h-3 w-3" />
          <span>Last updated:</span>
        </div>
        <span className="font-mono text-[#e8f4f8]">
          {lastUpdate ? lastUpdate.toLocaleTimeString() : "--:--"}
        </span>
      </div>
    </div>
  )
}
