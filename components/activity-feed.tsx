"use client"

import { useGameStore } from "@/lib/game-store"
import { getTierColor, TIER_CONFIG } from "@/lib/game-types"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"

function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (seconds < 60) return "just now"
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export function ActivityFeed() {
  const { activityFeed } = useGameStore()

  return (
    <ScrollArea className="h-[400px]">
      <div className="p-4">
        {activityFeed.map((item) => {
          const isBrick = item.tier === "brick"
          const isWinner = item.tier === "legendary" || item.tier === "mythic"
          
          return (
            <div
              key={item.id}
              className={cn(
                "mb-2 rounded-lg px-3 py-2.5 hover-glow-border",
                isWinner && "border-primary/30"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground font-mono">
                    {item.user}
                  </span>
                  <span className={cn(
                    "text-xs font-medium",
                    isBrick ? "text-muted-foreground" : getTierColor(item.tier)
                  )}>
                    {isBrick ? "bricked" : TIER_CONFIG[item.tier].label}
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground/60">
                  {formatTimeAgo(item.timestamp)}
                </span>
              </div>
              
              <div className="mt-1 flex items-center gap-3 text-xs">
                <span className="text-muted-foreground">
                  <span className="font-mono">{item.duration}</span>d
                </span>
                <span className="text-muted-foreground">@</span>
                <span className={cn(
                  "font-mono",
                  isWinner ? "text-primary" : "text-muted-foreground"
                )}>
                  {item.multiplier}x
                </span>
                <span className="ml-auto text-muted-foreground/60 font-mono">
                  {item.amount.toLocaleString()}
                </span>
              </div>

              {isWinner && (
                <div className="mt-2">
                  <div className={cn(
                    "rounded px-2 py-1 text-center text-[10px] font-medium",
                    item.tier === "mythic" 
                      ? "bg-accent/20 text-accent" 
                      : "bg-primary/20 text-primary"
                  )}>
                    {item.tier === "mythic" ? "MYTHIC HIT!" : "LEGENDARY!"}
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {activityFeed.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-muted-foreground">No activity yet</p>
            <p className="mt-1 text-xs text-muted-foreground/60">
              Spins will appear here
            </p>
          </div>
        )}
      </div>
    </ScrollArea>
  )
}
