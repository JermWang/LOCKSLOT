"use client"

import { useGameStore } from "@/lib/game-store"

export function FooterStats() {
  const { rewardPool, totalSpins, activeWinners } = useGameStore()
  
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-6 text-sm lg:left-[calc(50%+7rem)]">
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
        <span className="text-muted-foreground">Reward Pool:</span>
        <span className="text-primary font-mono font-semibold">{rewardPool.toLocaleString()}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">Total Spins:</span>
        <span className="font-mono font-semibold">{totalSpins.toLocaleString()}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">Active Locks:</span>
        <span className="text-primary font-mono font-semibold">{activeWinners}</span>
      </div>
    </div>
  )
}
