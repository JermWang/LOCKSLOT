"use client"

import { useState, useRef } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { HowItWorks } from "@/components/how-it-works"
import { SlotMachine } from "@/components/slot-machine"
import { RewardPool } from "@/components/reward-pool"
import { LiveFeed } from "@/components/live-feed"
import { LiveChat } from "@/components/live-chat"
import { DepositWithdraw } from "@/components/deposit-withdraw"
import { Dices, ChevronDown, Copy } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { TIER_CONFIG, formatTierDurationRange, getTierColor, getTierDotColor, type Tier } from "@/lib/game-types"

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_TOKEN_MINT || ""

export default function LockSlotPage() {
  const [showGame, setShowGame] = useState(false)
  const [contractCopied, setContractCopied] = useState(false)
  const gameRef = useRef<HTMLDivElement>(null)

  const truncatedContract = CONTRACT_ADDRESS
    ? `${CONTRACT_ADDRESS.slice(0, 4)}...${CONTRACT_ADDRESS.slice(-4)}`
    : null

  const copyContract = async () => {
    if (!CONTRACT_ADDRESS) return
    try {
      await navigator.clipboard.writeText(CONTRACT_ADDRESS)
      setContractCopied(true)
      setTimeout(() => setContractCopied(false), 2000)
    } catch {
      // ignore
    }
  }

  const handleIntroComplete = () => {
    setShowGame(true)
    setTimeout(() => {
      gameRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 100)
  }

  return (
    <div className="min-h-screen px-4 pb-24 pt-8">
      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)]">
        {/* Header Badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Badge
            variant="outline"
            className="mb-6 gap-2 border-primary/40 bg-primary/10 text-primary font-mono text-xs"
          >
            <Dices className="h-3 w-3" />
            PROVABLY-FAIR PARI-MUTUEL
          </Badge>
        </motion.div>

        {/* Main Heading */}
        <motion.h1 
          className="mb-2 text-center text-5xl font-black tracking-tight md:text-7xl"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <span className="gradient-text-gold">LOCK</span>
          <span className="text-foreground"> SLOT</span>
        </motion.h1>
        
        {/* Tagline */}
        <motion.p 
          className="mb-6 text-center font-mono text-sm text-muted-foreground md:mb-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Pain funds glory. EV &lt; 0. You&apos;ve been warned.
        </motion.p>

        <motion.div
          className="mb-8 flex w-full justify-center md:hidden"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <button
            type="button"
            onClick={copyContract}
            disabled={!CONTRACT_ADDRESS}
            className="group relative h-10 w-full max-w-xs rounded-lg border border-[#1a3a4a]/50 bg-[#081420]/70 px-4 text-sm text-[#e8f4f8] transition-all overflow-hidden flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:border-[#00d4aa]/40"
            title={CONTRACT_ADDRESS ? CONTRACT_ADDRESS : "Set NEXT_PUBLIC_TOKEN_MINT"}
          >
            <span className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              <span className="absolute inset-y-0 -left-full w-1/2 bg-gradient-to-r from-transparent via-[#00d4aa]/20 to-transparent skew-x-12 transition-transform duration-700 group-hover:translate-x-[240%]" />
            </span>

            <Copy className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b8a9a] group-hover:text-[#00d4aa] transition-colors" />
            <span className="pl-7 font-mono">
              {contractCopied
                ? "Copied Contract!"
                : truncatedContract
                  ? `Contract: ${truncatedContract}`
                  : "Contract not set"}
            </span>
          </button>
        </motion.div>

        {/* How It Works Module */}
        <motion.div
          className="w-full max-w-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <HowItWorks onComplete={handleIntroComplete} />
        </motion.div>

        {/* Scroll indicator */}
        {showGame && (
          <motion.div
            className="mt-8 flex flex-col items-center text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <span className="text-xs mb-2">Scroll to play</span>
            <ChevronDown className="h-5 w-5 animate-bounce" />
          </motion.div>
        )}
      </div>

      {/* Game Section */}
      <AnimatePresence>
        {showGame && (
          <motion.div
            ref={gameRef}
            className="max-w-7xl mx-auto pt-16"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Desktop: Side by side | Mobile: Stacked */}
            <div className="grid lg:grid-cols-[1fr_380px] gap-6">
              
              {/* LEFT: Gambling Widget - Simplified */}
              <div className="space-y-4">
                {/* Deposit/Withdraw */}
                <DepositWithdraw />
                
                {/* Reward Pool */}
                <RewardPool />
                
                {/* Main Game Card */}
                <div className="glow-border-intense glass-panel-intense rounded-xl p-6">
                  {/* Slot Machine - Clean and focused */}
                  <SlotMachine />
                </div>

                {/* Tier odds - Collapsible/minimal on desktop */}
                <details className="glass-panel-subtle rounded-xl">
                  <summary className="p-4 cursor-pointer text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors flex items-center justify-between">
                    <span>View Tier Probabilities</span>
                    <ChevronDown className="h-4 w-4" />
                  </summary>
                  <div className="px-4 pb-4 grid grid-cols-5 gap-2 text-center">
                    {(["brick", "mid", "hot", "legendary", "mythic"] as const).map((tier: Tier) => (
                      <div key={tier} className="p-2 rounded-lg bg-[#0a1628]/80 border border-[#1a3a4a]/30">
                        <div className={cn("w-2 h-2 rounded-full mx-auto mb-1", getTierDotColor(tier))} />
                        <div className={cn("text-[10px] font-bold", getTierColor(tier))}>
                          {tier === "legendary" ? "LEGEND" : TIER_CONFIG[tier].label}
                        </div>
                        <div className="text-xs font-mono text-[#e8f4f8]">{Math.round(TIER_CONFIG[tier].probability * 100)}%</div>
                        <div className="text-[10px] font-mono text-[#6b8a9a]">{formatTierDurationRange(tier)}</div>
                      </div>
                    ))}
                  </div>
                </details>
              </div>

              {/* RIGHT: Live Feed + Chat - Fixed height container */}
              <div className="lg:sticky lg:top-20 lg:h-[calc(100vh-120px)] flex flex-col gap-4">
                {/* Live Feed - Takes 60% */}
                <div className="flex-[3] min-h-0 overflow-hidden">
                  <LiveFeed />
                </div>
                {/* Live Chat - Takes 40% */}
                <div className="flex-[2] min-h-0">
                  <LiveChat />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}
