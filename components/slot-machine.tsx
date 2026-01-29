"use client"

import { useState, useEffect, useRef } from "react"
import { useGameStore } from "@/lib/game-store"
import { TIER_CONFIG, getTierColor, getTierBgColor, type Tier } from "@/lib/game-types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Lock, Unlock, Settings, Check, X, Volume2, VolumeX, Music, Music2, TrendingUp, Timer, Vault } from "lucide-react"
import { gameSounds, isSoundEnabled, setSoundEnabled, isMusicEnabled, resumeAudio } from "@/lib/sounds"
import { gameToast } from "@/lib/toast"
import { TierSymbol, TIER_LABELS } from "@/components/reel-symbols"
import { ArcGauge } from "@/components/arc-gauge"

const DEFAULT_QUICK_AMOUNTS = [100, 500, 1000, 5000]
const STORAGE_KEY = "lockslot_quick_amounts"

// DEV MODE: Enable free spins for testing
const FREE_SPIN_MODE = true

function getStoredAmounts(): number[] {
  if (typeof window === "undefined") return DEFAULT_QUICK_AMOUNTS
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      if (Array.isArray(parsed) && parsed.length === 4 && parsed.every(n => typeof n === "number" && n > 0)) {
        return parsed
      }
    }
  } catch {}
  return DEFAULT_QUICK_AMOUNTS
}

function saveAmounts(amounts: number[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(amounts))
}

const REEL_ITEMS: { tier: Tier; label: string }[] = [
  { tier: "brick", label: "BRICK" },
  { tier: "mid", label: "MID" },
  { tier: "hot", label: "HOT" },
  { tier: "legendary", label: "LEGEND" },
  { tier: "mythic", label: "MYTHIC" },
]

const REEL_ITEM_HEIGHT = 80
const REEL_VIEWPORT_HEIGHT = 160

