"use client"

import { cn } from "@/lib/utils"
import type { Tier } from "@/lib/game-types"

interface SymbolProps {
  className?: string
  size?: number
  isCenter?: boolean
  isWinner?: boolean
}

// BRICK - Heavy Anchor (weighed down, longest lock)
export function BrickSymbol({ className, size = 48, isCenter, isWinner }: SymbolProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 64 64" 
      className={cn("transition-all duration-200", className)}
    >
      <defs>
        <linearGradient id="anchor-main" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#9ca3af" />
          <stop offset="50%" stopColor="#6b7280" />
          <stop offset="100%" stopColor="#4b5563" />
        </linearGradient>
        <linearGradient id="anchor-dark" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#6b7280" />
          <stop offset="100%" stopColor="#374151" />
        </linearGradient>
      </defs>
      {/* Ring at top */}
      <circle cx="32" cy="10" r="6" fill="none" stroke="url(#anchor-main)" strokeWidth="4" />
      {/* Shaft */}
      <rect x="29" y="14" width="6" height="32" rx="1" fill="url(#anchor-main)" />
      {/* Cross bar */}
      <rect x="18" y="26" width="28" height="5" rx="2" fill="url(#anchor-main)" />
      {/* Left fluke */}
      <path 
        d="M18 31 L10 50 Q8 54 12 54 L22 46 L22 31 Z" 
        fill="url(#anchor-dark)"
      />
      {/* Right fluke */}
      <path 
        d="M46 31 L54 50 Q56 54 52 54 L42 46 L42 31 Z" 
        fill="url(#anchor-dark)"
      />
      {/* Center bottom point */}
      <path 
        d="M29 46 L32 58 L35 46 Z" 
        fill="url(#anchor-dark)"
      />
      {/* Highlight on shaft */}
      <rect x="30" y="16" width="2" height="28" rx="1" fill="#d1d5db" opacity="0.4" />
      {/* Rust spots for character */}
      <circle cx="24" cy="38" r="1.5" fill="#92400e" opacity="0.4" />
      <circle cx="40" cy="42" r="1" fill="#92400e" opacity="0.3" />
    </svg>
  )
}

// MID - Hourglass (time is ticking, meh outcome)
export function MidSymbol({ className, size = 48, isCenter, isWinner }: SymbolProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 64 64" 
      className={cn("transition-all duration-200", className)}
    >
      <defs>
        <linearGradient id="mid-glass" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffd700" />
          <stop offset="50%" stopColor="#ffb347" />
          <stop offset="100%" stopColor="#ffd700" />
        </linearGradient>
        <linearGradient id="mid-sand" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#daa520" />
          <stop offset="100%" stopColor="#b8860b" />
        </linearGradient>
      </defs>
      {/* Top and bottom frames */}
      <rect x="14" y="8" width="36" height="6" rx="2" fill="#8b7355" />
      <rect x="14" y="50" width="36" height="6" rx="2" fill="#8b7355" />
      {/* Glass body */}
      <path d="M18 14 L18 24 L32 36 L46 24 L46 14 Z" fill="url(#mid-glass)" opacity="0.4" />
      <path d="M18 50 L18 40 L32 28 L46 40 L46 50 Z" fill="url(#mid-glass)" opacity="0.4" />
      {/* Sand */}
      <path d="M22 14 L22 22 L32 30 L42 22 L42 14 Z" fill="url(#mid-sand)" opacity="0.8" />
      <circle cx="32" cy="44" r="8" fill="url(#mid-sand)" opacity="0.8" />
      {/* Falling sand */}
      <line x1="32" y1="32" x2="32" y2="38" stroke="#daa520" strokeWidth="2" strokeLinecap="round" />
      {/* Outline */}
      <path d="M18 14 L18 24 L32 36 L46 24 L46 14" fill="none" stroke="#6b5344" strokeWidth="2" />
      <path d="M18 50 L18 40 L32 28 L46 40 L46 50" fill="none" stroke="#6b5344" strokeWidth="2" />
    </svg>
  )
}

