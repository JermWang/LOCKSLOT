"use client"

import { useEffect, useState } from "react"
import { useGameStore } from "@/lib/game-store"
import { cn } from "@/lib/utils"
import { TrendingUp, Users, Trophy, Sigma } from "lucide-react"

export function RewardPool() {
  const { rewardPool, totalSpins, activeWinners } = useGameStore()
  const [displayValue, setDisplayValue] = useState(rewardPool)

  useEffect(() => {
    const duration = 500
    const steps = 20
    const increment = (rewardPool - displayValue) / steps
    let current = displayValue

    const interval = setInterval(() => {
      current += increment
      if ((increment > 0 && current >= rewardPool) || (increment < 0 && current <= rewardPool)) {
        setDisplayValue(rewardPool)
        clearInterval(interval)
      } else {
        setDisplayValue(Math.round(current))
      }
    }, duration / steps)

    return () => clearInterval(interval)
  }, [rewardPool, displayValue])

  const avgSharePerWinner = activeWinners > 0 ? displayValue / activeWinners : displayValue

  return (
    <div className="glow-border">
      <div className="relative overflow-hidden rounded-[14px] glass-panel p-6">
        {/* Subtle animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 pointer-events-none" />

        <div className="relative">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/20">
                <Trophy className="h-4 w-4 text-primary" />
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest text-primary">Reward Pool</div>
                <div className="text-[10px] text-muted-foreground font-mono">P = Σ(fees) + Σ(penalties)</div>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs text-primary">
              <TrendingUp className="h-3 w-3" />
              <span className="font-mono">LIVE</span>
            </div>
          </div>
          
          {/* Main value */}
          <div className="mb-4">
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black font-mono text-foreground tracking-tight">
                {displayValue.toLocaleString()}
              </span>
              <span className="text-lg text-muted-foreground font-semibold">TOKENS</span>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-primary/20">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                <Sigma className="h-3 w-3" />
                <span className="text-[10px] uppercase tracking-wider">Total Spins</span>
              </div>
              <div className="font-mono text-sm font-bold text-foreground">{totalSpins.toLocaleString()}</div>
            </div>
            <div className="text-center border-x border-primary/20">
              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                <Users className="h-3 w-3" />
                <span className="text-[10px] uppercase tracking-wider">Winners</span>
              </div>
              <div className="font-mono text-sm font-bold text-primary">{activeWinners}</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                <Trophy className="h-3 w-3" />
                <span className="text-[10px] uppercase tracking-wider">Avg Share</span>
              </div>
              <div className="font-mono text-sm font-bold text-foreground">~{Math.round(avgSharePerWinner).toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
