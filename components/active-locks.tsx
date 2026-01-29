"use client"

import { useEffect, useState } from "react"
import { useGameStore } from "@/lib/game-store"
import { getTierColor, getTierBgColor, TIER_CONFIG } from "@/lib/game-types"
import { cn } from "@/lib/utils"
import { Clock, Lock, Zap, Trophy, Timer } from "lucide-react"

function CountdownTimer({ endTime }: { endTime: Date }) {
  const [timeLeft, setTimeLeft] = useState("")
  const [isUrgent, setIsUrgent] = useState(false)

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date()
      const diff = endTime.getTime() - now.getTime()

      if (diff <= 0) {
        setTimeLeft("UNLOCKED")
        setIsUrgent(false)
        return
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setIsUrgent(days === 0 && hours < 1)

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h ${minutes}m`)
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`)
      } else {
        setTimeLeft(`${minutes}m ${seconds}s`)
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [endTime])

  return (
    <span className={cn(
      "font-mono text-sm font-semibold",
      isUrgent && "text-primary animate-pulse"
    )}>
      {timeLeft}
    </span>
  )
}

function LockProgress({ startTime, endTime, tier }: { startTime: Date; endTime: Date; tier: string }) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const updateProgress = () => {
      const now = new Date()
      const total = endTime.getTime() - startTime.getTime()
      const elapsed = now.getTime() - startTime.getTime()
      setProgress(Math.min(100, Math.max(0, (elapsed / total) * 100)))
    }

    updateProgress()
    const interval = setInterval(updateProgress, 1000)
    return () => clearInterval(interval)
  }, [startTime, endTime])

  const isWinner = tier === "legendary" || tier === "mythic"

  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-secondary/50">
      <div
        className={cn(
          "h-full transition-all duration-500 rounded-full",
          isWinner ? "bg-primary" : "bg-muted-foreground/50"
        )}
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}

export function ActiveLocks() {
  const { locks } = useGameStore()
  const activeLocks = locks.filter((lock) => lock.status === "active")

  if (activeLocks.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Your Active Locks
          </h3>
        </div>
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="mb-3 p-4 rounded-full bg-secondary/50">
            <Timer className="h-8 w-8 text-muted-foreground/30" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">No active locks</p>
          <p className="mt-1 text-xs text-muted-foreground/70 font-mono">Spin to lock your first stake</p>
        </div>
      </div>
    )
  }

  const totalLocked = activeLocks.reduce((sum, lock) => sum + lock.amount, 0)
  const winningLocks = activeLocks.filter(l => l.tier === "legendary" || l.tier === "mythic")

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Active Locks
          </h3>
        </div>
        <div className="text-xs font-mono text-muted-foreground">
          {activeLocks.length} active
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3 mb-4 p-3 rounded-lg bg-secondary/30 border border-border">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Total Locked</div>
          <div className="font-mono text-sm font-bold text-foreground">{totalLocked.toLocaleString()}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Bonus Eligible</div>
          <div className="font-mono text-sm font-bold text-primary">{winningLocks.length} / {activeLocks.length}</div>
        </div>
      </div>

      {/* Lock cards */}
      <div className="space-y-3">
        {activeLocks.map((lock) => {
          const isWinner = lock.tier === "legendary" || lock.tier === "mythic"
          const ticketScore = lock.amount * lock.multiplier
          
          return (
            <div
              key={lock.id}
              className={cn(
                "rounded-xl p-4 hover-glow-border",
                isWinner && lock.tier === "mythic" && "glow-mythic",
                isWinner && lock.tier === "legendary" && "glow-legendary"
              )}
            >
              {/* Top row */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={cn("text-sm font-black tracking-wide", getTierColor(lock.tier))}>
                    {TIER_CONFIG[lock.tier].label}
                  </span>
                  {isWinner && (
                    <Trophy className="h-3.5 w-3.5 text-primary" />
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <Zap className="h-3 w-3 text-primary" />
                  <span className="font-mono text-sm font-bold text-primary">
                    {lock.multiplier}×
                  </span>
                </div>
              </div>

              {/* Amount and score */}
              <div className="flex items-center justify-between mb-3 text-xs">
                <div className="text-muted-foreground">
                  <span className="font-mono font-semibold text-foreground">{lock.amount.toLocaleString()}</span> TOKENS
                </div>
                {isWinner && (
                  <div className="text-primary font-mono">
                    S = {ticketScore.toLocaleString()}
                  </div>
                )}
              </div>

              {/* Progress */}
              <div className="mb-2">
                <LockProgress startTime={lock.startTime} endTime={lock.endTime} tier={lock.tier} />
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span className="font-mono">{lock.duration}d lock</span>
                </div>
                <CountdownTimer endTime={lock.endTime} />
              </div>

              {isWinner && (
                <div className="mt-3 rounded-lg bg-primary/20 border border-primary/30 px-3 py-1.5 text-center">
                  <span className="text-xs font-semibold text-primary uppercase tracking-wider">Bonus Eligible</span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
