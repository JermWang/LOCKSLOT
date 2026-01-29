"use client"

import { useState, useRef } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { HowItWorks } from "@/components/how-it-works"
import { SlotMachine } from "@/components/slot-machine"
import { RewardPool } from "@/components/reward-pool"
import { LiveFeed } from "@/components/live-feed"
import { LiveChat } from "@/components/live-chat"
import { Dices, ChevronDown } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

export default function LockSlotPage() {
  const [showGame, setShowGame] = useState(false)
  const gameRef = useRef<HTMLDivElement>(null)

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
          className="mb-10 text-center font-mono text-sm text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Pain funds glory. EV &lt; 0. You&apos;ve been warned.
        </motion.p>

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
                {/* Reward Pool */}
                <RewardPool />
                
                {/* Main Game Card */}
                <div className="glow-border-intense glass-panel-intense rounded-xl p-6">
                  {/* Slot Machine - Clean and focused */}
                  <SlotMachine />
                  
                  {/* Quick odds below slot */}
                  <div className="mt-6 pt-4 border-t border-primary/20">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-4">
                        <span className="text-muted-foreground">Win chance:</span>
                        <span className="font-mono font-bold text-primary">12%</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-muted-foreground">Fee:</span>
                        <span className="font-mono font-bold text-muted-foreground">5%</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-muted-foreground">Principal:</span>
                        <span className="font-mono font-bold text-emerald-400">Returned</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tier odds - Collapsible/minimal on desktop */}
                <details className="glass-panel-subtle rounded-xl">
                  <summary className="p-4 cursor-pointer text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors flex items-center justify-between">
                    <span>View Tier Probabilities</span>
                    <ChevronDown className="h-4 w-4" />
                  </summary>
                  <div className="px-4 pb-4 grid grid-cols-5 gap-2 text-center">
                    {[
                      { name: "BRICK", prob: "45%", days: "14-21d", color: "text-[#4a5568]", dot: "bg-[#4a5568]" },
                      { name: "MID", prob: "28%", days: "7-14d", color: "text-[#6b8a9a]", dot: "bg-[#6b8a9a]" },
                      { name: "HOT", prob: "15%", days: "3-7d", color: "text-[#f0c674]", dot: "bg-[#f0c674]" },
                      { name: "LEGEND", prob: "9%", days: "1-3d", color: "text-[#00d4aa]", dot: "bg-[#00d4aa]" },
                      { name: "MYTHIC", prob: "3%", days: "~1d", color: "text-[#a855f7]", dot: "bg-[#a855f7]" },
                    ].map((tier) => (
                      <div key={tier.name} className="p-2 rounded-lg bg-[#0a1628]/80 border border-[#1a3a4a]/30">
                        <div className={cn("w-2 h-2 rounded-full mx-auto mb-1", tier.dot)} />
                        <div className={cn("text-[10px] font-bold", tier.color)}>{tier.name}</div>
                        <div className="text-xs font-mono text-[#e8f4f8]">{tier.prob}</div>
                        <div className="text-[10px] font-mono text-[#6b8a9a]">{tier.days}</div>
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
