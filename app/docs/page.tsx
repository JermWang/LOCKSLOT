"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TIER_CONFIG } from "@/lib/game-types"
import { cn } from "@/lib/utils"
import Image from "next/image"
import Link from "next/link"
import { 
  Dices, 
  Lock, 
  Unlock, 
  Trophy, 
  Shield, 
  Clock, 
  Coins, 
  TrendingUp, 
  Users, 
  Zap,
  Target,
  Gift,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Sparkles,
  Scale,
  Eye,
  Hash,
  RefreshCw,
  CircleDollarSign,
  Percent,
  Timer,
  Star,
  Flame,
  Gem,
  Crown
} from "lucide-react"
import { motion } from "framer-motion"

const tierColors: Record<string, string> = {
  brick: "text-yellow-400",
  mid: "text-orange-400",
  hot: "text-red-400",
  legendary: "text-cyan-400",
  mythic: "text-pink-400",
}

const tierBgColors: Record<string, string> = {
  brick: "bg-yellow-400/20 border-yellow-400/40",
  mid: "bg-orange-400/20 border-orange-400/40",
  hot: "bg-red-400/20 border-red-400/40",
  legendary: "bg-cyan-400/20 border-cyan-400/40",
  mythic: "bg-pink-400/20 border-pink-400/40",
}

const tierIcons: Record<string, React.ReactNode> = {
  brick: <Lock className="h-5 w-5" />,
  mid: <Clock className="h-5 w-5" />,
  hot: <Flame className="h-5 w-5" />,
  legendary: <Star className="h-5 w-5" />,
  mythic: <Crown className="h-5 w-5" />,
}

