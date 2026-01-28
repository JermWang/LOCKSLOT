"use client"

import { useState, useEffect, useRef } from "react"
import { useGameStore } from "@/lib/game-store"
import { TIER_CONFIG, getTierColor, getTierBgColor, type Tier } from "@/lib/game-types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Zap, Lock, Hash, Settings, Check, X, Volume2, VolumeX } from "lucide-react"
import { gameSounds, isSoundEnabled, setSoundEnabled, resumeAudio } from "@/lib/sounds"
import { gameToast } from "@/lib/toast"

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

const REEL_ITEMS: { tier: Tier; label: string; symbol: string }[] = [
  { tier: "brick", label: "BRICK", symbol: "🧱" },
  { tier: "mid", label: "MID", symbol: "📊" },
  { tier: "hot", label: "HOT", symbol: "🔥" },
  { tier: "legendary", label: "LEGENDARY", symbol: "💎" },
  { tier: "mythic", label: "MYTHIC", symbol: "⚡" },
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
      "relative h-40 w-full overflow-hidden rounded-xl border-2 slot-reel-glow transition-shadow duration-300",
      "bg-gradient-to-b from-secondary/80 via-secondary/40 to-secondary/80",
      isWinner && result === "mythic" && "glow-mythic border-pink-400",
      isWinner && result === "legendary" && "glow-legendary border-emerald-400",
      !isWinner && "border-border/50"
    )}>
      {/* Reel shine overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />
      
      {/* Top/bottom fade */}
      <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-background/95 to-transparent z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-background/95 to-transparent z-10 pointer-events-none" />
      
      {/* Center highlight */}
      <div className={cn(
        "absolute left-0 right-0 top-1/2 -translate-y-1/2 h-20 border-y pointer-events-none transition-all duration-200",
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
              transform: `translateY(${centerY + yOffset}px) scale(${scale})`,
              opacity,
              filter: isHighSpeed && !isCenter ? 'blur(1px)' : 'none',
            }}
          >
            <span className={cn(
              "text-3xl leading-none select-none transition-transform duration-100",
              isCenter && !isSpinning && "scale-110"
            )}>{item.symbol}</span>
            <span
              className={cn(
                "text-sm font-black font-mono tracking-wider select-none",
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
  
  useEffect(() => {
    setSoundEnabledState(isSoundEnabled())
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
      {/* Sound toggle */}
      <div className="flex justify-end mb-2">
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

      {/* Slot Reels - Main visual focus */}
      <div className="grid grid-cols-3 gap-3 mb-4">
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

      {/* Result Display - Compact */}
      {showResult && localResult ? (
        <div className={cn(
          "rounded-lg border-2 p-3 mb-4 text-center",
          isWinner ? "border-primary bg-primary/10" : "border-border bg-secondary/30"
        )}>
          <div className="flex items-center justify-center gap-4">
            <div>
              <span className={cn("text-xl font-black", getTierColor(localResult.tier))}>
                {TIER_CONFIG[localResult.tier].label}
              </span>
            </div>
            <div className="text-muted-foreground">•</div>
            <div className="font-mono text-sm">
              <span className="text-foreground font-bold">{localResult.duration >= 24 ? `${Math.round(localResult.duration / 24 * 10) / 10}d` : `${localResult.duration}h`}</span>
              <span className="text-muted-foreground"> lock</span>
            </div>
            <div className="text-muted-foreground">•</div>
            <div className="font-mono text-sm">
              <span className="text-foreground font-bold">{localResult.multiplier}×</span>
              <span className="text-muted-foreground"> mult</span>
            </div>
            {isWinner && (
              <>
                <div className="text-muted-foreground">•</div>
                <div className="text-primary font-mono font-bold text-sm">
                  🎉 WIN
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-secondary/20 p-3 mb-4 text-center text-muted-foreground text-sm">
          Enter amount below and spin to play
        </div>
      )}

      {/* Stake Input - Simplified */}
      <div className="mt-auto space-y-3">
        {/* Balance indicator */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Your Balance</span>
          <span className="font-mono font-bold text-foreground">{userBalance.toLocaleString()} tokens</span>
        </div>

        {/* Input with quick amounts */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              type="number"
              placeholder="Amount"
              value={stakeAmount}
              onChange={(e) => setStakeAmount(e.target.value)}
              className="h-12 bg-secondary/50 pr-16 text-lg font-mono font-bold"
              disabled={isSpinning}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              tokens
            </span>
          </div>
          <Button
            variant="outline"
            onClick={() => handleQuickAmount(userBalance)}
            disabled={isSpinning}
            className="h-12 px-4 text-xs font-bold"
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
                  className="font-mono text-xs h-8 bg-secondary/30"
                >
                  {amount >= 1000 ? `${(amount/1000).toFixed(amount % 1000 === 0 ? 0 : 1)}K` : amount}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Fee preview - subtle */}
        {stakeNum > 0 && (
          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <span>5% fee: -{feeAmount.toFixed(0)}</span>
            <span>You lock: {(stakeNum - feeAmount).toFixed(0)} tokens</span>
          </div>
        )}

        {/* Big Spin Button */}
        <Button
          onClick={handleSpin}
          disabled={isButtonDisabled}
          className={cn(
            "h-14 w-full text-lg font-black uppercase tracking-wider",
            !isButtonDisabled && "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
        >
          {isSpinning || reelsSpinning ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin">◐</span>
              SPINNING...
            </span>
          ) : (
            "🎰 SPIN"
          )}
        </Button>
      </div>
    </div>
  )
}
