"use client"

import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { Lock, Unlock, Clock, Trophy, Coins, ArrowRight, Wallet, Dices, Timer, Gift, Shield } from "lucide-react"

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-[#00d4aa] via-[#00b4d8] to-[#00d4aa] bg-clip-text text-transparent">
          How Lock Slot Works
        </h1>
        <p className="text-lg text-[#6b8a9a] max-w-2xl mx-auto">
          A unique pari-mutuel slot machine where your principal is always protected. Only time is at stake.
        </p>
      </div>

      <Card className="cyber-panel border-[#1a3a4a] mb-8">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-[#00d4aa]/20">
              <Shield className="h-6 w-6 text-[#00d4aa]" />
            </div>
            <h2 className="text-xl font-bold text-[#e8f4f8]">The Core Concept</h2>
          </div>
          <p className="text-[#a8c5d6]">
            Lock Slot is <span className="text-[#00d4aa] font-semibold">NOT a traditional casino</span>. 
            You never lose your principal. Instead, you stake tokens which get locked for a random duration. 
            Winners unlock early with bonus rewards from the pool. Losers simply wait longer.
          </p>
        </CardContent>
      </Card>

      <h2 className="text-2xl font-bold text-[#e8f4f8] mb-6">How to Play</h2>
      
      <div className="space-y-4 mb-12">
        <div className="cyber-panel p-6 flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#00d4aa]/20 flex items-center justify-center text-[#00d4aa] font-bold">1</div>
          <div>
            <h3 className="text-lg font-semibold text-[#e8f4f8] mb-2 flex items-center gap-2">
              <Wallet className="h-5 w-5 text-[#00b4d8]" /> Connect & Deposit
            </h3>
            <p className="text-[#a8c5d6]">Connect your Solana wallet and deposit tokens into the game escrow. Your tokens are held securely until your lock period ends.</p>
          </div>
        </div>

        <div className="cyber-panel p-6 flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#00b4d8]/20 flex items-center justify-center text-[#00b4d8] font-bold">2</div>
          <div>
            <h3 className="text-lg font-semibold text-[#e8f4f8] mb-2 flex items-center gap-2">
              <Dices className="h-5 w-5 text-pink-400" /> Spin the Slot
            </h3>
            <p className="text-[#a8c5d6]">Each spin costs tokens from your deposited balance. The provably fair RNG determines your tier and lock duration.</p>
          </div>
        </div>

        <div className="cyber-panel p-6 flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-pink-400/20 flex items-center justify-center text-pink-400 font-bold">3</div>
          <div>
            <h3 className="text-lg font-semibold text-[#e8f4f8] mb-2 flex items-center gap-2">
              <Lock className="h-5 w-5 text-yellow-400" /> Tokens Get Locked
            </h3>
            <p className="text-[#a8c5d6]">Your staked tokens are locked for 1-48 hours depending on your tier. Higher tiers = shorter locks.</p>
          </div>
        </div>

        <div className="cyber-panel p-6 flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-400/20 flex items-center justify-center text-emerald-400 font-bold">4</div>
          <div>
            <h3 className="text-lg font-semibold text-[#e8f4f8] mb-2 flex items-center gap-2">
              <Unlock className="h-5 w-5 text-emerald-400" /> Unlock & Collect
            </h3>
            <p className="text-[#a8c5d6]">When your lock expires, withdraw your full principal. Winners (Legendary/Mythic tiers) also receive bonus rewards!</p>
          </div>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-[#e8f4f8] mb-6">Tier System</h2>
      
      <div className="grid md:grid-cols-2 gap-4 mb-12">
        <div className="cyber-panel p-4 border-l-4 border-yellow-400">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-yellow-400 font-bold">BRICK</span>
            <span className="text-xs text-[#6b8a9a]">45% chance</span>
          </div>
          <p className="text-sm text-[#a8c5d6]">36-48 hour lock. No bonus.</p>
        </div>
        <div className="cyber-panel p-4 border-l-4 border-orange-400">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-orange-400 font-bold">MID</span>
            <span className="text-xs text-[#6b8a9a]">28% chance</span>
          </div>
          <p className="text-sm text-[#a8c5d6]">18-36 hour lock. No bonus.</p>
        </div>
        <div className="cyber-panel p-4 border-l-4 border-red-400">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-red-400 font-bold">HOT</span>
            <span className="text-xs text-[#6b8a9a]">15% chance</span>
          </div>
          <p className="text-sm text-[#a8c5d6]">8-18 hour lock. No bonus.</p>
        </div>
        <div className="cyber-panel p-4 border-l-4 border-cyan-400">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-cyan-400 font-bold">LEGENDARY</span>
            <span className="text-xs text-[#6b8a9a]">9% chance</span>
          </div>
          <p className="text-sm text-[#a8c5d6]">3-8 hour lock. <span className="text-[#00d4aa]">Bonus eligible!</span></p>
        </div>
        <div className="cyber-panel p-4 border-l-4 border-pink-400 md:col-span-2">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-pink-400 font-bold">MYTHIC</span>
            <span className="text-xs text-[#6b8a9a]">3% chance</span>
          </div>
          <p className="text-sm text-[#a8c5d6]">1-3 hour lock. <span className="text-[#00d4aa]">Highest bonus multiplier!</span></p>
        </div>
      </div>

      <div className="text-center">
        <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#00d4aa] to-[#00b4d8] text-[#0a1628] font-bold hover:opacity-90 transition-opacity">
          <Dices className="h-5 w-5" />
          Start Playing
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}
