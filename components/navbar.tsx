"use client"

import { useWallet } from "@/lib/wallet-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Bell, Wallet, ChevronDown, Copy, LogOut, RefreshCw } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useState, useEffect, useCallback } from "react"
import { UsernameModal } from "@/components/username-modal"
import { gameSounds, resumeAudio } from "@/lib/sounds"
import Image from "next/image"

const TOKEN_DECIMALS = 9
const TOKEN_SYMBOL = process.env.NEXT_PUBLIC_TOKEN_SYMBOL || "TOKENS"

function formatBalance(rawBalance: number): string {
  const balance = rawBalance / Math.pow(10, TOKEN_DECIMALS)
  if (balance >= 1_000_000) return `${(balance / 1_000_000).toFixed(2)}M`
  if (balance >= 1_000) return `${(balance / 1_000).toFixed(2)}K`
  if (balance >= 1) return balance.toFixed(2)
  return balance.toFixed(4)
}

export function Navbar() {
  const { publicKey, disconnect, connected, connect, connecting, walletName, getTokenBalance } = useWallet()
  const [copied, setCopied] = useState(false)
  const [balance, setBalance] = useState<number | null>(null)

  // Fetch token balance
  const fetchBalance = useCallback(async () => {
    if (!connected) {
      setBalance(null)
      return
    }
    try {
      const bal = await getTokenBalance()
      setBalance(bal)
    } catch {
      setBalance(null)
    }
  }, [connected, getTokenBalance])

  useEffect(() => {
    if (connected) {
      fetchBalance()
      const interval = setInterval(fetchBalance, 30000)
      return () => clearInterval(interval)
    } else {
      setBalance(null)
    }
  }, [connected, fetchBalance])

  const truncatedAddress = publicKey
    ? `${publicKey.slice(0, 4)}...${publicKey.slice(-4)}`
    : null

  const copyAddress = () => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey)
      setCopied(true)
      gameSounds.success()
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleConnect = () => {
    resumeAudio()
    gameSounds.click()
    connect()
  }

  const handleDisconnect = () => {
    gameSounds.click()
    disconnect()
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-[#1a3a4a]/50 bg-[#0a1628]/95 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 lg:px-6">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <img 
            src="/logo.png" 
            alt="Lock Slot" 
            className="h-10 w-auto rounded-lg"
          />
        </div>

        {/* Search Bar */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search wallets, epochs..."
              className="w-full pl-10 bg-[#081420] border-[#1a3a4a]/50 text-sm text-[#e8f4f8] placeholder:text-[#6b8a9a]"
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {/* Token Balance - minimal inline display */}
          {connected && balance !== null && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#081420] border border-[#1a3a4a]/50">
              <Image src="/logo.png" alt="" width={20} height={20} className="rounded" />
              <span className="font-mono text-sm font-semibold text-[#00d4aa]">
                {formatBalance(balance)}
              </span>
              <span className="text-[10px] text-[#6b8a9a] uppercase">{TOKEN_SYMBOL}</span>
            </div>
          )}

          {/* Username button - only show when connected */}
          {connected && <UsernameModal />}

          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <Bell className="h-5 w-5" />
          </Button>

          {connected && publicKey ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 border-[#1a3a4a]/50 bg-[#081420] hover:bg-[#0a1628]">
                  <Wallet className="h-4 w-4 text-primary" />
                  <span className="font-mono text-sm">{truncatedAddress}</span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5 text-xs text-muted-foreground">
                  Connected via {walletName}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={copyAddress}>
                  <Copy className="mr-2 h-4 w-4" />
                  {copied ? "Copied!" : "Copy Address"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleConnect}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Change Wallet
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDisconnect} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Disconnect
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              onClick={handleConnect}
              disabled={connecting}
              className="gap-2 bg-[#081420] text-[#e8f4f8] border border-[#1a3a4a]/50 hover:bg-[#0a1628] hover:border-[#00d4aa]/30"
            >
              <Wallet className="h-4 w-4" />
              {connecting ? "Connecting..." : "Select Wallet"}
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
