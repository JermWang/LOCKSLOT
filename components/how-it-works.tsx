"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { 
  Coins, 
  Dices, 
  Lock, 
  Timer, 
  Trophy, 
  ArrowRight,
  Percent,
  Sparkles,
  AlertTriangle,
  CheckCircle2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { gameSounds } from "@/lib/sounds"

// Unified primary color theme for all steps
const STEPS = [
  {
    id: 1,
    title: "Stake Your Tokens",
    description: "Choose how many tokens to risk. A 5% fee goes to the reward pool.",
    icon: Coins,
    visual: "stake",
    highlight: "Your principal is always returned after the lock expires.",
  },
  {
    id: 2,
    title: "Spin the Reels",
    description: "Provably-fair RNG determines your fate. The outcome is immutable.",
    icon: Dices,
    visual: "spin",
    highlight: "hash(serverSeed || clientSeed || nonce) → outcome",
  },
  {
    id: 3,
    title: "Get Locked",
    description: "Your tokens are locked for 1-21 days based on your tier.",
    icon: Lock,
    visual: "lock",
    highlight: "Short locks are rare wins. Long locks are common losses.",
  },
  {
    id: 4,
    title: "Wait It Out",
    description: "Your principal sits locked. No early exit without penalty.",
    icon: Timer,
    visual: "wait",
    highlight: "Time is the cost. Patience is required.",
  },
  {
    id: 5,
    title: "Collect (Maybe)",
    description: "Legendary (9%) and Mythic (3%) tiers win bonus payouts.",
    icon: Trophy,
    visual: "collect",
    highlight: "88% of players get nothing but their principal back.",
  },
]

// Tier visuals - losers muted, winners get distinct colors (durations in HOURS)
const TIERS_VISUAL = [
  { name: "BRICK", prob: 45, duration: "36-48h", isWin: false, color: "bg-muted-foreground/50", text: "text-muted-foreground" },
  { name: "MID", prob: 28, duration: "18-36h", isWin: false, color: "bg-muted-foreground/50", text: "text-muted-foreground" },
  { name: "HOT", prob: 15, duration: "8-18h", isWin: false, color: "bg-muted-foreground/50", text: "text-muted-foreground" },
  { name: "LEGENDARY", prob: 9, duration: "3-8h", isWin: true, color: "bg-emerald-400", text: "text-emerald-400" },
  { name: "MYTHIC", prob: 3, duration: "1-3h", isWin: true, color: "bg-pink-400", text: "text-pink-400" },
]

function StakeVisual() {
  return (
    <div className="flex items-center justify-center gap-4">
      <motion.div 
        className="flex flex-col items-center"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="text-3xl font-black font-mono text-foreground">1,000</div>
        <div className="text-xs text-muted-foreground">YOUR STAKE</div>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 }}
      >
        <ArrowRight className="h-6 w-6 text-muted-foreground" />
      </motion.div>
      
      <motion.div 
        className="flex flex-col items-center gap-2"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.6 }}
      >
        <div className="flex gap-2">
          <div className="rounded-lg bg-destructive/20 border border-destructive/30 px-3 py-2 text-center">
            <div className="text-lg font-bold font-mono text-destructive">-50</div>
            <div className="text-[10px] text-muted-foreground">FEE (5%)</div>
          </div>
          <div className="rounded-lg bg-primary/20 border border-primary/30 px-3 py-2 text-center">
            <div className="text-lg font-bold font-mono text-primary">+50</div>
            <div className="text-[10px] text-muted-foreground">TO POOL</div>
          </div>
        </div>
        <div className="rounded-lg bg-secondary/50 border border-border px-3 py-2 text-center">
          <div className="text-lg font-bold font-mono text-foreground">950</div>
          <div className="text-[10px] text-muted-foreground">LOCKED</div>
        </div>
      </motion.div>
    </div>
  )
}

function SpinVisual() {
  const [spinning, setSpinning] = useState(true)
  const [result, setResult] = useState(0)
  
  useEffect(() => {
    const spinInterval = setInterval(() => {
      setResult(prev => (prev + 1) % 5)
    }, 150)
    
    const stopTimeout = setTimeout(() => {
      clearInterval(spinInterval)
      setSpinning(false)
      setResult(0) // BRICK most common
    }, 2000)
    
    return () => {
      clearInterval(spinInterval)
      clearTimeout(stopTimeout)
    }
  }, [])
  
  const tier = TIERS_VISUAL[result]
  
  return (
    <div className="flex items-center justify-center">
      <motion.div 
        className="grid grid-cols-3 gap-2"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className={cn(
              "w-20 h-16 rounded-lg border-2 flex items-center justify-center font-bold font-mono text-sm",
              spinning 
                ? "border-primary/50 bg-secondary/50" 
                : tier.isWin 
                  ? cn("border-2", tier.color.replace("bg-", "border-"), tier.color.replace("400", "400/20"))
                  : "border-border bg-secondary/50"
            )}
            animate={spinning ? { y: [0, -5, 0] } : {}}
            transition={{ duration: 0.15, repeat: spinning ? Infinity : 0, delay: i * 0.05 }}
          >
            <span className={cn(
              spinning ? "text-muted-foreground" : tier.text
            )}>
              {tier.name}
            </span>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}

function LockVisual() {
  return (
    <div className="space-y-2">
      {TIERS_VISUAL.map((tier, i) => (
        <motion.div
          key={tier.name}
          className="flex items-center gap-3"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1 }}
        >
          <div className={cn("w-3 h-3 rounded-sm", tier.color)} />
          <span className={cn("w-24 text-xs font-bold", tier.text)}>{tier.name}</span>
          <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
            <motion.div 
              className={cn("h-full rounded-full", tier.color)}
              initial={{ width: 0 }}
              animate={{ width: `${tier.prob}%` }}
              transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
            />
          </div>
          <span className="w-12 text-right text-xs font-mono text-muted-foreground">{tier.prob}%</span>
          <span className="w-14 text-right text-xs font-mono text-muted-foreground">{tier.duration}</span>
          {tier.isWin && <Sparkles className={cn("h-3 w-3", tier.text)} />}
        </motion.div>
      ))}
    </div>
  )
}

