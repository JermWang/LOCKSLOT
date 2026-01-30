"use client"

import { useGameStore } from "@/lib/game-store"
import { getTierColor, TIER_CONFIG } from "@/lib/game-types"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatTokenAmountFromBase } from "@/lib/token-utils"

export function Leaderboard() {
  const { leaderboard } = useGameStore()

  return (
    <ScrollArea className="h-[400px]">
      <div className="p-4">
        <div className="mb-3 grid grid-cols-[32px_1fr_60px_80px] gap-2 text-[10px] uppercase tracking-wider text-muted-foreground/60 px-2">
          <span>#</span>
          <span>Player</span>
          <span className="text-right">Multi</span>
          <span className="text-right">Bonus</span>
        </div>

        <div className="space-y-2">
          {leaderboard.map((entry, index) => {
            const isMythic = entry.tier === "mythic"
            
            return (
              <div
                key={`${entry.user}-${index}`}
                className={cn(
                  "grid grid-cols-[32px_1fr_60px_80px] gap-2 items-center",
                  "rounded-lg px-2 py-3",
                  "bg-secondary/30 hover:bg-secondary/50 transition-colors",
                  entry.rank === 1 && "border border-primary/30 bg-primary/5",
                  isMythic && "border-accent/30 bg-accent/5"
                )}
              >
                {/* Rank */}
                <span className={cn(
                  "text-sm font-bold",
                  entry.rank === 1 && "text-primary",
                  entry.rank === 2 && "text-muted-foreground",
                  entry.rank === 3 && "text-orange-400",
                  entry.rank > 3 && "text-muted-foreground/60"
                )}>
                  {entry.rank}
                </span>

                {/* Player & Tier */}
                <div className="flex flex-col gap-0.5 overflow-hidden">
                  <span className="text-xs font-mono text-foreground truncate">
                    {entry.user}
                  </span>
                  <span className={cn(
                    "text-[10px] font-medium",
                    getTierColor(entry.tier)
                  )}>
                    {TIER_CONFIG[entry.tier].label}
                  </span>
                </div>

                {/* Multiplier */}
                <span className={cn(
                  "text-right font-mono text-sm",
                  isMythic ? "text-accent" : "text-primary"
                )}>
                  {entry.multiplier}x
                </span>

                {/* Potential Bonus */}
                <div className="text-right">
                  <span className="text-xs font-mono text-foreground">
                    {formatTokenAmountFromBase(entry.potentialBonus)}
                  </span>
                  <span className="block text-[10px] text-muted-foreground/60">
                    potential
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {leaderboard.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-muted-foreground">No winners yet</p>
            <p className="mt-1 text-xs text-muted-foreground/60">
              Legendary & Mythic hits appear here
            </p>
          </div>
        )}

        <div className="mt-4 rounded-lg bg-secondary/20 p-3 text-center text-[10px] text-muted-foreground/60">
          Rankings based on potential bonus share.
          <br />
          Only Legendary & Mythic outcomes qualify.
        </div>
      </div>
    </ScrollArea>
  )
}