export default function DocsPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Hero Section */}
      <div className="mb-12 text-center">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-[#00d4aa]/20 blur-3xl rounded-full" />
            <Image src="/logo.png" alt="Lock Slot" width={100} height={100} className="relative rounded-2xl" />
          </div>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-[#00d4aa] via-[#00b4d8] to-pink-400 bg-clip-text text-transparent">
          LOCK SLOT Documentation
        </h1>
        <p className="text-lg text-[#6b8a9a] max-w-2xl mx-auto">
          The first provably-fair, pari-mutuel slot machine on Solana. 
          Your principal is always protected. Only time is at stake.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        <div className="cyber-panel p-4 text-center">
          <Shield className="h-8 w-8 text-[#00d4aa] mx-auto mb-2" />
          <div className="text-2xl font-bold text-[#e8f4f8]">100%</div>
          <div className="text-xs text-[#6b8a9a]">Principal Protected</div>
        </div>
        <div className="cyber-panel p-4 text-center">
          <Clock className="h-8 w-8 text-[#00b4d8] mx-auto mb-2" />
          <div className="text-2xl font-bold text-[#e8f4f8]">1-48h</div>
          <div className="text-xs text-[#6b8a9a]">Lock Duration</div>
        </div>
        <div className="cyber-panel p-4 text-center">
          <Trophy className="h-8 w-8 text-[#f0c674] mx-auto mb-2" />
          <div className="text-2xl font-bold text-[#e8f4f8]">12%</div>
          <div className="text-xs text-[#6b8a9a]">Win Rate</div>
        </div>
        <div className="cyber-panel p-4 text-center">
          <Zap className="h-8 w-8 text-pink-400 mx-auto mb-2" />
          <div className="text-2xl font-bold text-[#e8f4f8]">10x</div>
          <div className="text-xs text-[#6b8a9a]">Max Multiplier</div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-8">
        <TabsList className="grid w-full grid-cols-4 bg-[#0a1628] border border-[#1a3a4a]/50 p-1 rounded-xl">
          <TabsTrigger value="overview" className="data-[state=active]:bg-[#00d4aa]/20 data-[state=active]:text-[#00d4aa] rounded-lg">
            <Dices className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="tiers" className="data-[state=active]:bg-[#00d4aa]/20 data-[state=active]:text-[#00d4aa] rounded-lg">
            <Target className="h-4 w-4 mr-2" />
            Tiers
          </TabsTrigger>
          <TabsTrigger value="rewards" className="data-[state=active]:bg-[#00d4aa]/20 data-[state=active]:text-[#00d4aa] rounded-lg">
            <Gift className="h-4 w-4 mr-2" />
            Rewards
          </TabsTrigger>
          <TabsTrigger value="fairness" className="data-[state=active]:bg-[#00d4aa]/20 data-[state=active]:text-[#00d4aa] rounded-lg">
            <Shield className="h-4 w-4 mr-2" />
            Fairness
          </TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-8">
          {/* What is Lock Slot */}
          <div className="cyber-panel p-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 rounded-xl bg-[#00d4aa]/20 border border-[#00d4aa]/30">
                <Dices className="h-8 w-8 text-[#00d4aa]" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-[#e8f4f8] mb-2">What is LOCK SLOT?</h2>
                <p className="text-[#6b8a9a]">
                  A provably-fair gambling game where you spin to determine how long your tokens are locked.
                </p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="p-4 rounded-xl bg-[#00d4aa]/10 border border-[#00d4aa]/20">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-5 w-5 text-[#00d4aa]" />
                  <span className="font-semibold text-[#00d4aa]">What It IS</span>
                </div>
                <ul className="space-y-2 text-sm text-[#e8f4f8]">
                  <li className="flex items-center gap-2">
                    <ArrowRight className="h-3 w-3 text-[#00d4aa]" />
                    A gambling game with time-based stakes
                  </li>
                  <li className="flex items-center gap-2">
                    <ArrowRight className="h-3 w-3 text-[#00d4aa]" />
                    Pari-mutuel: losers fund winners
                  </li>
                  <li className="flex items-center gap-2">
                    <ArrowRight className="h-3 w-3 text-[#00d4aa]" />
                    Principal always returned on unlock
                  </li>
                  <li className="flex items-center gap-2">
                    <ArrowRight className="h-3 w-3 text-[#00d4aa]" />
                    Verifiably fair outcomes
                  </li>
                </ul>
              </div>
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="h-5 w-5 text-red-400" />
                  <span className="font-semibold text-red-400">What It is NOT</span>
                </div>
                <ul className="space-y-2 text-sm text-[#e8f4f8]">
                  <li className="flex items-center gap-2">
                    <ArrowRight className="h-3 w-3 text-red-400" />
                    Not a staking protocol
                  </li>
                  <li className="flex items-center gap-2">
                    <ArrowRight className="h-3 w-3 text-red-400" />
                    Not a yield farm or APY system
                  </li>
                  <li className="flex items-center gap-2">
                    <ArrowRight className="h-3 w-3 text-red-400" />
                    Not an investment vehicle
                  </li>
                  <li className="flex items-center gap-2">
                    <ArrowRight className="h-3 w-3 text-red-400" />
                    Not guaranteed profits
                  </li>
                </ul>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#f0c674]/10 border border-[#f0c674]/30">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-[#f0c674]" />
                <span className="font-semibold text-[#f0c674]">Key Understanding</span>
              </div>
              <p className="text-sm text-[#e8f4f8]">
                <strong>Short locks = Wins.</strong> Getting a 1-3 hour lock (Mythic) is extremely rare but lucrative.
                <strong> Long locks = Losses.</strong> Getting a 36-48 hour lock (Brick) is common and means your tokens are stuck with no bonus.
              </p>
            </div>
          </div>

          {/* How It Works - Visual Flow */}
          <div className="cyber-panel p-6">
            <h2 className="text-2xl font-bold text-[#e8f4f8] mb-6 flex items-center gap-3">
              <RefreshCw className="h-6 w-6 text-[#00d4aa]" />
              How It Works
            </h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              {/* Step 1 */}
              <div className="relative">
                <div className="absolute -top-3 -left-3 w-10 h-10 rounded-full bg-[#00d4aa] flex items-center justify-center text-[#0a1628] font-bold text-lg">
                  1
                </div>
                <div className="p-6 rounded-xl bg-gradient-to-br from-[#00d4aa]/20 to-transparent border border-[#00d4aa]/30 h-full">
                  <Dices className="h-12 w-12 text-[#00d4aa] mb-4" />
                  <h3 className="text-lg font-bold text-[#e8f4f8] mb-2">SPIN</h3>
                  <p className="text-sm text-[#6b8a9a]">
                    Choose your stake amount and spin the slot machine. The outcome is determined by verifiable randomness.
                  </p>
                  <div className="mt-4 p-2 rounded-lg bg-[#0a1628] border border-[#1a3a4a]/50">
                    <div className="text-xs text-[#6b8a9a]">You choose:</div>
                    <div className="text-sm font-mono text-[#00d4aa]">Stake Amount</div>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative">
                <div className="absolute -top-3 -left-3 w-10 h-10 rounded-full bg-[#00b4d8] flex items-center justify-center text-[#0a1628] font-bold text-lg">
                  2
                </div>
                <div className="p-6 rounded-xl bg-gradient-to-br from-[#00b4d8]/20 to-transparent border border-[#00b4d8]/30 h-full">
                  <Lock className="h-12 w-12 text-[#00b4d8] mb-4" />
                  <h3 className="text-lg font-bold text-[#e8f4f8] mb-2">LOCK</h3>
                  <p className="text-sm text-[#6b8a9a]">
                    Your tokens are locked for the determined duration. You cannot access them until the timer expires.
                  </p>
                  <div className="mt-4 p-2 rounded-lg bg-[#0a1628] border border-[#1a3a4a]/50">
                    <div className="text-xs text-[#6b8a9a]">RNG determines:</div>
                    <div className="text-sm font-mono text-[#00b4d8]">Tier • Duration • Multiplier</div>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative">
                <div className="absolute -top-3 -left-3 w-10 h-10 rounded-full bg-pink-400 flex items-center justify-center text-[#0a1628] font-bold text-lg">
                  3
                </div>
                <div className="p-6 rounded-xl bg-gradient-to-br from-pink-400/20 to-transparent border border-pink-400/30 h-full">
                  <Unlock className="h-12 w-12 text-pink-400 mb-4" />
                  <h3 className="text-lg font-bold text-[#e8f4f8] mb-2">UNLOCK</h3>
                  <p className="text-sm text-[#6b8a9a]">
                    When the lock expires, your principal is returned. Winners (Legendary/Mythic) also receive bonus payouts.
                  </p>
                  <div className="mt-4 p-2 rounded-lg bg-[#0a1628] border border-[#1a3a4a]/50">
                    <div className="text-xs text-[#6b8a9a]">You receive:</div>
                    <div className="text-sm font-mono text-pink-400">Principal + Bonus (if winner)</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Reward Pool Fee Structure */}
          <div className="cyber-panel p-6">
            <h2 className="text-2xl font-bold text-[#e8f4f8] mb-6 flex items-center gap-3">
              <Percent className="h-6 w-6 text-[#00d4aa]" />
              Reward Pool Fee Structure
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-4 rounded-xl bg-[#1a3a4a]/30 border border-[#1a3a4a]/50">
                <div className="flex items-center gap-3 mb-3">
                  <CircleDollarSign className="h-6 w-6 text-[#00d4aa]" />
                  <span className="font-semibold text-[#e8f4f8]">5% Reward Pool Fee</span>
                </div>
                <p className="text-sm text-[#6b8a9a]">
                  A 5% reward pool fee is taken from each spin and added to the reward pool. This funds winner bonuses.
                </p>
                <div className="mt-3 p-2 rounded-lg bg-[#00d4aa]/10 border border-[#00d4aa]/30">
                  <div className="text-xs font-semibold text-[#00d4aa]">🎯 NOT A HOUSE FEE — REWARD POOL FEE</div>
                  <div className="text-xs text-[#6b8a9a]">100% of this reward pool fee goes to Legendary & Mythic winners!</div>
                </div>
                <div className="mt-2 p-2 rounded-lg bg-[#0a1628]">
                  <div className="text-xs text-[#6b8a9a]">Example: 1000 token stake</div>
                  <div className="text-sm font-mono text-[#00d4aa]">50 tokens → Reward Pool → Winners</div>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-[#1a3a4a]/30 border border-[#1a3a4a]/50">
                <div className="flex items-center gap-3 mb-3">
                  <AlertTriangle className="h-6 w-6 text-[#f0c674]" />
                  <span className="font-semibold text-[#e8f4f8]">Early Exit Penalty</span>
                </div>
                <p className="text-sm text-[#6b8a9a]">
                  If you emergency unlock early, you lose a portion of your principal. This penalty also goes to the reward pool.
                </p>
                <div className="mt-3 p-2 rounded-lg bg-[#0a1628]">
                  <div className="text-xs text-[#6b8a9a]">Penalty amount varies by:</div>
                  <div className="text-sm font-mono text-[#f0c674]">Time Remaining • Tier</div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* TIERS TAB */}
        <TabsContent value="tiers" className="space-y-8">
          {/* Tier Overview */}
          <div className="cyber-panel p-6">
            <h2 className="text-2xl font-bold text-[#e8f4f8] mb-2 flex items-center gap-3">
              <Target className="h-6 w-6 text-[#00d4aa]" />
              Understanding Tiers
            </h2>
            <p className="text-[#6b8a9a] mb-6">
              Each spin results in one of 5 tiers. Your tier determines your lock duration, multiplier, and bonus eligibility.
            </p>

            {/* Visual Tier Cards */}
            <div className="space-y-4">
              {/* BRICK */}
              <div className={cn("p-4 rounded-xl border", tierBgColors.brick)}>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-yellow-400/30">
                      <Lock className="h-8 w-8 text-yellow-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-yellow-400">BRICK</h3>
                      <p className="text-sm text-[#6b8a9a]">The most common outcome - long lock, no bonus</p>
                    </div>
                  </div>
                  <div className="flex gap-6 text-center">
                    <div>
                      <div className="text-2xl font-bold font-mono text-yellow-400">45%</div>
                      <div className="text-xs text-[#6b8a9a]">Probability</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold font-mono text-yellow-400">36-48h</div>
                      <div className="text-xs text-[#6b8a9a]">Lock Duration</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold font-mono text-yellow-400">1.2-2.0x</div>
                      <div className="text-xs text-[#6b8a9a]">Multiplier</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold font-mono text-red-400">✗</div>
                      <div className="text-xs text-[#6b8a9a]">Bonus</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* MID */}
              <div className={cn("p-4 rounded-xl border", tierBgColors.mid)}>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-orange-400/30">
                      <Clock className="h-8 w-8 text-orange-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-orange-400">MID</h3>
                      <p className="text-sm text-[#6b8a9a]">Below average - moderate lock, no bonus</p>
                    </div>
                  </div>
                  <div className="flex gap-6 text-center">
                    <div>
                      <div className="text-2xl font-bold font-mono text-orange-400">28%</div>
                      <div className="text-xs text-[#6b8a9a]">Probability</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold font-mono text-orange-400">18-36h</div>
                      <div className="text-xs text-[#6b8a9a]">Lock Duration</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold font-mono text-orange-400">1.8-3.5x</div>
                      <div className="text-xs text-[#6b8a9a]">Multiplier</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold font-mono text-red-400">✗</div>
                      <div className="text-xs text-[#6b8a9a]">Bonus</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* HOT */}
              <div className={cn("p-4 rounded-xl border", tierBgColors.hot)}>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-red-400/30">
                      <Flame className="h-8 w-8 text-red-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-red-400">HOT</h3>
                      <p className="text-sm text-[#6b8a9a]">Decent outcome - shorter lock but still no bonus</p>
                    </div>
                  </div>
                  <div className="flex gap-6 text-center">
                    <div>
                      <div className="text-2xl font-bold font-mono text-red-400">15%</div>
                      <div className="text-xs text-[#6b8a9a]">Probability</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold font-mono text-red-400">8-18h</div>
                      <div className="text-xs text-[#6b8a9a]">Lock Duration</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold font-mono text-red-400">3.0-7.0x</div>
                      <div className="text-xs text-[#6b8a9a]">Multiplier</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold font-mono text-red-400">✗</div>
                      <div className="text-xs text-[#6b8a9a]">Bonus</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* LEGENDARY */}
              <div className={cn("p-4 rounded-xl border relative overflow-hidden", tierBgColors.legendary)}>
                <div className="absolute top-2 right-2">
                  <Badge className="bg-cyan-400 text-[#0a1628] font-bold">WINNER</Badge>
                </div>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-cyan-400/30">
                      <Star className="h-8 w-8 text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-cyan-400">LEGENDARY</h3>
                      <p className="text-sm text-[#6b8a9a]">Great outcome - short lock with bonus payout!</p>
                    </div>
                  </div>
                  <div className="flex gap-6 text-center">
                    <div>
                      <div className="text-2xl font-bold font-mono text-cyan-400">9%</div>
                      <div className="text-xs text-[#6b8a9a]">Probability</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold font-mono text-cyan-400">3-8h</div>
                      <div className="text-xs text-[#6b8a9a]">Lock Duration</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold font-mono text-cyan-400">5.0-8.0x</div>
                      <div className="text-xs text-[#6b8a9a]">Multiplier</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold font-mono text-cyan-400">✓</div>
                      <div className="text-xs text-[#6b8a9a]">Bonus</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* MYTHIC */}
              <div className={cn("p-4 rounded-xl border relative overflow-hidden", tierBgColors.mythic)}>
                <div className="absolute top-2 right-2">
                  <Badge className="bg-pink-400 text-white font-bold">JACKPOT</Badge>
                </div>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-pink-400/30">
                      <Crown className="h-8 w-8 text-pink-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-pink-400">MYTHIC</h3>
                      <p className="text-sm text-[#6b8a9a]">The dream - shortest lock with highest multiplier!</p>
                    </div>
                  </div>
                  <div className="flex gap-6 text-center">
                    <div>
                      <div className="text-2xl font-bold font-mono text-pink-400">3%</div>
                      <div className="text-xs text-[#6b8a9a]">Probability</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold font-mono text-pink-400">1-3h</div>
                      <div className="text-xs text-[#6b8a9a]">Lock Duration</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold font-mono text-pink-400">8.0-15x</div>
                      <div className="text-xs text-[#6b8a9a]">Multiplier</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold font-mono text-pink-400">✓</div>
                      <div className="text-xs text-[#6b8a9a]">Bonus</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Win vs Loss Breakdown */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="cyber-panel p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-red-500/20">
                  <XCircle className="h-6 w-6 text-red-400" />
                </div>
                <h3 className="text-lg font-bold text-[#e8f4f8]">Losing Tiers (88%)</h3>
              </div>
              <p className="text-sm text-[#6b8a9a] mb-4">
                Brick, Mid, and Hot are all &quot;losses&quot; - you get your principal back but receive no bonus from the reward pool.
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 rounded-lg bg-yellow-400/10">
                  <span className="text-yellow-400 font-semibold">BRICK</span>
                  <span className="font-mono text-[#6b8a9a]">45% chance</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-orange-400/10">
                  <span className="text-orange-400 font-semibold">MID</span>
                  <span className="font-mono text-[#6b8a9a]">28% chance</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-red-400/10">
                  <span className="text-red-400 font-semibold">HOT</span>
                  <span className="font-mono text-[#6b8a9a]">15% chance</span>
                </div>
              </div>
            </div>

            <div className="cyber-panel p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-cyan-400/20">
                  <CheckCircle2 className="h-6 w-6 text-cyan-400" />
                </div>
                <h3 className="text-lg font-bold text-[#e8f4f8]">Winning Tiers (12%)</h3>
              </div>
              <p className="text-sm text-[#6b8a9a] mb-4">
                Only Legendary and Mythic are &quot;wins&quot; - you get your principal PLUS a share of the reward pool!
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 rounded-lg bg-cyan-400/10">
                  <span className="text-cyan-400 font-semibold">LEGENDARY</span>
                  <span className="font-mono text-[#6b8a9a]">9% chance</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-pink-400/10">
                  <span className="text-pink-400 font-semibold">MYTHIC</span>
                  <span className="font-mono text-[#6b8a9a]">3% chance</span>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* REWARDS TAB */}
        <TabsContent value="rewards" className="space-y-8">
          {/* Pari-Mutuel Explanation */}
          <div className="cyber-panel p-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 rounded-xl bg-[#00d4aa]/20 border border-[#00d4aa]/30">
                <Scale className="h-8 w-8 text-[#00d4aa]" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-[#e8f4f8] mb-2">Pari-Mutuel System</h2>
                <p className="text-[#6b8a9a]">
                  The system never pays out more than it collects. Losers fund winners. It&apos;s that simple.
                </p>
              </div>
            </div>

            {/* Visual Flow */}
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-xl bg-[#1a3a4a]/30 border border-[#1a3a4a]/50 text-center">
                <Users className="h-10 w-10 text-[#6b8a9a] mx-auto mb-3" />
                <h4 className="font-semibold text-[#e8f4f8] mb-1">Players Spin</h4>
                <p className="text-xs text-[#6b8a9a]">Each spin pays a 5% reward pool fee</p>
              </div>
              <div className="p-4 rounded-xl bg-[#00d4aa]/10 border border-[#00d4aa]/30 text-center">
                <Coins className="h-10 w-10 text-[#00d4aa] mx-auto mb-3" />
                <h4 className="font-semibold text-[#e8f4f8] mb-1">Pool Grows</h4>
                <p className="text-xs text-[#6b8a9a]">Reward pool fees accumulate in the reward pool</p>
              </div>
              <div className="p-4 rounded-xl bg-pink-400/10 border border-pink-400/30 text-center">
                <Trophy className="h-10 w-10 text-pink-400 mx-auto mb-3" />
                <h4 className="font-semibold text-[#e8f4f8] mb-1">Winners Paid</h4>
                <p className="text-xs text-[#6b8a9a]">Legendary/Mythic split the pool</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#0a1628] border border-[#1a3a4a]/50">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-5 w-5 text-[#00d4aa]" />
                <span className="font-semibold text-[#e8f4f8]">Key Insight</span>
              </div>
              <p className="text-sm text-[#6b8a9a]">
                Because most players (88%) land on losing tiers, the reward pool constantly grows. 
                When you hit Legendary or Mythic, you&apos;re claiming a share of everyone else&apos;s reward pool fees!
              </p>
            </div>
          </div>

          {/* Reward Pool Mechanics */}
          <div className="cyber-panel p-6">
            <h2 className="text-2xl font-bold text-[#e8f4f8] mb-6 flex items-center gap-3">
              <Coins className="h-6 w-6 text-[#00d4aa]" />
              Reward Pool Mechanics
            </h2>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="p-4 rounded-xl bg-[#00d4aa]/10 border border-[#00d4aa]/30">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-5 w-5 text-[#00d4aa]" />
                  <span className="font-semibold text-[#00d4aa]">Pool Grows From</span>
                </div>
                <ul className="space-y-2 text-sm text-[#e8f4f8]">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#00d4aa]" />
                    5% reward pool fee on every spin
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#00d4aa]" />
                    Early exit penalties
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#00d4aa]" />
                    Unclaimed rewards (rare)
                  </li>
                </ul>
              </div>
              <div className="p-4 rounded-xl bg-pink-400/10 border border-pink-400/30">
                <div className="flex items-center gap-2 mb-3">
                  <Gift className="h-5 w-5 text-pink-400" />
                  <span className="font-semibold text-pink-400">Pool Pays Out To</span>
                </div>
                <ul className="space-y-2 text-sm text-[#e8f4f8]">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-cyan-400" />
                    Legendary tier winners (9%)
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-pink-400" />
                    Mythic tier winners (3%)
                  </li>
                  <li className="flex items-center gap-2 text-[#6b8a9a]">
                    <div className="w-2 h-2 rounded-full bg-[#6b8a9a]" />
                    No one else receives bonus
                  </li>
                </ul>
              </div>
            </div>

            {/* Formula */}
            <div className="p-4 rounded-xl bg-[#0a1628] border border-[#1a3a4a]/50">
              <h4 className="font-semibold text-[#e8f4f8] mb-3 flex items-center gap-2">
                <Hash className="h-4 w-4 text-[#00d4aa]" />
                Bonus Calculation
              </h4>
              <div className="p-3 rounded-lg bg-[#1a3a4a]/30 mb-3">
                <code className="text-[#00d4aa] font-mono text-sm">
                  Your Bonus = Pool × (Your Score ÷ Total Winner Scores)
                </code>
              </div>
              <div className="p-3 rounded-lg bg-[#1a3a4a]/30">
                <code className="text-[#6b8a9a] font-mono text-sm">
                  Score = Stake × Multiplier
                </code>
              </div>
              <p className="text-xs text-[#6b8a9a] mt-3">
                Higher stakes and higher multipliers mean a larger share of the pool when you win.
              </p>
            </div>
          </div>

          {/* Core Guarantees */}
          <div className="cyber-panel p-6">
            <h2 className="text-2xl font-bold text-[#e8f4f8] mb-6 flex items-center gap-3">
              <Shield className="h-6 w-6 text-[#00d4aa]" />
              Core Guarantees
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-[#00d4aa]/10 border border-[#00d4aa]/20 flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-[#00d4aa] mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-[#e8f4f8]">Principal Protected</h4>
                  <p className="text-xs text-[#6b8a9a]">Your original stake is always returned when the lock expires</p>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-[#00d4aa]/10 border border-[#00d4aa]/20 flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-[#00d4aa] mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-[#e8f4f8]">No House Edge on Principal</h4>
                  <p className="text-xs text-[#6b8a9a]">Principal is never used to pay winners or fund operations</p>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-[#00d4aa]/10 border border-[#00d4aa]/20 flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-[#00d4aa] mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-[#e8f4f8]">Transparent Pool</h4>
                  <p className="text-xs text-[#6b8a9a]">Reward pool balance is always visible and verifiable on-chain</p>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-[#00d4aa]/10 border border-[#00d4aa]/20 flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-[#00d4aa] mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-[#e8f4f8]">No Rug Risk</h4>
                  <p className="text-xs text-[#6b8a9a]">Pool can only decrease through legitimate winner payouts</p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* FAIRNESS TAB */}
        <TabsContent value="fairness" className="space-y-8">
          {/* Provably Fair Overview */}
          <div className="cyber-panel p-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 rounded-xl bg-[#00d4aa]/20 border border-[#00d4aa]/30">
                <Shield className="h-8 w-8 text-[#00d4aa]" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-[#e8f4f8] mb-2">Provably Fair System</h2>
                <p className="text-[#6b8a9a]">
                  Every spin outcome can be independently verified. The house cannot cheat.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#00d4aa]/10 border border-[#00d4aa]/20 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="h-5 w-5 text-[#00d4aa]" />
                <span className="font-semibold text-[#00d4aa]">What &quot;Provably Fair&quot; Means</span>
              </div>
              <p className="text-sm text-[#e8f4f8]">
                You can mathematically verify that your spin result was determined fairly and wasn&apos;t manipulated. 
                This is done using a commit-reveal cryptographic scheme.
              </p>
            </div>
          </div>

          {/* How It Works */}
          <div className="cyber-panel p-6">
            <h2 className="text-2xl font-bold text-[#e8f4f8] mb-6 flex items-center gap-3">
              <RefreshCw className="h-6 w-6 text-[#00d4aa]" />
              How Verification Works
            </h2>

            <div className="space-y-4">
              {/* Step 1 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#00d4aa] flex items-center justify-center text-[#0a1628] font-bold">
                  1
                </div>
                <div className="flex-1 p-4 rounded-xl bg-[#1a3a4a]/30 border border-[#1a3a4a]/50">
                  <h4 className="font-semibold text-[#e8f4f8] mb-2 flex items-center gap-2">
                    <Hash className="h-4 w-4 text-[#00d4aa]" />
                    Server Commits Hash
                  </h4>
                  <p className="text-sm text-[#6b8a9a]">
                    Before you spin, the server creates a secret seed and shows you only its hash (encrypted version). 
                    This locks in the outcome before you act.
                  </p>
                  <div className="mt-2 p-2 rounded bg-[#0a1628] font-mono text-xs text-[#00d4aa]">
                    hash = SHA256(server_seed)
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#00b4d8] flex items-center justify-center text-[#0a1628] font-bold">
                  2
                </div>
                <div className="flex-1 p-4 rounded-xl bg-[#1a3a4a]/30 border border-[#1a3a4a]/50">
                  <h4 className="font-semibold text-[#e8f4f8] mb-2 flex items-center gap-2">
                    <Dices className="h-4 w-4 text-[#00b4d8]" />
                    You Provide Client Seed
                  </h4>
                  <p className="text-sm text-[#6b8a9a]">
                    You contribute your own random seed. This ensures the server couldn&apos;t have known the final 
                    randomness source when it committed.
                  </p>
                  <div className="mt-2 p-2 rounded bg-[#0a1628] font-mono text-xs text-[#00b4d8]">
                    client_seed = your_random_input
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#f0c674] flex items-center justify-center text-[#0a1628] font-bold">
                  3
                </div>
                <div className="flex-1 p-4 rounded-xl bg-[#1a3a4a]/30 border border-[#1a3a4a]/50">
                  <h4 className="font-semibold text-[#e8f4f8] mb-2 flex items-center gap-2">
                    <Zap className="h-4 w-4 text-[#f0c674]" />
                    Outcome Generated
                  </h4>
                  <p className="text-sm text-[#6b8a9a]">
                    The server combines both seeds to generate the final random number that determines your tier, 
                    duration, and multiplier.
                  </p>
                  <div className="mt-2 p-2 rounded bg-[#0a1628] font-mono text-xs text-[#f0c674]">
                    result = HMAC(server_seed, client_seed + nonce)
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-pink-400 flex items-center justify-center text-[#0a1628] font-bold">
                  4
                </div>
                <div className="flex-1 p-4 rounded-xl bg-[#1a3a4a]/30 border border-[#1a3a4a]/50">
                  <h4 className="font-semibold text-[#e8f4f8] mb-2 flex items-center gap-2">
                    <Eye className="h-4 w-4 text-pink-400" />
                    Server Reveals & You Verify
                  </h4>
                  <p className="text-sm text-[#6b8a9a]">
                    After the spin, the server reveals its original seed. You can hash it yourself and confirm 
                    it matches the hash shown before your spin.
                  </p>
                  <div className="mt-2 p-2 rounded bg-[#0a1628] font-mono text-xs text-pink-400">
                    verify: SHA256(revealed_seed) == original_hash ✓
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Trust Guarantees */}
          <div className="cyber-panel p-6">
            <h2 className="text-2xl font-bold text-[#e8f4f8] mb-6 flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-[#00d4aa]" />
              Trust Guarantees
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-[#1a3a4a]/30 border border-[#1a3a4a]/50">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="h-5 w-5 text-red-400" />
                  <span className="font-semibold text-red-400">Server Cannot</span>
                </div>
                <ul className="space-y-2 text-sm text-[#e8f4f8]">
                  <li className="flex items-center gap-2">
                    <ArrowRight className="h-3 w-3 text-red-400" />
                    Change outcome after seeing your seed
                  </li>
                  <li className="flex items-center gap-2">
                    <ArrowRight className="h-3 w-3 text-red-400" />
                    Predict your client seed
                  </li>
                  <li className="flex items-center gap-2">
                    <ArrowRight className="h-3 w-3 text-red-400" />
                    Fake the hash commitment
                  </li>
                </ul>
              </div>
              <div className="p-4 rounded-xl bg-[#1a3a4a]/30 border border-[#1a3a4a]/50">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-5 w-5 text-[#00d4aa]" />
                  <span className="font-semibold text-[#00d4aa]">You Can Always</span>
                </div>
                <ul className="space-y-2 text-sm text-[#e8f4f8]">
                  <li className="flex items-center gap-2">
                    <ArrowRight className="h-3 w-3 text-[#00d4aa]" />
                    Verify any past spin result
                  </li>
                  <li className="flex items-center gap-2">
                    <ArrowRight className="h-3 w-3 text-[#00d4aa]" />
                    Reproduce the exact calculation
                  </li>
                  <li className="flex items-center gap-2">
                    <ArrowRight className="h-3 w-3 text-[#00d4aa]" />
                    Prove manipulation if it occurred
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* On-Chain Verification */}
          <div className="cyber-panel p-6">
            <h2 className="text-2xl font-bold text-[#e8f4f8] mb-4 flex items-center gap-3">
              <Gem className="h-6 w-6 text-[#00d4aa]" />
              Solana On-Chain Verification
            </h2>
            <p className="text-[#6b8a9a] mb-4">
              All spins are recorded on the Solana blockchain, providing an immutable audit trail. 
              Every lock, unlock, and payout is verifiable through the blockchain explorer.
            </p>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 rounded-xl bg-[#1a3a4a]/30">
                <div className="text-2xl mb-1">🔗</div>
                <div className="text-xs text-[#6b8a9a]">On-Chain Records</div>
              </div>
              <div className="p-3 rounded-xl bg-[#1a3a4a]/30">
                <div className="text-2xl mb-1">📜</div>
                <div className="text-xs text-[#6b8a9a]">Immutable History</div>
              </div>
              <div className="p-3 rounded-xl bg-[#1a3a4a]/30">
                <div className="text-2xl mb-1">🔍</div>
                <div className="text-xs text-[#6b8a9a]">Public Auditable</div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Bottom CTA */}
      <div className="mt-12 text-center">
        <div className="cyber-panel p-8 max-w-2xl mx-auto">
          <h3 className="text-2xl font-bold text-[#e8f4f8] mb-2">Ready to Play?</h3>
          <p className="text-[#6b8a9a] mb-6">
            Now that you understand how LOCK SLOT works, connect your wallet and try your luck!
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#00d4aa] to-[#00b4d8] text-[#0a1628] font-bold hover:opacity-90 transition-opacity"
          >
            <Dices className="h-5 w-5" />
            Start Playing
          </Link>
        </div>
      </div>
    </div>
  )
}