// HOT - Fire/Flame (things are heating up!)
export function HotSymbol({ className, size = 48, isCenter, isWinner }: SymbolProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 64 64" 
      className={cn("transition-all duration-200", className)}
    >
      <defs>
        <linearGradient id="fire-outer" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#ff4500" />
          <stop offset="50%" stopColor="#ff6b35" />
          <stop offset="100%" stopColor="#ffa500" />
        </linearGradient>
        <linearGradient id="fire-inner" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#ffcc00" />
          <stop offset="100%" stopColor="#fff176" />
        </linearGradient>
        <filter id="fire-glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* Outer flame */}
      <path 
        d="M32 6 C32 6 42 18 44 28 C46 38 40 50 32 56 C24 50 18 38 20 28 C22 18 32 6 32 6 Z
           M32 6 C28 14 26 20 28 26 C30 32 32 28 32 28 C32 28 34 32 36 26 C38 20 36 14 32 6 Z" 
        fill="url(#fire-outer)"
        filter="url(#fire-glow)"
      />
      {/* Inner bright flame */}
      <path 
        d="M32 20 C32 20 38 28 38 36 C38 44 35 50 32 52 C29 50 26 44 26 36 C26 28 32 20 32 20 Z" 
        fill="url(#fire-inner)"
      />
      {/* Core */}
      <ellipse cx="32" cy="42" rx="4" ry="6" fill="#fff9c4" />
    </svg>
  )
}

// LEGENDARY - Diamond (diamond hands baby!)
export function LegendarySymbol({ className, size = 48, isCenter, isWinner }: SymbolProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 64 64" 
      className={cn("transition-all duration-200", isWinner && "drop-shadow-[0_0_12px_#00ff88]", className)}
    >
      <defs>
        <linearGradient id="diamond-top" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#b8f4ff" />
          <stop offset="100%" stopColor="#00d4aa" />
        </linearGradient>
        <linearGradient id="diamond-left" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#00d4aa" />
          <stop offset="100%" stopColor="#00a080" />
        </linearGradient>
        <linearGradient id="diamond-right" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#40e0d0" />
          <stop offset="100%" stopColor="#00b894" />
        </linearGradient>
        <filter id="diamond-glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* Diamond shape */}
      <g filter={isWinner ? "url(#diamond-glow)" : undefined}>
        {/* Top facet */}
        <polygon points="32,6 48,22 32,26 16,22" fill="url(#diamond-top)" />
        {/* Left facet */}
        <polygon points="16,22 32,26 32,58 12,28" fill="url(#diamond-left)" />
        {/* Right facet */}
        <polygon points="48,22 52,28 32,58 32,26" fill="url(#diamond-right)" />
        {/* Center highlight */}
        <polygon points="32,26 40,24 32,50 24,24" fill="#afffef" opacity="0.5" />
        {/* Sparkle */}
        <circle cx="26" cy="18" r="2" fill="white" opacity="0.9" />
        <circle cx="40" cy="32" r="1.5" fill="white" opacity="0.7" />
      </g>
    </svg>
  )
}

// MYTHIC - Lightning Bolt (absolute god tier!)
export function MythicSymbol({ className, size = 48, isCenter, isWinner }: SymbolProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 64 64" 
      className={cn("transition-all duration-200", isWinner && "drop-shadow-[0_0_16px_#ff00ff]", className)}
    >
      <defs>
        <linearGradient id="bolt-main" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ff6bff" />
          <stop offset="50%" stopColor="#bf5fff" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
        <linearGradient id="bolt-highlight" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffd6ff" />
          <stop offset="100%" stopColor="#ff9eff" />
        </linearGradient>
        <filter id="mythic-glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* Lightning bolt */}
      <g filter={isWinner ? "url(#mythic-glow)" : undefined}>
        {/* Main bolt shape */}
        <polygon 
          points="36,4 18,30 28,30 22,60 46,28 34,28 42,4" 
          fill="url(#bolt-main)"
        />
        {/* Inner highlight */}
        <polygon 
          points="34,10 24,28 30,28 26,50 40,30 34,30 38,10" 
          fill="url(#bolt-highlight)"
          opacity="0.7"
        />
        {/* Bright core */}
        <polygon 
          points="32,18 28,28 32,28 30,40 36,30 32,30 34,18" 
          fill="white"
          opacity="0.8"
        />
      </g>
      {/* Sparkles */}
      <circle cx="14" cy="20" r="2" fill="#ff9eff" opacity="0.8" />
      <circle cx="50" cy="40" r="2" fill="#ff9eff" opacity="0.8" />
      <circle cx="18" cy="48" r="1.5" fill="#ffd6ff" opacity="0.6" />
      <circle cx="48" cy="16" r="1.5" fill="#ffd6ff" opacity="0.6" />
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