// Easing with slight overshoot for satisfying stop
function easeOutBack(t: number) {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function SlotReel({ 
  isSpinning,
  spinKey,
  result,
  reelIndex = 0,
  onStopped,
}: { 
  isSpinning: boolean
  spinKey: number
  result: Tier | null
  reelIndex?: number
  onStopped?: (reelIndex: number) => void
}) {
  const [offset, setOffset] = useState(0)
  const [velocity, setVelocity] = useState(0)
  const rafRef = useRef<number | null>(null)
  const offsetRef = useRef(0)
  const velocityRef = useRef(0)
  const isSpinningRef = useRef(false)
  const hasStoppedRef = useRef(false)
  const lastTickRef = useRef(-1)
  const stopAnimRef = useRef<{ start: number; from: number; to: number } | null>(null)

  const n = REEL_ITEMS.length
  const isWinner = result && (result === "legendary" || result === "mythic") && !isSpinning

  // Get visible items based on current offset
  const getVisibleItems = (off: number) => {
    const items: { item: typeof REEL_ITEMS[0]; yOffset: number; key: number; distFromCenter: number }[] = []
    const centerIndex = Math.floor(off)
    const fractional = off - centerIndex
    
    for (let i = -2; i <= 2; i++) {
      const idx = ((centerIndex + i) % n + n) % n
      const yOffset = (i - fractional) * REEL_ITEM_HEIGHT
      const distFromCenter = Math.abs(yOffset)
      items.push({ item: REEL_ITEMS[idx], yOffset, key: centerIndex + i, distFromCenter })
    }
    return items
  }

  const visibleItems = getVisibleItems(offset)

  useEffect(() => {
    isSpinningRef.current = isSpinning
    
    if (!isSpinning) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      return
    }

    // Start spinning
    hasStoppedRef.current = false
    stopAnimRef.current = null
    velocityRef.current = 18 + reelIndex * 3
    lastTickRef.current = -1
    
    const startTime = performance.now()
    const minSpinTime = 600 + reelIndex * 250

    const animate = () => {
      if (!isSpinningRef.current && stopAnimRef.current === null) {
        rafRef.current = null
        return
      }

      const now = performance.now()
      
      // Check if we should start the stop animation
      if (result && stopAnimRef.current === null && now - startTime >= minSpinTime) {
        const targetIdx = REEL_ITEMS.findIndex(item => item.tier === result)
        const currentIdx = Math.floor(offsetRef.current)
        // Calculate target: at least 2 full rotations ahead, landing on result
        let target = currentIdx + n * 3
        while (target % n !== targetIdx) target++
        
        stopAnimRef.current = {
          start: now,
          from: offsetRef.current,
          to: target
        }
      }

      // Stop animation with easing
      if (stopAnimRef.current !== null) {
        const { start, from, to } = stopAnimRef.current
        const duration = 1200 + reelIndex * 150
        const elapsed = now - start
        const progress = Math.min(1, elapsed / duration)
        const eased = easeOutBack(progress)
        
        offsetRef.current = from + (to - from) * eased
        velocityRef.current = progress < 1 ? (to - from) * (1 - progress) * 0.01 : 0
        
        if (progress >= 1) {
          offsetRef.current = to
          stopAnimRef.current = null
          velocityRef.current = 0
          
          if (!hasStoppedRef.current) {
            hasStoppedRef.current = true
            gameSounds.reelStop()
            onStopped?.(reelIndex)
          }
          setOffset(offsetRef.current)
          setVelocity(0)
          rafRef.current = null
          return
        }
      } else {
        // Free spinning with slight acceleration feel
        offsetRef.current += velocityRef.current * 0.016
      }

      // Tick sound (less frequent for performance)
      const tickIdx = Math.floor(offsetRef.current)
      if (tickIdx !== lastTickRef.current) {
        lastTickRef.current = tickIdx
        if (tickIdx % 3 === 0) gameSounds.reelTick()
      }

      setOffset(offsetRef.current)
      setVelocity(velocityRef.current)
      rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [isSpinning, spinKey, reelIndex, result, onStopped])

  const centerY = REEL_VIEWPORT_HEIGHT / 2 - REEL_ITEM_HEIGHT / 2
  const isHighSpeed = velocity > 10

  return (
    <div className={cn(
      "relative h-32 w-full overflow-hidden rounded-lg border slot-reel-glow transition-shadow duration-300",
      "bg-gradient-to-b from-black/40 via-black/20 to-black/40",
      "backdrop-blur-md",
      isWinner && result === "mythic" && "glow-mythic border-pink-400/60",
      isWinner && result === "legendary" && "glow-legendary border-emerald-400/60",
      !isWinner && "border-white/10"
    )}>
      {/* Glassmorphic inner glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-white/5 pointer-events-none" />
      {/* Reel shine overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
      
      {/* Top/bottom fade */}
      <div className="absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-background/95 to-transparent z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-background/95 to-transparent z-10 pointer-events-none" />
      
      {/* Center highlight */}
      <div className={cn(
        "absolute left-0 right-0 top-1/2 -translate-y-1/2 h-16 border-y pointer-events-none transition-all duration-200",
        isWinner ? "border-primary/40 bg-primary/10" : "border-primary/20 bg-primary/5"
      )} />

      {/* Visible items with scaling effect */}
      {visibleItems.map(({ item, yOffset, key, distFromCenter }) => {
        const scale = Math.max(0.85, 1 - distFromCenter * 0.002)
        const opacity = Math.max(0.4, 1 - distFromCenter * 0.006)
        const isCenter = distFromCenter < REEL_ITEM_HEIGHT * 0.5
        
        return (
          <div
            key={key}
            className="absolute left-0 right-0 h-20 flex flex-col items-center justify-center gap-1.5"
            style={{ 
              transform: `translateY(${centerY + yOffset}px) scale(${scale}) translateZ(0)`,
              opacity,
              willChange: isSpinning ? 'transform, opacity' : 'auto',
            }}
          >
            <div className={cn(
              "select-none transition-transform duration-100",
              isCenter && !isSpinning && "scale-110"
            )}>
              <TierSymbol 
                tier={item.tier} 
                size={44} 
                isCenter={isCenter}
                isWinner={isCenter && isWinner || undefined}
              />
            </div>
            <span
              className={cn(
                "text-xs font-bold font-mono tracking-widest select-none uppercase",
                getTierColor(item.tier),
                isCenter && isWinner && "animate-pulse"
              )}
            >
              {item.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function ReelDisplay({ 
  label, 
  value, 
  isSpinning,
  suffix = "",
  icon: Icon,
  highlight = false
}: { 
  label: string
  value: string | number
  isSpinning: boolean
  suffix?: string
  icon?: React.ComponentType<{ className?: string }>
  highlight?: boolean
}) {
  const [randomValue, setRandomValue] = useState<number>(() =>
    typeof value === "number" ? value : 0
  )

  useEffect(() => {
    if (!isSpinning || typeof value !== "number") return
    const interval = setInterval(() => {
      setRandomValue(Math.floor(Math.random() * 20) + 1)
    }, 50)
    return () => clearInterval(interval)
  }, [isSpinning, value])

  const displayValue = isSpinning && typeof value === "number" ? randomValue : value

  return (
    <div className={cn(
      "flex flex-col items-center gap-2 rounded-xl border p-4 transition-all",
      highlight 
        ? "border-primary/50 bg-primary/10" 
        : "border-border bg-secondary/30"
    )}>
      <div className="flex items-center gap-1.5">
        {Icon && <Icon className={cn("h-3 w-3", highlight ? "text-primary" : "text-muted-foreground")} />}
        <span className={cn(
          "text-xs uppercase tracking-wider font-semibold",
          highlight ? "text-primary" : "text-muted-foreground"
        )}>{label}</span>
      </div>
      <div className="font-mono">
        <span className={cn(
          "text-3xl font-black",
          highlight ? "text-primary text-glow-primary" : "text-foreground"
        )}>
          {displayValue}
        </span>
        <span className={cn(
          "text-lg font-bold ml-0.5",
          highlight ? "text-primary/70" : "text-muted-foreground"
        )}>{suffix}</span>
      </div>
    </div>
  )
}

export function SlotMachine() {
  const [stakeAmount, setStakeAmount] = useState("")
  const { isSpinning, lastResult, userBalance, spin } = useGameStore()
  const [localResult, setLocalResult] = useState<typeof lastResult>(null)
  const [showResult, setShowResult] = useState(false)
  const [spinCount, setSpinCount] = useState(0)
  const [reelsSpinning, setReelsSpinning] = useState(false)
  const reelStopCountRef = useRef(0)
  const resultRef = useRef<typeof lastResult>(null)
  const resultSoundTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Customizable quick amounts
  const [quickAmounts, setQuickAmounts] = useState<number[]>(DEFAULT_QUICK_AMOUNTS)
  const [isEditingAmounts, setIsEditingAmounts] = useState(false)
  const [editingAmounts, setEditingAmounts] = useState<string[]>(["", "", "", ""])
  
  // Sound state
  const [soundEnabled, setSoundEnabledState] = useState(true)
  const [musicEnabled, setMusicEnabledState] = useState(false)
  
  useEffect(() => {
    setSoundEnabledState(isSoundEnabled())
    setMusicEnabledState(isMusicEnabled())
  }, [])
  
  const toggleSound = () => {
    const newState = !soundEnabled
    setSoundEnabledState(newState)
    setSoundEnabled(newState)
    if (newState) {
      resumeAudio()
      gameSounds.click()
    }
  }

  const toggleMusic = () => {
    const newState = !musicEnabled
    setMusicEnabledState(newState)
    if (newState) {
      resumeAudio()
      gameSounds.startMusic()
    } else {
      gameSounds.stopMusic()
    }
  }

  // Load stored amounts on mount
  useEffect(() => {
    const timeout = setTimeout(() => {
      setQuickAmounts(getStoredAmounts())
    }, 0)
    return () => clearTimeout(timeout)
  }, [])

  const startEditing = () => {
    gameSounds.click()
    setEditingAmounts(quickAmounts.map(a => a.toString()))
    setIsEditingAmounts(true)
  }

  const cancelEditing = () => {
    gameSounds.click()
    setIsEditingAmounts(false)
    setEditingAmounts(["", "", "", ""])
  }

  const saveEditing = () => {
    gameSounds.success()
    const newAmounts = editingAmounts.map(s => {
      const num = parseFloat(s)
      return isNaN(num) || num <= 0 ? 100 : Math.round(num)
    })
    setQuickAmounts(newAmounts)
    saveAmounts(newAmounts)
    setIsEditingAmounts(false)
  }

  const updateEditingAmount = (index: number, value: string) => {
    const newEditing = [...editingAmounts]
    newEditing[index] = value
    setEditingAmounts(newEditing)
  }

  const handleSpin = async () => {
    const amount = Number.parseFloat(stakeAmount) || 100 // Default to 100 in free mode
    if (!FREE_SPIN_MODE && (Number.isNaN(amount) || amount <= 0)) return
    if (!FREE_SPIN_MODE && amount > userBalance) return

    setShowResult(false)
    setLocalResult(null)
    resultRef.current = null
    reelStopCountRef.current = 0
    if (resultSoundTimeoutRef.current) {
      clearTimeout(resultSoundTimeoutRef.current)
      resultSoundTimeoutRef.current = null
    }
    setSpinCount(prev => prev + 1)
    setReelsSpinning(true)
    
    // Play spin start sound
    resumeAudio()
    gameSounds.spinStart()

    try {
      const result = await spin(amount)
      setLocalResult(result)
      resultRef.current = result
    } catch {
      // Handle error
      gameSounds.error()
      setReelsSpinning(false)
    }
  }

  const handleReelStopped = (index: number) => {
    gameSounds.reelStop(index)
    reelStopCountRef.current += 1
    if (reelStopCountRef.current >= 3) {
      setReelsSpinning(false)
      setShowResult(true)
      const r = resultRef.current
      if (!r) return
      
      // Show toast/confetti AFTER reels have stopped
      gameToast.spin(r.tier, r.multiplier, r.duration)
      
      resultSoundTimeoutRef.current = setTimeout(() => {
        if (r.tier === "mythic") {
          gameSounds.winMythic()
        } else if (r.tier === "legendary") {
          gameSounds.winLegendary()
        } else if (r.tier === "hot") {
          gameSounds.winHot()
        } else {
          gameSounds.lose()
        }
      }, 120)
    }
  }

  const handleQuickAmount = (amount: number) => {
    gameSounds.click()
    setStakeAmount(amount.toString())
  }

  const stakeNum = Number.parseFloat(stakeAmount) || 0
  const feeAmount = stakeNum * 0.05
  const isButtonDisabled = isSpinning || reelsSpinning || (!FREE_SPIN_MODE && (!stakeAmount || stakeNum <= 0 || stakeNum > userBalance))
  const isWinner = localResult && (localResult.tier === "legendary" || localResult.tier === "mythic")

  return (
    <div className="flex flex-col h-full">
      {/* Sound & Music toggles */}
      <div className="flex justify-end gap-1 mb-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleMusic}
          className={cn(
            "h-8 w-8 p-0 transition-colors",
            musicEnabled ? "text-primary" : "text-muted-foreground hover:text-foreground"
          )}
          title={musicEnabled ? "Stop lo-fi music" : "Play lo-fi jazz"}
        >
          {musicEnabled ? <Music className="h-4 w-4" /> : <Music2 className="h-4 w-4 opacity-50" />}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSound}
          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
          title={soundEnabled ? "Mute sounds" : "Enable sounds"}
        >
          {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
        </Button>
      </div>

      {/* Vault Slot Cabinet - Premium 3-reel design with vault frame */}
      <div className="vault-cabinet relative">
        {/* Vault Door Frame */}
        <div className="absolute -inset-4 rounded-2xl border-4 border-primary/30 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none">
          {/* Corner Lock Bolts */}
          <div className="absolute top-2 left-2 w-4 h-4 rounded-full bg-primary/40 border-2 border-primary/60 shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]" />
          <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-primary/40 border-2 border-primary/60 shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]" />
          <div className="absolute bottom-2 left-2 w-4 h-4 rounded-full bg-primary/40 border-2 border-primary/60 shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]" />
          <div className="absolute bottom-2 right-2 w-4 h-4 rounded-full bg-primary/40 border-2 border-primary/60 shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]" />
          
          {/* Top Vault Label */}
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 px-4 py-1 bg-background border border-primary/40 rounded-full">
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Lock Vault</span>
          </div>
        </div>

        {/* Slot Reels */}
        <div className="grid grid-cols-3 gap-2 relative z-10">
          <SlotReel 
            isSpinning={reelsSpinning} 
            spinKey={spinCount}
            result={localResult?.tier ?? null}
            reelIndex={0}
            onStopped={handleReelStopped}
          />
          <SlotReel 
            isSpinning={reelsSpinning} 
            spinKey={spinCount}
            result={localResult?.tier ?? null}
            reelIndex={1}
            onStopped={handleReelStopped}
          />
          <SlotReel 
            isSpinning={reelsSpinning} 
            spinKey={spinCount}
            result={localResult?.tier ?? null}
            reelIndex={2}
            onStopped={handleReelStopped}
          />
        </div>

        {/* Lock Mechanism Overlay - appears when reels stop */}
        {showResult && localResult && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className={cn(
              "absolute inset-0 rounded-lg transition-all duration-500",
              isWinner 
                ? "bg-gradient-to-t from-primary/20 via-transparent to-primary/10 animate-pulse" 
                : "bg-gradient-to-t from-secondary/10 via-transparent to-transparent"
            )} />
            {/* Lock seal animation */}
            <div className={cn(
              "absolute -bottom-2 left-1/2 -translate-x-1/2 transition-all duration-300",
              isWinner ? "opacity-100 scale-100" : "opacity-50 scale-90"
            )}>
              <div className={cn(
                "px-3 py-1 rounded-full border text-[9px] font-bold uppercase tracking-widest",
                isWinner 
                  ? "bg-primary/20 border-primary/50 text-primary" 
                  : "bg-secondary/50 border-border text-muted-foreground"
              )}>
                {isWinner ? "✦ Sealed ✦" : "Locked"}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Lock Result - Staking outcome display */}
      {showResult && localResult ? (
        <div className={cn(
          "rounded-lg border p-4 mb-3",
          isWinner ? "border-primary/50 bg-primary/5" : "border-border/50 bg-secondary/20"
        )}>
          {/* Header with lock status */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Lock className={cn("h-4 w-4", isWinner ? "text-primary" : "text-muted-foreground")} />
              <span className="text-xs uppercase tracking-widest font-semibold text-muted-foreground">
                Stake Locked
              </span>
            </div>
            <div className="flex items-center gap-2">
              <TierSymbol tier={localResult.tier} size={24} isWinner={isWinner || undefined} />
              <span className={cn("text-sm font-black tracking-wide", getTierColor(localResult.tier))}>
                {TIER_CONFIG[localResult.tier].label}
              </span>
            </div>
          </div>
          
          {/* Main stats row */}
          <div className="grid grid-cols-3 gap-3">
            {/* Lock Duration */}
            <div className="text-center p-2 rounded-lg bg-secondary/30">
              <Timer className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
              <div className="text-xl font-mono font-black text-foreground">
                {localResult.duration}
              </div>
              <div className="text-[9px] uppercase tracking-widest text-muted-foreground">
                Day Lock
              </div>
            </div>
            
            {/* Yield Multiplier */}
            <div className={cn(
              "text-center p-2 rounded-lg",
              isWinner ? "bg-primary/10" : "bg-secondary/30"
            )}>
              <TrendingUp className={cn("h-4 w-4 mx-auto mb-1", isWinner ? "text-primary" : "text-muted-foreground")} />
              <div className={cn(
                "text-xl font-mono font-black",
                isWinner ? "text-primary" : "text-foreground"
              )}>
                {localResult.multiplier}×
              </div>
              <div className="text-[9px] uppercase tracking-widest text-muted-foreground">
                Yield
              </div>
            </div>
            
            {/* Duration Gauge */}
            <div className="flex items-center justify-center">
              <ArcGauge 
                value={localResult.duration} 
                size={64} 
                strokeWidth={5}
                animated={true}
              />
            </div>
          </div>
          
          {/* Bonus eligibility */}
          {isWinner && (
            <div className="mt-3 pt-3 border-t border-primary/20 text-center">
              <span className="text-xs uppercase tracking-widest text-primary font-bold">
                ✦ Eligible for Epoch Bonus Distribution ✦
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-lg border border-border/30 bg-secondary/10 p-4 mb-3">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Vault className="h-5 w-5 text-primary" />
            </div>
            <div className="text-left">
              <div className="text-foreground text-sm font-semibold">Stake to Earn</div>
              <div className="text-[10px] text-muted-foreground">Lock tokens → Get multiplied rewards</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
            <div className="p-2 rounded bg-secondary/30">
              <Timer className="h-3 w-3 mx-auto mb-1 text-muted-foreground" />
              <span className="text-muted-foreground">Lock Duration</span>
            </div>
            <div className="p-2 rounded bg-secondary/30">
              <TrendingUp className="h-3 w-3 mx-auto mb-1 text-muted-foreground" />
              <span className="text-muted-foreground">Yield Multiplier</span>
            </div>
            <div className="p-2 rounded bg-secondary/30">
              <Lock className="h-3 w-3 mx-auto mb-1 text-muted-foreground" />
              <span className="text-muted-foreground">Tier Bonus</span>
            </div>
          </div>
        </div>
      )}

      {/* Stake Amount */}
      <div className="mt-auto space-y-2">
        {/* Balance indicator with vault icon */}
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Vault className="h-3 w-3" />
            Available to Lock
          </span>
          <span className="font-mono font-bold text-foreground">{userBalance.toLocaleString()} $LOCK</span>
        </div>

        {/* Input with quick amounts */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              type="number"
              placeholder="Stake amount"
              value={stakeAmount}
              onChange={(e) => setStakeAmount(e.target.value)}
              className="h-10 bg-black/40 backdrop-blur-sm border-white/10 pr-16 text-base font-mono font-bold"
              disabled={isSpinning}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              $LOCK
            </span>
          </div>
          <Button
            variant="outline"
            onClick={() => handleQuickAmount(userBalance)}
            disabled={isSpinning}
            className="h-10 px-3 text-xs font-bold bg-black/30 backdrop-blur-sm border-white/10 hover:bg-white/10 hover:border-white/20"
          >
            MAX
          </Button>
        </div>

        {/* Quick amount buttons - Customizable */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Quick Amounts</span>
            {!isEditingAmounts ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={startEditing}
                className="h-5 px-2 text-[10px] text-muted-foreground hover:text-foreground"
              >
                <Settings className="h-3 w-3 mr-1" />
                Edit
              </Button>
            ) : (
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={saveEditing}
                  className="h-5 px-2 text-[10px] text-primary hover:text-primary"
                >
                  <Check className="h-3 w-3 mr-1" />
                  Save
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={cancelEditing}
                  className="h-5 px-2 text-[10px] text-muted-foreground hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
          
          {isEditingAmounts ? (
            <div className="grid grid-cols-4 gap-2">
              {editingAmounts.map((value, index) => (
                <Input
                  key={index}
                  type="number"
                  value={value}
                  onChange={(e) => updateEditingAmount(index, e.target.value)}
                  className="h-8 text-xs font-mono text-center bg-secondary/50 border-primary/50"
                  placeholder="0"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {quickAmounts.map((amount, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleQuickAmount(amount)}
                  disabled={isSpinning || amount > userBalance}
                  className="font-mono text-xs h-8 bg-black/30 backdrop-blur-sm border-white/10 hover:bg-white/10 hover:border-white/20 transition-all"
                >
                  {amount >= 1000 ? `${(amount/1000).toFixed(amount % 1000 === 0 ? 0 : 1)}K` : amount}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Protocol fee preview */}
        {stakeNum > 0 && (
          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <span>Protocol fee (5%): -{feeAmount.toFixed(0)}</span>
            <span className="text-foreground font-medium">Locked: {(stakeNum - feeAmount).toFixed(0)} $LOCK</span>
          </div>
        )}

        {/* Lock Stake Button - Staking-focused */}
        <div className="flex justify-center">
          <button
            onClick={handleSpin}
            disabled={isButtonDisabled}
            className={cn(
              "btn-premium px-8 py-3 text-sm font-bold uppercase tracking-widest",
              isButtonDisabled && "opacity-50 cursor-not-allowed"
            )}
          >
            {isSpinning || reelsSpinning ? (
              <span className="flex items-center gap-2">
                <Unlock className="h-4 w-4 animate-pulse" />
                LOCKING...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                LOCK STAKE
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
