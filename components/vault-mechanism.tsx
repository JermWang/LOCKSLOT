"use client"

import { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { TIER_CONFIG, getTierColor, type Tier } from "@/lib/game-types"
import { TierSymbol } from "@/components/reel-symbols"
import { gameSounds } from "@/lib/sounds"

interface VaultMechanismProps {
  isSpinning: boolean
  result: Tier | null
  onComplete?: () => void
}

const TIERS: Tier[] = ["brick", "mid", "hot", "legendary", "mythic"]

// Orbital ring component
function OrbitalRing({ 
  radius, 
  isSpinning, 
  speed, 
  direction,
  thickness,
  glowColor,
  delay = 0
}: { 
  radius: number
  isSpinning: boolean
  speed: number
  direction: 1 | -1
  thickness: number
  glowColor: string
  delay?: number
}) {
  const [rotation, setRotation] = useState(0)
  const animationRef = useRef<number | null>(null)
  const startTimeRef = useRef<number>(0)

  useEffect(() => {
    if (!isSpinning) {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
      return
    }

    startTimeRef.current = performance.now()
    
    const animate = (time: number) => {
      const elapsed = time - startTimeRef.current
      if (elapsed < delay) {
        animationRef.current = requestAnimationFrame(animate)
        return
      }
      
      setRotation(prev => (prev + speed * direction) % 360)
      animationRef.current = requestAnimationFrame(animate)
    }
    
    animationRef.current = requestAnimationFrame(animate)
    return () => {
      if (animationRef.current !== null) cancelAnimationFrame(animationRef.current)
    }
  }, [isSpinning, speed, direction, delay])

  return (
    <div 
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      <div 
        className="rounded-full border-2 transition-all duration-300"
        style={{ 
          width: radius * 2,
          height: radius * 2,
          borderColor: isSpinning ? glowColor : 'rgba(255,255,255,0.1)',
          borderWidth: thickness,
          boxShadow: isSpinning ? `0 0 20px ${glowColor}, inset 0 0 20px ${glowColor}40` : 'none',
        }}
      />
      {/* Orbital dot */}
      <div 
        className="absolute rounded-full transition-all duration-300"
        style={{
          width: 8,
          height: 8,
          backgroundColor: isSpinning ? glowColor : 'rgba(255,255,255,0.3)',
          boxShadow: isSpinning ? `0 0 10px ${glowColor}` : 'none',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateY(-${radius}px)`,
        }}
      />
    </div>
  )
}

// Central vault core with tier display
function VaultCore({ 
  tier, 
  isSpinning, 
  isRevealing,
  isWinner 
}: { 
  tier: Tier | null
  isSpinning: boolean
  isRevealing: boolean
  isWinner: boolean
}) {
  const [displayTier, setDisplayTier] = useState<Tier>("brick")
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isSpinning && !isRevealing) {
      // Rapidly cycle through tiers
      intervalRef.current = setInterval(() => {
        setDisplayTier(TIERS[Math.floor(Math.random() * TIERS.length)])
      }, 80)
      return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
    } else if (tier) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      setDisplayTier(tier)
    }
  }, [isSpinning, isRevealing, tier])

  const currentTier = isRevealing && tier ? tier : displayTier
  const tierConfig = TIER_CONFIG[currentTier]

  return (
    <div className={cn(
      "relative flex flex-col items-center justify-center rounded-full transition-all duration-500",
      "w-32 h-32 bg-gradient-to-br from-secondary/80 to-secondary/40",
      "border-2",
      isWinner && isRevealing 
        ? "border-primary shadow-[0_0_40px_rgba(212,175,55,0.5)]" 
        : "border-white/10",
      isSpinning && !isRevealing && "animate-pulse"
    )}>
      {/* Inner glow ring */}
      <div className={cn(
        "absolute inset-2 rounded-full transition-all duration-300",
        isRevealing && isWinner 
          ? "bg-gradient-to-br from-primary/20 to-transparent" 
          : "bg-gradient-to-br from-white/5 to-transparent"
      )} />
      
      {/* Tier symbol */}
      <div className={cn(
        "relative z-10 transition-transform duration-300",
        isSpinning && !isRevealing && "scale-90"
      )}>
        <TierSymbol 
          tier={currentTier} 
          size={48} 
          isWinner={isWinner && isRevealing}
        />
      </div>
      
      {/* Tier label */}
      <div className={cn(
        "relative z-10 mt-1 text-xs font-bold uppercase tracking-widest transition-all duration-300",
        isRevealing ? getTierColor(currentTier) : "text-muted-foreground"
      )}>
        {tierConfig.label}
      </div>
    </div>
  )
}

// Particle effect for winning reveals
function WinParticles({ active }: { active: boolean }) {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; angle: number }>>([])

  useEffect(() => {
    if (!active) {
      setParticles([])
      return
    }

    const newParticles = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: 50,
      y: 50,
      angle: (360 / 12) * i,
    }))
    setParticles(newParticles)
  }, [active])

  if (!active) return null

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute w-1 h-1 rounded-full bg-primary animate-ping"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            transform: `rotate(${p.angle}deg) translateY(-60px)`,
            animationDelay: `${p.id * 50}ms`,
          }}
        />
      ))}
    </div>
  )
}

export function VaultMechanism({ isSpinning, result, onComplete }: VaultMechanismProps) {
  const [phase, setPhase] = useState<"idle" | "spinning" | "revealing" | "complete">("idle")
  const [showResult, setShowResult] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const isWinner = result === "legendary" || result === "mythic"

  useEffect(() => {
    if (isSpinning && phase === "idle") {
      setPhase("spinning")
      setShowResult(false)
    }
  }, [isSpinning, phase])

  useEffect(() => {
    if (!isSpinning && phase === "spinning" && result) {
      // Start reveal sequence
      setPhase("revealing")
      
      timeoutRef.current = setTimeout(() => {
        setShowResult(true)
        gameSounds.reelStop()
        
        setTimeout(() => {
          if (isWinner) {
            gameSounds.winLegendary()
          } else if (result === "brick") {
            gameSounds.lose()
          }
          setPhase("complete")
          onComplete?.()
        }, 500)
      }, 800)
    }

    return () => {
      if (timeoutRef.current !== null) clearTimeout(timeoutRef.current)
    }
  }, [isSpinning, phase, result, isWinner, onComplete])

  // Reset when new spin starts
  useEffect(() => {
    if (isSpinning) {
      setPhase("spinning")
      setShowResult(false)
    }
  }, [isSpinning])

  const isActive = phase === "spinning" || phase === "revealing"

  return (
    <div className="relative flex items-center justify-center h-64">
      {/* Background glow */}
      <div className={cn(
        "absolute inset-0 flex items-center justify-center transition-opacity duration-500",
        isActive ? "opacity-100" : "opacity-0"
      )}>
        <div className={cn(
          "w-48 h-48 rounded-full blur-3xl transition-colors duration-500",
          isWinner && showResult 
            ? "bg-primary/30" 
            : "bg-primary/10"
        )} />
      </div>

      {/* Orbital rings */}
      <OrbitalRing 
        radius={100} 
        isSpinning={isActive} 
        speed={2} 
        direction={1}
        thickness={1}
        glowColor="rgba(212, 175, 55, 0.6)"
      />
      <OrbitalRing 
        radius={85} 
        isSpinning={isActive} 
        speed={3} 
        direction={-1}
        thickness={1}
        glowColor="rgba(212, 175, 55, 0.4)"
        delay={100}
      />
      <OrbitalRing 
        radius={70} 
        isSpinning={isActive} 
        speed={4} 
        direction={1}
        thickness={2}
        glowColor="rgba(212, 175, 55, 0.8)"
        delay={200}
      />

      {/* Static decorative ring */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div 
          className={cn(
            "w-52 h-52 rounded-full border transition-all duration-500",
            isActive 
              ? "border-primary/30 shadow-[0_0_30px_rgba(212,175,55,0.2)]" 
              : "border-white/5"
          )}
          style={{
            background: isActive 
              ? 'radial-gradient(circle, transparent 60%, rgba(212,175,55,0.05) 100%)'
              : 'none'
          }}
        />
      </div>

      {/* Central vault core */}
      <VaultCore 
        tier={result}
        isSpinning={isActive}
        isRevealing={showResult}
        isWinner={isWinner}
      />

      {/* Win particles */}
      <WinParticles active={showResult && isWinner} />

      {/* Corner indicators */}
      <div className="absolute inset-0 pointer-events-none">
        {[0, 90, 180, 270].map((angle) => (
          <div
            key={angle}
            className={cn(
              "absolute w-2 h-2 transition-all duration-300",
              isActive ? "bg-primary/60" : "bg-white/10"
            )}
            style={{
              top: '50%',
              left: '50%',
              transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-110px)`,
              clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)',
            }}
          />
        ))}
      </div>

      {/* Status text */}
      <div className={cn(
        "absolute bottom-0 left-1/2 -translate-x-1/2 text-xs uppercase tracking-widest font-semibold transition-all duration-300",
        isActive ? "text-primary" : "text-muted-foreground/50"
      )}>
        {phase === "spinning" && "Locking..."}
        {phase === "revealing" && "Securing..."}
        {phase === "complete" && showResult && (isWinner ? "Locked!" : "Sealed")}
        {phase === "idle" && "Ready"}
      </div>
    </div>
  )
}
