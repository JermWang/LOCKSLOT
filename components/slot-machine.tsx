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
      "relative h-32 w-full overflow-hidden rounded-md transition-shadow duration-300",
      "bg-gradient-to-b from-[#050f19] via-[#081420] to-[#050f19]",
      isWinner && result === "mythic" && "shadow-[0_0_30px_rgba(168,85,247,0.4)]",
      isWinner && result === "legendary" && "shadow-[0_0_30px_rgba(0,212,170,0.4)]"
    )}>
      {/* Inner glow effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#00d4aa]/5 via-transparent to-[#00d4aa]/5 pointer-events-none" />
      
      {/* Top/bottom fade for depth */}
      <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-[#050f19] to-transparent z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[#050f19] to-transparent z-10 pointer-events-none" />
      
      {/* Center highlight line */}
      <div className={cn(
        "absolute left-0 right-0 top-1/2 -translate-y-1/2 h-14 border-y pointer-events-none transition-all duration-200",
        isWinner ? "border-[#00d4aa]/40 bg-[#00d4aa]/10" : "border-[#00d4aa]/10"
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
        ? "border-[#00d4aa]/50 bg-[#00d4aa]/10" 
        : "border-[#1a3a4a]/50 bg-[#0a1628]/80"
    )}>
      <div className="flex items-center gap-1.5">
        {Icon && <Icon className={cn("h-3 w-3", highlight ? "text-[#00d4aa]" : "text-[#6b8a9a]")} />}
        <span className={cn(
          "text-xs uppercase tracking-wider font-semibold",
          highlight ? "text-[#00d4aa]" : "text-[#6b8a9a]"
        )}>{label}</span>
      </div>
      <div className="font-mono">
        <span className={cn(
          "text-3xl font-black",
          highlight ? "text-[#00d4aa]" : "text-[#e8f4f8]"
        )}>
          {displayValue}
        </span>
        <span className={cn(
          "text-lg font-bold ml-0.5",
          highlight ? "text-[#00d4aa]/70" : "text-[#6b8a9a]"
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
    <div className="flex flex-col h-full p-4">
      {/* Sound & Music toggles */}
      <div className="flex justify-end gap-2 mb-3">
        <button
          onClick={toggleMusic}
          className={cn(
            "h-8 w-8 flex items-center justify-center rounded-lg border transition-all",
            musicEnabled 
              ? "text-[#00d4aa] border-[#00d4aa]/40 bg-[#00d4aa]/10" 
              : "text-[#6b8a9a] border-[#6b8a9a]/20 hover:border-[#00d4aa]/40 hover:text-[#00d4aa]"
          )}
          title={musicEnabled ? "Stop lo-fi music" : "Play lo-fi jazz"}
        >
          {musicEnabled ? <Music className="h-4 w-4" /> : <Music2 className="h-4 w-4" />}
        </button>
        <button
          onClick={toggleSound}
          className={cn(
            "h-8 w-8 flex items-center justify-center rounded-lg border transition-all",
            soundEnabled 
              ? "text-[#00d4aa] border-[#00d4aa]/40 bg-[#00d4aa]/10" 
              : "text-[#6b8a9a] border-[#6b8a9a]/20 hover:border-[#00d4aa]/40 hover:text-[#00d4aa]"
          )}
          title={soundEnabled ? "Mute sounds" : "Enable sounds"}
        >
          {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
        </button>
      </div>

      {/* Premium Slot Cabinet */}
      <div className="slot-cabinet mb-4">
        {/* LOCK SLOT Title */}
        <div className="text-center mb-4">
          <h2 className="slot-title text-xl">LOCK SLOT</h2>
        </div>

        {/* Reel Container with metallic frame */}
        <div className="relative">
          {/* Decorative frame corners */}
          <div className="absolute -inset-2 border border-[#00d4aa]/20 rounded-lg pointer-events-none">
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#00d4aa]/60 rounded-tl" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#00d4aa]/60 rounded-tr" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#00d4aa]/60 rounded-bl" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#00d4aa]/60 rounded-br" />
          </div>

          {/* Slot Reels */}
          <div className="grid grid-cols-3 gap-3 p-2">
            <div className="reel-window">
              <SlotReel 
                isSpinning={reelsSpinning} 
                spinKey={spinCount}
                result={localResult?.tier ?? null}
                reelIndex={0}
                onStopped={handleReelStopped}
              />
            </div>
            <div className="reel-window">
              <SlotReel 
                isSpinning={reelsSpinning} 
                spinKey={spinCount}
                result={localResult?.tier ?? null}
                reelIndex={1}
                onStopped={handleReelStopped}
              />
            </div>
            <div className="reel-window">
              <SlotReel 
                isSpinning={reelsSpinning} 
                spinKey={spinCount}
                result={localResult?.tier ?? null}
                reelIndex={2}
                onStopped={handleReelStopped}
              />
            </div>
          </div>

          {/* Win line indicator */}
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2px] bg-gradient-to-r from-transparent via-[#00d4aa]/50 to-transparent pointer-events-none" />
        </div>

        {/* Lock Duration Badge - shown after spin */}
        {showResult && localResult && (
          <div className="flex justify-center mt-4">
            <div className="lock-badge">
              <span className="duration">{localResult.duration}d</span>
              <span className="label">LOCK</span>
            </div>
          </div>
        )}
      </div>

      {/* Result Display - Cyber themed */}
      {showResult && localResult ? (
        <div className="cyber-panel cyber-corners p-4 mb-4">
          {/* Tier result header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <TierSymbol tier={localResult.tier} size={32} isWinner={isWinner || undefined} />
              <div>
                <div className={cn(
                  "text-lg font-bold uppercase tracking-wide",
                  localResult.tier === "legendary" && "text-[#00d4aa]",
                  localResult.tier === "mythic" && "text-[#a855f7]",
                  localResult.tier === "hot" && "text-[#f0c674]",
                  localResult.tier === "mid" && "text-[#6b8a9a]",
                  localResult.tier === "brick" && "text-[#4a5568]"
                )}>
                  {TIER_CONFIG[localResult.tier].label}
                </div>
                <div className="text-[10px] text-[#6b8a9a] uppercase tracking-wider">Result</div>
              </div>
            </div>
            <div className="text-right">
              <div className={cn(
                "text-2xl font-mono font-bold",
                isWinner ? "text-[#00d4aa]" : "text-[#e8f4f8]"
              )}>
                {localResult.multiplier}×
              </div>
              <div className="text-[10px] text-[#6b8a9a] uppercase tracking-wider">Multiplier</div>
            </div>
          </div>
          
          {/* Bonus eligibility */}
          {isWinner && (
            <div className="pt-3 border-t border-[#00d4aa]/20 text-center">
              <span className="text-xs uppercase tracking-widest text-[#00d4aa] font-bold">
                ✦ Eligible for Epoch Bonus ✦
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="cyber-panel cyber-corners p-4 mb-4">
          <div className="text-center">
            <div className="text-[#6b8a9a] text-sm mb-2">Spin to determine your lock tier</div>
            <div className="flex justify-center gap-4 text-[10px] text-[#4a5568]">
              <span>BRICK • MID • HOT • LEGENDARY • MYTHIC</span>
            </div>
          </div>
        </div>
      )}

      {/* Stake Controls - Cyber themed */}
      <div className="mt-auto space-y-3">
        {/* Balance indicator */}
        <div className="flex items-center justify-between text-xs px-1">
          <span className="text-[#6b8a9a]">Your Balance</span>
          <span className="font-mono font-bold text-[#e8f4f8]">{userBalance.toLocaleString()} tokens</span>
        </div>

        {/* Input with MAX button */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="number"
              placeholder="500"
              value={stakeAmount}
              onChange={(e) => setStakeAmount(e.target.value)}
              className="cyber-input w-full h-11 px-4 pr-16 text-base font-mono font-bold"
              disabled={isSpinning}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#6b8a9a]">
              tokens
            </span>
          </div>
          <button
            onClick={() => handleQuickAmount(userBalance)}
            disabled={isSpinning}
            className="cyber-button h-11 px-4 text-xs"
          >
            MAX
          </button>
        </div>

        {/* Quick amount buttons */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#6b8a9a] uppercase tracking-wider">Quick Amounts</span>
            {!isEditingAmounts ? (
              <button
                onClick={startEditing}
                className="text-[10px] text-[#6b8a9a] hover:text-[#00d4aa] flex items-center gap-1 transition-colors"
              >
                <Settings className="h-3 w-3" />
                Edit
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={saveEditing}
                  className="text-[10px] text-[#00d4aa] flex items-center gap-1"
                >
                  <Check className="h-3 w-3" />
                  Save
                </button>
                <button
                  onClick={cancelEditing}
                  className="text-[10px] text-[#6b8a9a] hover:text-[#ff6b6b]"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
          
          {isEditingAmounts ? (
            <div className="grid grid-cols-4 gap-2">
              {editingAmounts.map((value, index) => (
                <input
                  key={index}
                  type="number"
                  value={value}
                  onChange={(e) => updateEditingAmount(index, e.target.value)}
                  className="cyber-input h-9 text-xs font-mono text-center"
                  placeholder="0"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {quickAmounts.map((amount, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickAmount(amount)}
                  disabled={isSpinning || amount > userBalance}
                  className="quick-amount-btn h-9 font-mono text-xs transition-all disabled:opacity-30"
                >
                  {amount >= 1000 ? `${(amount/1000).toFixed(amount % 1000 === 0 ? 0 : 1)}K` : amount}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Protocol fee preview */}
        {stakeNum > 0 && (
          <div className="flex items-center justify-between text-xs text-[#6b8a9a] px-1">
            <span>5% fee: -{feeAmount.toFixed(0)}</span>
            <span className="text-[#e8f4f8] font-medium">You lock: {(stakeNum - feeAmount).toFixed(0)} tokens</span>
          </div>
        )}

        {/* SPIN Button - Premium styled */}
        <button
          onClick={handleSpin}
          disabled={isButtonDisabled}
          className={cn(
            "spin-button w-full flex items-center justify-center gap-3",
            isButtonDisabled && "opacity-40 cursor-not-allowed"
          )}
        >
          {isSpinning || reelsSpinning ? (
            <>
              <Unlock className="h-5 w-5 animate-pulse" />
              SPINNING...
            </>
          ) : (
            <>
              <Lock className="h-5 w-5" />
              SPIN
            </>
          )}
        </button>
      </div>
    </div>
  )
}
