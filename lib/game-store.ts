import { create } from "zustand"
import type { Lock, ActivityItem, LeaderboardEntry, SpinResult, Tier } from "./game-types"
import { TIER_CONFIG } from "./game-types"
import { signAuth } from "@/lib/auth-client"
import { gameToast } from "@/lib/toast"

const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

// DEV MODE: Enable free spins (no balance deduction)
const FREE_SPIN_MODE = true

function generateClientSeed(): string {
  if (typeof window === "undefined") return Math.random().toString(16).slice(2)
  const bytes = new Uint8Array(16)
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes)
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256)
  }
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("")
}

interface GameState {
  // User state
  walletAddress: string | null
  userBalance: number
  locks: Lock[]
  
  // Global state
  rewardPool: number
  totalSpins: number
  activeWinners: number
  activityFeed: ActivityItem[]
  leaderboard: LeaderboardEntry[]
  
  // UI state
  isSpinning: boolean
  isLoading: boolean
  lastResult: SpinResult | null
  error: string | null

  // Actions
  setWallet: (address: string | null) => void
  fetchUserData: (address: string) => Promise<void>
  spin: (amount: number) => Promise<SpinResult>
  deposit: (txSignature: string, amount: number) => Promise<void>
  withdraw: (amount: number) => Promise<{ txSignature: string }>
  claimLock: (spinId: string) => Promise<void>
  setSpinning: (spinning: boolean) => void
  addActivity: (activity: ActivityItem) => void
}

// Demo mode helpers
function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

function selectTier(): Tier {
  const rand = Math.random()
  let cumulative = 0
  for (const [tier, config] of Object.entries(TIER_CONFIG)) {
    cumulative += config.probability
    if (rand <= cumulative) return tier as Tier
  }
  return "brick"
}

function generateDemoSpinResult(): SpinResult {
  const tier = selectTier()
  const config = TIER_CONFIG[tier]
  return {
    tier,
    duration: Math.round(randomInRange(...config.durationRange)),
    multiplier: Number(randomInRange(...config.multiplierRange).toFixed(1)),
    timestamp: new Date(),
  }
}

function generateMockActivity(): ActivityItem[] {
  const users = ["7a3...f9d", "1bc...e42", "9de...a71", "4f8...c23", "2ab...d56"]
  return Array.from({ length: 10 }, (_, i) => {
    const result = generateDemoSpinResult()
    return {
      id: `activity-${i}`,
      user: users[Math.floor(Math.random() * users.length)],
      tier: result.tier,
      duration: result.duration,
      multiplier: result.multiplier,
      amount: Math.round(randomInRange(100, 10000)),
      timestamp: new Date(Date.now() - i * 60000 * Math.random() * 30),
    }
  })
}

