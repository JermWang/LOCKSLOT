"use client"

import { cn } from "@/lib/utils"
import type { Tier } from "@/lib/game-types"

interface SymbolProps {
  className?: string
  size?: number
  isCenter?: boolean
  isWinner?: boolean
}

// Brick: Misaligned pins - staggered heights, uneven
export function BrickSymbol({ className, size = 48, isCenter, isWinner }: SymbolProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 48 48" 
      className={cn("transition-all duration-200", className)}
    >
      <defs>
        <linearGradient id="brick-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(20, 35%, 45%)" />
          <stop offset="100%" stopColor="hsl(20, 35%, 32%)" />
        </linearGradient>
      </defs>
      {/* Three misaligned vertical pins */}
      <rect x="10" y="14" width="6" height="28" rx="2" fill="url(#brick-gradient)" opacity="0.9" />
      <rect x="21" y="8" width="6" height="34" rx="2" fill="url(#brick-gradient)" opacity="0.85" />
      <rect x="32" y="18" width="6" height="24" rx="2" fill="url(#brick-gradient)" opacity="0.8" />
      {/* Pin highlights */}
      <rect x="11" y="14" width="2" height="28" rx="1" fill="hsl(20, 30%, 55%)" opacity="0.4" />
      <rect x="22" y="8" width="2" height="34" rx="1" fill="hsl(20, 30%, 55%)" opacity="0.4" />
      <rect x="33" y="18" width="2" height="24" rx="1" fill="hsl(20, 30%, 55%)" opacity="0.4" />
    </svg>
  )
}

// Mid: Partial alignment - 2 aligned, 1 offset
export function MidSymbol({ className, size = 48, isCenter, isWinner }: SymbolProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 48 48" 
      className={cn("transition-all duration-200", className)}
    >
      <defs>
        <linearGradient id="mid-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(45, 35%, 55%)" />
          <stop offset="100%" stopColor="hsl(45, 35%, 42%)" />
        </linearGradient>
      </defs>
      {/* Two aligned, one offset */}
      <rect x="10" y="10" width="6" height="28" rx="2" fill="url(#mid-gradient)" opacity="0.9" />
      <rect x="21" y="10" width="6" height="28" rx="2" fill="url(#mid-gradient)" opacity="0.9" />
      <rect x="32" y="16" width="6" height="22" rx="2" fill="url(#mid-gradient)" opacity="0.75" />
      {/* Pin highlights */}
      <rect x="11" y="10" width="2" height="28" rx="1" fill="hsl(45, 30%, 65%)" opacity="0.4" />
      <rect x="22" y="10" width="2" height="28" rx="1" fill="hsl(45, 30%, 65%)" opacity="0.4" />
      <rect x="33" y="16" width="2" height="22" rx="1" fill="hsl(45, 30%, 65%)" opacity="0.4" />
    </svg>
  )
}

// Hot: Near alignment - small gap
export function HotSymbol({ className, size = 48, isCenter, isWinner }: SymbolProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 48 48" 
      className={cn("transition-all duration-200", className)}
    >
      <defs>
        <linearGradient id="hot-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(28, 50%, 58%)" />
          <stop offset="100%" stopColor="hsl(28, 50%, 45%)" />
        </linearGradient>
      </defs>
      {/* Nearly aligned with small offset */}
      <rect x="10" y="10" width="6" height="28" rx="2" fill="url(#hot-gradient)" opacity="0.95" />
      <rect x="21" y="11" width="6" height="27" rx="2" fill="url(#hot-gradient)" opacity="0.95" />
      <rect x="32" y="10" width="6" height="28" rx="2" fill="url(#hot-gradient)" opacity="0.95" />
      {/* Pin highlights */}
      <rect x="11" y="10" width="2" height="28" rx="1" fill="hsl(28, 45%, 70%)" opacity="0.5" />
      <rect x="22" y="11" width="2" height="27" rx="1" fill="hsl(28, 45%, 70%)" opacity="0.5" />
      <rect x="33" y="10" width="2" height="28" rx="1" fill="hsl(28, 45%, 70%)" opacity="0.5" />
    </svg>
  )
}