function WaitVisual() {
  const [progress, setProgress] = useState(0)
  
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => (prev >= 100 ? 0 : prev + 2))
    }, 100)
    return () => clearInterval(interval)
  }, [])
  
  return (
    <div className="flex flex-col items-center gap-4">
      <motion.div 
        className="relative w-32 h-32"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="64"
            cy="64"
            r="56"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-secondary"
          />
          <motion.circle
            cx="64"
            cy="64"
            r="56"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            className="text-primary"
            strokeDasharray={352}
            strokeDashoffset={352 - (352 * progress) / 100}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Lock className="h-6 w-6 text-muted-foreground mb-1" />
          <span className="text-xl font-bold font-mono">{Math.round(progress)}%</span>
        </div>
      </motion.div>
      <div className="text-center">
        <div className="text-sm font-mono text-muted-foreground">14d 6h 32m remaining</div>
      </div>
    </div>
  )
}

function CollectVisual() {
  return (
    <div className="flex items-center justify-center gap-6">
      <motion.div 
        className="flex flex-col items-center p-4 rounded-xl border-2 border-border bg-secondary/30"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <AlertTriangle className="h-8 w-8 text-muted-foreground mb-2" />
        <div className="text-2xl font-black text-muted-foreground">88%</div>
        <div className="text-xs text-muted-foreground text-center">Get principal back<br/>No bonus</div>
      </motion.div>
      
      <motion.div 
        className="flex flex-col items-center p-4 rounded-xl border-2 border-primary bg-primary/10 glow-pulse"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Trophy className="h-8 w-8 text-primary mb-2" />
        <div className="text-2xl font-black text-primary">12%</div>
        <div className="text-xs text-muted-foreground text-center">Get principal back<br/>+ Bonus payout</div>
      </motion.div>
    </div>
  )
}

function StepVisual({ visual }: { visual: string }) {
  switch (visual) {
    case "stake": return <StakeVisual />
    case "spin": return <SpinVisual />
    case "lock": return <LockVisual />
    case "wait": return <WaitVisual />
    case "collect": return <CollectVisual />
    default: return null
  }
}

interface HowItWorksProps {
  onComplete?: () => void
}

export function HowItWorks({ onComplete }: HowItWorksProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [autoPlay, setAutoPlay] = useState(true)
  
  useEffect(() => {
    if (!autoPlay) return
    
    const timer = setTimeout(() => {
      if (currentStep < STEPS.length - 1) {
        setCurrentStep(prev => prev + 1)
      } else {
        setAutoPlay(false)
      }
    }, 4000)
    
    return () => clearTimeout(timer)
  }, [currentStep, autoPlay])
  
  const step = STEPS[currentStep]
  const Icon = step.icon
  
  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2 mb-6">
        {STEPS.map((s, i) => (
          <button
            key={s.id}
            onClick={() => { setCurrentStep(i); setAutoPlay(false) }}
            className={cn(
              "w-2 h-2 rounded-full transition-all duration-300",
              i === currentStep 
                ? "w-8 bg-primary" 
                : i < currentStep 
                  ? "bg-primary/50" 
                  : "bg-secondary"
            )}
          />
        ))}
      </div>
      
      {/* Step counter */}
      <div className="text-center mb-4">
        <span className="text-xs font-mono text-muted-foreground">
          STEP {currentStep + 1} OF {STEPS.length}
        </span>
      </div>
      
      {/* Main card with glow border */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="glow-border-intense p-6"
        >
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-primary/20 border border-primary/30">
              <Icon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-black text-primary">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </div>
          </div>
          
          {/* Visual */}
          <div className="my-6 p-4 rounded-xl bg-background/50 border border-primary/20 min-h-[160px] flex items-center justify-center">
            <StepVisual visual={step.visual} />
          </div>
          
          {/* Highlight */}
          <div className="rounded-lg border border-primary/30 px-4 py-3 text-center bg-primary/5">
            <p className="text-sm font-mono text-primary">{step.highlight}</p>
          </div>
        </motion.div>
      </AnimatePresence>
      
      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => { gameSounds.click(); setCurrentStep(prev => Math.max(0, prev - 1)); setAutoPlay(false) }}
          disabled={currentStep === 0}
          className="text-muted-foreground"
        >
          Previous
        </Button>
        
        {currentStep < STEPS.length - 1 && (
          <button
            onClick={() => { gameSounds.click(); onComplete?.() }}
            className="btn-premium text-sm"
          >
            Skip Tutorial
          </button>
        )}
        
        {currentStep === STEPS.length - 1 ? (
          <Button
            onClick={() => { gameSounds.success(); onComplete?.() }}
            className="gap-2 glow-primary"
          >
            <CheckCircle2 className="h-4 w-4" />
            Got It - Let Me Play
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { gameSounds.click(); setCurrentStep(prev => prev + 1); setAutoPlay(false) }}
            className="text-muted-foreground"
          >
            Next
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  )
}