export const useGameStore = create<GameState>((set, get) => ({
  walletAddress: null,
  userBalance: IS_DEMO ? 10000 : 0,
  locks: [],
  rewardPool: IS_DEMO ? 847293 : 0,
  totalSpins: IS_DEMO ? 500 : 0,
  activeWinners: IS_DEMO ? 12 : 0,
  activityFeed: generateMockActivity(),
  leaderboard: [],
  isSpinning: false,
  isLoading: false,
  lastResult: null,
  error: null,

  setWallet: (address) => set({ walletAddress: address }),

  fetchUserData: async (address: string) => {
    if (IS_DEMO) {
      set({ walletAddress: address, userBalance: 10000 })
      return
    }
    
    set({ isLoading: true, error: null })
    try {
      const res = await fetch(`/api/user?wallet=${address}`)
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.error)
      
      set({
        walletAddress: address,
        userBalance: data.user.balance,
        locks: data.locks.map((l: any) => ({
          id: l.id,
          amount: l.stakeAmount,
          tier: l.tier,
          duration: l.duration,
          multiplier: l.multiplier,
          startTime: new Date(l.lockedAt),
          endTime: new Date(l.unlocksAt),
          status: l.status === 'claimed' ? 'claimed' : l.status === 'unlocked' || new Date(l.unlocksAt) < new Date() ? 'unlocked' : 'active',
          bonusEligible: l.bonusEligible,
          bonusAmount: l.bonusAmount,
        })),
        rewardPool: data.epoch?.rewardPool || 0,
        totalSpins: data.epoch?.totalSpins || 0,
      })
    } catch (err: any) {
      set({ error: err.message })
    } finally {
      set({ isLoading: false })
    }
  },

  spin: async (amount: number) => {
    const { walletAddress, userBalance, rewardPool, locks, activityFeed } = get()

    if (!walletAddress) {
      throw new Error("Wallet not connected")
    }

    if (amount > userBalance) {
      throw new Error("Insufficient balance")
    }

    set({ isSpinning: true, error: null })

    // Demo mode - simulate locally
    if (IS_DEMO) {
      await new Promise((resolve) => setTimeout(resolve, 2500))
      
      const result = generateDemoSpinResult()
      const fee = amount * 0.05

      const newLock: Lock = {
        id: `lock-${Date.now()}`,
        amount,
        tier: result.tier,
        duration: result.duration,
        multiplier: result.multiplier,
        startTime: new Date(),
        endTime: new Date(Date.now() + result.duration * 24 * 60 * 60 * 1000),
        status: "active",
      }

      set({
        userBalance: FREE_SPIN_MODE ? userBalance : userBalance - amount,
        rewardPool: rewardPool + fee,
        locks: [newLock, ...locks],
        activityFeed: [{
          id: `activity-${Date.now()}`,
          user: "You",
          tier: result.tier,
          duration: result.duration,
          multiplier: result.multiplier,
          amount,
          timestamp: new Date(),
        }, ...activityFeed.slice(0, 14)],
        isSpinning: false,
        lastResult: result,
      })

      gameToast.spin(result.tier, result.multiplier, result.duration)
      return result
    }

    // Production mode - call API
    try {
      const clientSeed = generateClientSeed()
      const auth = await signAuth({
        action: "spin",
        walletAddress,
        payload: { stakeAmount: amount, clientSeed },
      })

      const res = await fetch('/api/spin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress, stakeAmount: amount, clientSeed, auth }),
      })
      
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      
      const result: SpinResult = {
        tier: data.spin.tier,
        duration: data.spin.duration,
        multiplier: data.spin.multiplier,
        timestamp: new Date(),
      }

      const newLock: Lock = {
        id: data.spin.id,
        amount: data.spin.stakeAmount,
        tier: data.spin.tier,
        duration: data.spin.duration,
        multiplier: data.spin.multiplier,
        startTime: new Date(data.spin.lockedAt),
        endTime: new Date(data.spin.unlocksAt),
        status: "active",
      }

      set({
        userBalance: data.newBalance,
        locks: [newLock, ...locks],
        activityFeed: [{
          id: `activity-${Date.now()}`,
          user: "You",
          tier: result.tier,
          duration: result.duration,
          multiplier: result.multiplier,
          amount,
          timestamp: new Date(),
        }, ...activityFeed.slice(0, 14)],
        isSpinning: false,
        lastResult: result,
      })

      gameToast.spin(result.tier, result.multiplier, result.duration)
      return result
    } catch (err: any) {
      set({ isSpinning: false, error: err.message })
      gameToast.error(err.message)
      throw err
    }
  },

  deposit: async (txSignature: string, amount: number) => {
    const { walletAddress } = get()
    if (!walletAddress) throw new Error('Wallet not connected')
    if (IS_DEMO) {
      set(state => ({ userBalance: state.userBalance + amount }))
      gameToast.deposit(amount)
      return
    }

    const res = await fetch('/api/deposit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress, txSignature, expectedAmount: amount }),
    })
    
    const data = await res.json()
    if (!res.ok) {
      gameToast.error(data.error)
      throw new Error(data.error)
    }
    
    set({ userBalance: data.newBalance })
    gameToast.deposit(amount)
  },

  withdraw: async (amount: number) => {
    const { walletAddress, userBalance } = get()
    if (!walletAddress) throw new Error('Wallet not connected')
    if (amount > userBalance) throw new Error('Insufficient balance')
    
    if (IS_DEMO) {
      set(state => ({ userBalance: state.userBalance - amount }))
      gameToast.withdraw(amount)
      return { txSignature: 'demo_tx_' + Date.now() }
    }

    const auth = await signAuth({
      action: "withdraw",
      walletAddress,
      payload: { amount },
    })

    const res = await fetch('/api/withdraw', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress, amount, auth }),
    })
    
    const data = await res.json()
    if (!res.ok) {
      gameToast.error(data.error)
      throw new Error(data.error)
    }
    
    set({ userBalance: data.newBalance })
    gameToast.withdraw(amount)
    return { txSignature: data.txSignature }
  },

  claimLock: async (spinId: string) => {
    const { walletAddress, locks } = get()
    if (!walletAddress) throw new Error('Wallet not connected')
    
    if (IS_DEMO) {
      const lock = locks.find(l => l.id === spinId)
      if (lock) {
        set(state => ({
          userBalance: state.userBalance + lock.amount,
          locks: state.locks.map(l => l.id === spinId ? { ...l, status: 'claimed' as const } : l)
        }))
        gameToast.claim(lock.amount, lock.bonusAmount || 0)
      }
      return
    }

    const auth = await signAuth({
      action: "claim",
      walletAddress,
      payload: { spinId },
    })

    const res = await fetch('/api/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress, spinId, auth }),
    })
    
    const data = await res.json()
    if (!res.ok) {
      gameToast.error(data.error)
      throw new Error(data.error)
    }
    
    set(state => ({
      userBalance: data.newBalance,
      locks: state.locks.map(l => l.id === spinId ? { ...l, status: 'claimed' as const } : l)
    }))
    gameToast.claim(data.principal || 0, data.bonus || 0)
  },

  setSpinning: (spinning) => set({ isSpinning: spinning }),

  addActivity: (activity) => {
    set(state => ({ activityFeed: [activity, ...state.activityFeed.slice(0, 14)] }))
  },
}))
