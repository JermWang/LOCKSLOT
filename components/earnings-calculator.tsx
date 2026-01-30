"use client"

import { useState } from "react"
import { useWallet } from "@/lib/wallet-context"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, Dices, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatTokenAmount } from "@/lib/token-utils"

const STAKE_MARKS = ["100", "1K", "5K", "10K", "50K"]

// Tier data - avgLock in HOURS (matching lib/rng.ts)
const TIER_DATA = [
  { name: "BRICK", probability: 0.45, avgLock: 42, color: "text-yellow-400", bonus: false },      // 36-48h avg
  { name: "MID", probability: 0.28, avgLock: 27, color: "text-orange-400", bonus: false },        // 18-36h avg
  { name: "HOT", probability: 0.15, avgLock: 13, color: "text-red-400", bonus: false },           // 8-18h avg
  { name: "LEGENDARY", probability: 0.09, avgLock: 5.5, color: "text-cyan-400", bonus: true },    // 3-8h avg
  { name: "MYTHIC", probability: 0.03, avgLock: 2, color: "text-pink-400", bonus: true },         // 1-3h avg
]

export function EarningsCalculator() {
  const [stakeSlider, setStakeSlider] = useState([50])
  const { connected, connect, connecting } = useWallet()

  // Calculate stake from slider (100 to 50K)
  const stakeAmount = Math.round(100 * Math.pow(500, stakeSlider[0] / 100))
  const feeAmount = stakeAmount * 0.05
  const feeRate = 5

  // Expected value calculation (negative because it's gambling)
  const expectedLockHours = TIER_DATA.reduce((acc, tier) => acc + tier.probability * tier.avgLock, 0)
  const winProbability = 0.03 // 2.5% + 0.5%

  return (
    <Card className="w-full max-w-lg border-border bg-card/80 backdrop-blur-sm">
      <CardContent className="p-6">
        {/* Header */}
        <div className="mb-6 text-center">
          <h3 className="text-lg font-semibold text-foreground mb-1">Spin Preview</h3>
          <p className="text-xs text-muted-foreground">See what happens when you spin</p>
        </div>

        {/* Stake Amount Slider */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Dices className="h-4 w-4" />
              Stake Amount
            </div>
            <span className="text-primary font-mono font-semibold">
              {formatTokenAmount(stakeAmount)} TOKENS
            </span>
          </div>
          <Slider
            value={stakeSlider}
            onValueChange={setStakeSlider}
            max={100}
            step={1}
            className="mb-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            {STAKE_MARKS.map((mark) => (
              <span key={mark}>{mark}</span>
            ))}
          </div>
        </div>

        {/* Fee Display */}
        <div className="mb-6 rounded-lg border border-border bg-secondary/30 p-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Fee ({feeRate}%)</span>
            <span className="font-mono text-destructive font-semibold">-{formatTokenAmount(feeAmount)} TOKENS</span>
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-sm text-muted-foreground">Principal Locked</span>
            <span className="font-mono text-foreground font-semibold">{formatTokenAmount(stakeAmount - feeAmount)} TOKENS</span>
          </div>
        </div>

        {/* Outcome Probabilities */}
        <div className="mb-6">
          <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Outcome Probabilities</h4>
          <div className="space-y-2">
            {TIER_DATA.map((tier) => (
              <div key={tier.name} className="flex items-center justify-between text-sm">
                <span className={cn("font-medium", tier.color)}>{tier.name}</span>
                <div className="flex items-center gap-4">
                  <span className="font-mono text-muted-foreground">{(tier.probability * 100).toFixed(1)}%</span>
                  <span className="font-mono text-muted-foreground w-16 text-right">~{tier.avgLock}h lock</span>
                  {tier.bonus ? (
                    <span className="text-primary text-xs">+ BONUS</span>
                  ) : (
                    <span className="text-muted-foreground/50 text-xs">no bonus</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-center">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
              Expected Lock
            </div>
            <div className="text-lg font-bold text-destructive font-mono">
              ~{expectedLockHours.toFixed(0)} hours
            </div>
          </div>
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-center">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
              Win Chance
            </div>
            <div className="text-lg font-bold text-primary font-mono">
              {(winProbability * 100).toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Warning */}
        <div className="mb-6 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-muted-foreground">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <p>
            97% of spins result in long locks with no bonus. Your principal is always returned, 
            but you lose the fee and your time.
          </p>
        </div>

        {/* CTA Button */}
        <Button
          onClick={() => !connected && connect()}
          disabled={connecting}
          className={cn(
            "w-full gap-2 font-semibold",
            connected
              ? "bg-primary text-primary-foreground hover:bg-primary/90 glow-primary"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
        >
          {connecting ? "Connecting..." : connected ? "Go to Game Board" : "Connect Wallet to Play"}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  )
}
