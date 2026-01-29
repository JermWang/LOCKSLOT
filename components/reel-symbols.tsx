"use client"

import { cn } from "@/lib/utils"
import type { Tier } from "@/lib/game-types"

interface SymbolProps {
  className?: string
  size?: number
  isCenter?: boolean
  isWinner?: boolean
}

// BRICK - Stylized red brick (longest lock, worst outcome)
export function BrickSymbol({ className, size = 48, isCenter, isWinner }: SymbolProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 64 64" 
      className={cn("transition-all duration-200", className)}
    >
      <defs>
        <linearGradient id="brick-top" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#dc5044" />
          <stop offset="100%" stopColor="#b83a30" />
        </linearGradient>
        <linearGradient id="brick-front" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#c4453b" />
          <stop offset="50%" stopColor="#a83328" />
          <stop offset="100%" stopColor="#8b2720" />
        </linearGradient>
        <linearGradient id="brick-side" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#9c2e24" />
          <stop offset="100%" stopColor="#7a2018" />
        </linearGradient>
      </defs>
      
      {/* 3D Brick - Top face */}
      <path 
        d="M8 20 L32 10 L56 20 L32 30 Z" 
        fill="url(#brick-top)"
      />
      
      {/* 3D Brick - Front face */}
      <path 
        d="M8 20 L8 44 L32 54 L32 30 Z" 
        fill="url(#brick-front)"
      />
      
      {/* 3D Brick - Right side face */}
      <path 
        d="M32 30 L32 54 L56 44 L56 20 Z" 
        fill="url(#brick-side)"
      />
      
      {/* Mortar lines on front */}
      <line x1="8" y1="32" x2="32" y2="42" stroke="#6b1a14" strokeWidth="1.5" opacity="0.4" />
      <line x1="20" y1="26" x2="20" y2="48" stroke="#6b1a14" strokeWidth="1" opacity="0.3" />
      
      {/* Mortar lines on side */}
      <line x1="32" y1="42" x2="56" y2="32" stroke="#5a1510" strokeWidth="1.5" opacity="0.4" />
      <line x1="44" y1="25" x2="44" y2="49" stroke="#5a1510" strokeWidth="1" opacity="0.3" />
      
      {/* Top edge highlight */}
      <path d="M10 20 L32 11 L54 20" fill="none" stroke="#ff7066" strokeWidth="1" opacity="0.5" />
      
      {/* Texture spots */}
      <circle cx="16" cy="35" r="1.5" fill="#6b1a14" opacity="0.3" />
      <circle cx="24" cy="42" r="1" fill="#6b1a14" opacity="0.25" />
      <circle cx="40" cy="32" r="1.5" fill="#5a1510" opacity="0.3" />
      <circle cx="48" cy="38" r="1" fill="#5a1510" opacity="0.25" />
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
          <stop offset="0%" stopColor="#cc2200" />
          <stop offset="30%" stopColor="#ff4500" />
          <stop offset="60%" stopColor="#ff6a00" />
          <stop offset="100%" stopColor="#ffaa00" />
        </linearGradient>
        <linearGradient id="fire-mid" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#ff6600" />
          <stop offset="50%" stopColor="#ff9900" />
          <stop offset="100%" stopColor="#ffcc00" />
        </linearGradient>
        <linearGradient id="fire-inner" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#ffdd00" />
          <stop offset="100%" stopColor="#ffffaa" />
        </linearGradient>
        <filter id="fire-glow">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* Main outer flame body */}
      <path 
        d="M32 4
           C38 12 46 22 46 34
           C46 46 40 56 32 60
           C24 56 18 46 18 34
           C18 22 26 12 32 4Z"
        fill="url(#fire-outer)"
        filter="url(#fire-glow)"
      />
      {/* Left flicker */}
      <path 
        d="M22 28
           C20 22 22 16 26 12
           C24 20 23 26 24 32
           C25 38 26 42 28 44
           C24 42 22 36 22 28Z"
        fill="#ff5500"
        opacity="0.8"
      />
      {/* Right flicker */}
      <path 
        d="M42 28
           C44 22 42 16 38 12
           C40 20 41 26 40 32
           C39 38 38 42 36 44
           C40 42 42 36 42 28Z"
        fill="#ff5500"
        opacity="0.8"
      />
      {/* Middle flame layer */}
      <path 
        d="M32 14
           C36 20 40 28 40 38
           C40 48 36 54 32 56
           C28 54 24 48 24 38
           C24 28 28 20 32 14Z"
        fill="url(#fire-mid)"
      />
      {/* Inner bright core */}
      <path 
        d="M32 26
           C35 30 37 36 37 42
           C37 48 35 52 32 54
           C29 52 27 48 27 42
           C27 36 29 30 32 26Z"
        fill="url(#fire-inner)"
      />
      {/* Hot white center */}
      <ellipse cx="32" cy="46" rx="4" ry="6" fill="#fffef0" opacity="0.95" />
      {/* Tip highlight */}
      <ellipse cx="32" cy="10" rx="2" ry="3" fill="#ffdd44" opacity="0.7" />
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
