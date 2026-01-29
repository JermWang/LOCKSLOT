"use client"

import { useMemo, useEffect, useRef } from "react"
import { useGameStore } from "@/lib/game-store"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { Trophy, Lock, Flame, Skull, Sparkles, Clock, TrendingUp } from "lucide-react"
import type { Tier } from "@/lib/game-types"
import { gameSounds } from "@/lib/sounds"

interface FeedItem {
  id: string
  username: string
  wallet: string
  tier: Tier
  amount: number
  multiplier: number
  duration: number
  ticketScore: number
  timestamp: Date
  isWin: boolean
}

// Losers muted, winners get distinct colors (cyan for legendary, purple for mythic)
const TIER_STYLES: Record<Tier, { color: string; bg: string; border: string; icon: typeof Trophy; isWin: boolean }> = {
  brick: { color: "text-[#4a5568]", bg: "bg-[#0a1628]/80", border: "border-[#1a3a4a]/30", icon: Skull, isWin: false },
  mid: { color: "text-[#6b8a9a]", bg: "bg-[#0a1628]/80", border: "border-[#1a3a4a]/30", icon: Clock, isWin: false },
  hot: { color: "text-[#f0c674]", bg: "bg-[#f0c674]/10", border: "border-[#f0c674]/30", icon: Flame, isWin: false },
  legendary: { color: "text-[#00d4aa]", bg: "bg-[#00d4aa]/10", border: "border-[#00d4aa]/30", icon: Trophy, isWin: true },
  mythic: { color: "text-[#a855f7]", bg: "bg-[#a855f7]/10", border: "border-[#a855f7]/30", icon: Sparkles, isWin: true },
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  return `${Math.floor(seconds / 3600)}h ago`
}

function FeedEntry({ item, index }: { item: FeedItem; index: number }) {
  const style = TIER_STYLES[item.tier]
  const Icon = style.icon
  const isWin = style.isWin

  return (
    <motion.div
      initial={{ opacity: 0, x: -20, height: 0 }}
      animate={{ opacity: 1, x: 0, height: "auto" }}
      exit={{ opacity: 0, x: 20, height: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg hover-glow-border",
        isWin && "glow-pulse"
      )}
    >
      {/* Icon */}
      <div className={cn("p-2 rounded-lg", style.bg)}>
        <Icon className={cn("h-4 w-4", style.color)} />
      </div>

      {/* User & Tier */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm text-foreground truncate">
            {item.username || `${item.wallet.slice(0, 4)}...${item.wallet.slice(-4)}`}
          </span>
          <span className={cn(
            "text-xs font-bold px-1.5 py-0.5 rounded",
            style.bg, style.color
          )}>
            {item.tier.toUpperCase()}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{item.amount.toLocaleString()} tokens</span>
          <span>•</span>
          <span>{item.duration}h lock</span>
        </div>
      </div>

      {/* Multiplier & Score */}
      <div className="text-right">
        <div className={cn("font-mono font-bold", style.color)}>
          {item.multiplier}×
        </div>
        {isWin && (
          <div className={cn("text-xs font-mono", style.color)}>
            S={item.ticketScore.toLocaleString()}
          </div>
        )}
      </div>

      {/* Time */}
      <div className="text-xs text-muted-foreground w-12 text-right">
        {formatTimeAgo(item.timestamp)}
      </div>
    </motion.div>
  )
}

export function LiveFeed() {
  const { activityFeed } = useGameStore()
  const prevFeedLengthRef = useRef(activityFeed.length)

  // Play notification sound for new wins (not from current user)
  useEffect(() => {
    if (activityFeed.length > prevFeedLengthRef.current) {
      const newItems = activityFeed.slice(0, activityFeed.length - prevFeedLengthRef.current)
      const hasNewWin = newItems.some(item => 
        (item.tier === "legendary" || item.tier === "mythic") && item.user !== "You"
      )
      if (hasNewWin) {
        gameSounds.notification()
      }
    }
    prevFeedLengthRef.current = activityFeed.length
  }, [activityFeed])

  const feed = useMemo<FeedItem[]>(() => {
    return activityFeed.map((activity) => ({
      id: activity.id,
      username: activity.user === "You" ? "You" : "",
      wallet: activity.user === "You" ? "You" : activity.user,
      tier: activity.tier,
      amount: activity.amount,
      multiplier: activity.multiplier,
      duration: activity.duration,
      ticketScore: Math.floor(activity.amount * activity.multiplier),
      timestamp: activity.timestamp,
      isWin: activity.tier === "legendary" || activity.tier === "mythic",
    }))
  }, [activityFeed])

  const wins = feed.filter(f => f.isWin).length
  const total = feed.length

  return (
    <div className="h-full flex flex-col">
      <div className="rounded-xl glass-panel overflow-hidden flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#1a3a4a]/50 bg-[#0a1628]/80">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-[#00d4aa] animate-pulse" />
            <h3 className="text-sm font-semibold uppercase tracking-widest text-[#e8f4f8]">
              Live Feed
            </h3>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1 text-[#6b8a9a]">
              <TrendingUp className="h-3 w-3" />
              {total} spins
            </span>
            <span className="flex items-center gap-1 text-[#00d4aa]">
              <Trophy className="h-3 w-3" />
              {wins} wins
            </span>
          </div>
        </div>

        {/* Feed list */}
        <div className="flex-1 p-3 space-y-2 overflow-y-auto min-h-0">
          <AnimatePresence mode="popLayout">
            {feed.length > 0 ? (
              feed.slice(0, 15).map((item, index) => (
                <FeedEntry key={item.id} item={item} index={index} />
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No activity yet. Be the first to spin!
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Legend - distinct winner colors */}
        <div className="p-3 border-t border-[#1a3a4a]/50 bg-[#0a1628]/60">
          <div className="flex items-center justify-center gap-6 text-xs text-[#6b8a9a]">
            <span className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#4a5568]" />
              Loss (88%)
            </span>
            <span className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#00d4aa]" />
              <span className="text-[#00d4aa]">Legendary (9%)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#a855f7]" />
              <span className="text-[#a855f7]">Mythic (3%)</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