// Legendary: Perfect alignment with notch
export function LegendarySymbol({ className, size = 48, isCenter, isWinner }: SymbolProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 48 48" 
      className={cn("transition-all duration-200", isWinner && "drop-shadow-[0_0_8px_hsl(160,50%,50%)]", className)}
    >
      <defs>
        <linearGradient id="legendary-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(160, 50%, 55%)" />
          <stop offset="100%" stopColor="hsl(160, 50%, 42%)" />
        </linearGradient>
        <linearGradient id="legendary-chrome" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="hsl(160, 40%, 70%)" />
          <stop offset="50%" stopColor="hsl(160, 50%, 50%)" />
          <stop offset="100%" stopColor="hsl(160, 40%, 40%)" />
        </linearGradient>
      </defs>
      {/* Perfectly aligned pins */}
      <rect x="10" y="10" width="6" height="28" rx="2" fill={isWinner ? "url(#legendary-chrome)" : "url(#legendary-gradient)"} />
      <rect x="21" y="10" width="6" height="28" rx="2" fill={isWinner ? "url(#legendary-chrome)" : "url(#legendary-gradient)"} />
      <rect x="32" y="10" width="6" height="28" rx="2" fill={isWinner ? "url(#legendary-chrome)" : "url(#legendary-gradient)"} />
      {/* Alignment notch indicator */}
      <rect x="8" y="22" width="32" height="4" rx="1" fill="hsl(160, 50%, 60%)" opacity="0.6" />
      {/* Pin highlights */}
      <rect x="11" y="10" width="2" height="28" rx="1" fill="hsl(160, 40%, 75%)" opacity="0.5" />
      <rect x="22" y="10" width="2" height="28" rx="1" fill="hsl(160, 40%, 75%)" opacity="0.5" />
      <rect x="33" y="10" width="2" height="28" rx="1" fill="hsl(160, 40%, 75%)" opacity="0.5" />
    </svg>
  )
}

// Mythic: Open state - retracted pins with void
export function MythicSymbol({ className, size = 48, isCenter, isWinner }: SymbolProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 48 48" 
      className={cn("transition-all duration-200", isWinner && "drop-shadow-[0_0_12px_hsl(275,40%,60%)]", className)}
    >
      <defs>
        <linearGradient id="mythic-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(275, 45%, 60%)" />
          <stop offset="100%" stopColor="hsl(275, 45%, 45%)" />
        </linearGradient>
        <linearGradient id="mythic-iridescent" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(275, 50%, 70%)" />
          <stop offset="33%" stopColor="hsl(300, 45%, 60%)" />
          <stop offset="66%" stopColor="hsl(260, 50%, 55%)" />
          <stop offset="100%" stopColor="hsl(275, 45%, 50%)" />
        </linearGradient>
        <radialGradient id="mythic-void" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="hsl(275, 50%, 20%)" />
          <stop offset="70%" stopColor="hsl(275, 40%, 35%)" />
          <stop offset="100%" stopColor="hsl(275, 45%, 50%)" />
        </radialGradient>
      </defs>
      {/* Outer ring */}
      <circle cx="24" cy="24" r="18" fill="none" stroke={isWinner ? "url(#mythic-iridescent)" : "url(#mythic-gradient)"} strokeWidth="3" />
      {/* Inner void */}
      <circle cx="24" cy="24" r="10" fill="url(#mythic-void)" />
      {/* Retracted pins (small) */}
      <rect x="10" y="32" width="5" height="8" rx="1.5" fill={isWinner ? "url(#mythic-iridescent)" : "url(#mythic-gradient)"} opacity="0.8" />
      <rect x="21.5" y="34" width="5" height="6" rx="1.5" fill={isWinner ? "url(#mythic-iridescent)" : "url(#mythic-gradient)"} opacity="0.8" />
      <rect x="33" y="32" width="5" height="8" rx="1.5" fill={isWinner ? "url(#mythic-iridescent)" : "url(#mythic-gradient)"} opacity="0.8" />
      {/* Center glow dot */}
      <circle cx="24" cy="24" r="3" fill="hsl(275, 60%, 75%)" opacity={isWinner ? "0.9" : "0.6"} />
    </svg>
  )
}

// Symbol renderer based on tier
export function TierSymbol({ tier, ...props }: SymbolProps & { tier: Tier }) {
  switch (tier) {
    case "brick":
      return <BrickSymbol {...props} />
    case "mid":
      return <MidSymbol {...props} />
    case "hot":
      return <HotSymbol {...props} />
    case "legendary":
      return <LegendarySymbol {...props} />
    case "mythic":
      return <MythicSymbol {...props} />
  }
}

// Tier labels with new styling
export const TIER_LABELS: Record<Tier, string> = {
  brick: "BRICK",
  mid: "MID", 
  hot: "HOT",
  legendary: "LEGEND",
  mythic: "MYTHIC",
}
