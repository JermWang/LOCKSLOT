"use client"

import { useState, useEffect, useRef } from "react"
import { useGameStore } from "@/lib/game-store"
import { TIER_CONFIG, getTierColor, getTierBgColor, type Tier } from "@/lib/game-types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Zap, Lock, Hash, Settings, Check, X, Volume2, VolumeX } from "lucide-react"
import { gameSounds, isSoundEnabled, setSoundEnabled, resumeAudio } from "@/lib/sounds"

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

const REEL_REPEAT = 60
const REEL_ITEM_HEIGHT = 56
const REEL_VIEWPORT_HEIGHT = 112
const REEL_CENTER_OFFSET = (REEL_VIEWPORT_HEIGHT - REEL_ITEM_HEIGHT) / 2
const REEL_STRIP: { tier: Tier; label: string; symbol: string }[] = Array.from(
  { length: REEL_ITEMS.length * REEL_REPEAT },
  (_, i) => REEL_ITEMS[i % REEL_ITEMS.length]
)

function easeOutBack(t: number) {
  const s = 1.70158
  const u = t - 1
  return 1 + (s + 1) * u * u * u + s * u * u
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
  const stripRef = useRef<HTMLDivElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const offsetRef = useRef(0)
  const lastTsRef = useRef<number | null>(null)
  const startedAtRef = useRef<number | null>(null)
  const targetTierRef = useRef<Tier | null>(null)
  const stoppingRef = useRef(false)
  const stopFromRef = useRef(0)
  const stopToRef = useRef(0)
  const stopStartRef = useRef(0)
  const stopDurationRef = useRef(0)
  const lastTickIndexRef = useRef<number | null>(null)

  const isWinner = result && (result === "legendary" || result === "mythic") && !isSpinning

  useEffect(() => {
    targetTierRef.current = result
  }, [result])

  const setTransform = () => {
    const el = stripRef.current
    if (!el) return
    const y = REEL_CENTER_OFFSET - offsetRef.current * REEL_ITEM_HEIGHT
    el.style.transform = `translate3d(0, ${y}px, 0)`
  }

  const stopNow = (tier: Tier) => {
    const resultIndex = REEL_ITEMS.findIndex((item) => item.tier === tier)
    const n = REEL_ITEMS.length
    const from = offsetRef.current
    const base = Math.floor(from) + n * (12 + reelIndex * 2)
    let to = base
    while (to % n !== resultIndex) to += 1

    stoppingRef.current = true
    stopFromRef.current = from
    stopToRef.current = to
    stopStartRef.current = performance.now()
    stopDurationRef.current = 900 + reelIndex * 180
  }

  const tickIfNeeded = () => {
    const idx = Math.floor(offsetRef.current)
    if (lastTickIndexRef.current === null) {
      lastTickIndexRef.current = idx
      return
    }
    if (idx !== lastTickIndexRef.current) {
      lastTickIndexRef.current = idx
      if (idx % 4 === 0) gameSounds.reelTick()
    }
  }

  const loop = (ts: number) => {
    if (!isSpinning && !stoppingRef.current) {
      rafRef.current = null
      lastTsRef.current = null
      return
    }

    if (lastTsRef.current === null) lastTsRef.current = ts
    const dt = Math.min(0.05, (ts - lastTsRef.current) / 1000)
    lastTsRef.current = ts

    if (!stoppingRef.current) {
      const speed = 26 + reelIndex * 2
      offsetRef.current += speed * dt
      tickIfNeeded()

      const n = REEL_ITEMS.length
      const wrapMin = n * Math.floor(REEL_REPEAT / 3)
      const wrapMax = n * Math.floor((REEL_REPEAT * 2) / 3)
      const wrapStep = n * Math.floor(REEL_REPEAT / 3)
      if (offsetRef.current > wrapMax) offsetRef.current -= wrapStep
      if (offsetRef.current < wrapMin) offsetRef.current += wrapStep

      const targetTier = targetTierRef.current
      const startedAt = startedAtRef.current
      if (targetTier && startedAt !== null) {
        const minSpinMs = 900 + reelIndex * 220
        if (performance.now() - startedAt >= minSpinMs) {
          stopNow(targetTier)
        }
      }
    } else {
      const t = (ts - stopStartRef.current) / stopDurationRef.current
      const clamped = Math.max(0, Math.min(1, t))
      const eased = easeOutBack(clamped)
      offsetRef.current = stopFromRef.current + (stopToRef.current - stopFromRef.current) * eased

      if (clamped >= 1) {
        offsetRef.current = stopToRef.current
        stoppingRef.current = false
        setTransform()
        rafRef.current = null
        lastTsRef.current = null
        onStopped?.(reelIndex)
        return
      }
    }

    setTransform()
    rafRef.current = requestAnimationFrame(loop)
  }

  useEffect(() => {
    if (!isSpinning) return

    stoppingRef.current = false
    startedAtRef.current = performance.now()
    lastTsRef.current = null
    lastTickIndexRef.current = null

    if (!Number.isFinite(offsetRef.current)) offsetRef.current = 0
    const n = REEL_ITEMS.length
    const base = n * Math.floor(REEL_REPEAT / 2)
    offsetRef.current = base + (offsetRef.current % n) + reelIndex * 0.2
    setTransform()

    if (rafRef.current === null) {
      rafRef.current = requestAnimationFrame(loop)
    }

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      lastTsRef.current = null
      startedAtRef.current = null
      stoppingRef.current = false
    }
  }, [isSpinning, spinKey, reelIndex])

  return (
    <div className={cn(
      "relative h-28 w-full overflow-hidden rounded-xl border-2 transition-all duration-300 slot-reel-glow",
      "bg-gradient-to-b from-secondary/80 via-secondary/40 to-secondary/80",
      isWinner && result === "mythic" && "glow-mythic border-pink-400",
      isWinner && result === "legendary" && "glow-legendary border-emerald-400",
      !isWinner && "border-border/50"
    )}>
      {/* Reel shine overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
      
      {/* Top/bottom fade */}
      <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-background/80 to-transparent z-10" />
      <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-background/80 to-transparent z-10" />
      
      <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-14 border-y border-white/5" />

      <div
        ref={stripRef}
        className={cn(
          "absolute left-0 right-0 will-change-transform",
          isSpinning && "blur-[0.6px]"
        )}
        style={{ transform: `translate3d(0, ${REEL_CENTER_OFFSET}px, 0)` }}
      >
        {REEL_STRIP.map((item, i) => (
          <div key={i} className="h-14 flex flex-col items-center justify-center gap-0.5">
            <span className="text-2xl leading-none">{item.symbol}</span>
            <span
              className={cn(
                "text-sm font-black font-mono tracking-wider transition-all",
                getTierColor(item.tier),
                isWinner && "text-glow-mythic"
              )}
            >
              {item.label}
            </span>
          </div>
        ))}
      </div>
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
              <span className="text-foreground font-bold">{localResult.duration}d</span>
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
