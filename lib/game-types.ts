export type Tier = "brick" | "mid" | "hot" | "legendary" | "mythic"

export interface SpinResult {
  tier: Tier
  duration: number // hours
  multiplier: number
  timestamp: Date
}

export interface Lock {
  id: string
  amount: number
  feeAmount?: number
  tier: Tier
  duration: number
  multiplier: number
  startTime: Date
  endTime: Date
  status: "active" | "unlocked" | "claimed" | "exited"
  bonusEligible?: boolean
  bonusAmount?: number
  epochNumber?: number
  txSignature?: string
}

export interface ActivityItem {
  id: string
  user: string
  tier: Tier
  duration: number
  multiplier: number
  amount: number
  timestamp: Date
}

export interface LeaderboardEntry {
  rank: number
  user: string
  tier: Tier
  multiplier: number
  amount: number
  potentialBonus: number
}

export const TIER_CONFIG: Record<
  Tier,
  {
    probability: number
    durationRange: [number, number] // in hours
    multiplierRange: [number, number]
    color: string
    label: string
  }
> = {
  brick: {
    probability: 0.45,
    durationRange: [36, 48], // 36-48 hours (longest lock, worst outcome)
    multiplierRange: [1.2, 2.0],
    color: "brick",
    label: "BRICK",
  },
  mid: {
    probability: 0.28,
    durationRange: [18, 36], // 18-36 hours
    multiplierRange: [1.8, 3.5],
    color: "mid",
    label: "MID",
  },
  hot: {
    probability: 0.15,
    durationRange: [8, 18], // 8-18 hours
    multiplierRange: [3.0, 7.0],
    color: "hot",
    label: "HOT",
  },
  legendary: {
    probability: 0.09,
    durationRange: [3, 8], // 3-8 hours
    multiplierRange: [5.0, 8.0],
    color: "legendary",
    label: "LEGENDARY",
  },
  mythic: {
    probability: 0.03,
    durationRange: [1, 3], // 1-3 hours (shortest lock, best outcome)
    multiplierRange: [8.0, 15.0],
    color: "mythic",
    label: "MYTHIC",
  },
}

export function getTierColor(tier: Tier): string {
  const colors: Record<Tier, string> = {
    brick: "text-yellow-400",
    mid: "text-orange-400",
    hot: "text-red-400",
    legendary: "text-cyan-400",
    mythic: "text-pink-400",
  }
  return colors[tier]
}

export function getTierBgColor(tier: Tier): string {
  const colors: Record<Tier, string> = {
    brick: "bg-yellow-400/20 border-yellow-400/40",
    mid: "bg-orange-400/20 border-orange-400/40",
    hot: "bg-red-400/20 border-red-400/40",
    legendary: "bg-cyan-400/20 border-cyan-400/40",
    mythic: "bg-pink-400/20 border-pink-400/40",
  }
  return colors[tier]
}

export function getTierDotColor(tier: Tier): string {
  const colors: Record<Tier, string> = {
    brick: "bg-yellow-400",
    mid: "bg-orange-400",
    hot: "bg-red-400",
    legendary: "bg-cyan-400",
    mythic: "bg-pink-400",
  }
  return colors[tier]
}

export function formatTierDurationRange(tier: Tier): string {
  const [minH, maxH] = TIER_CONFIG[tier].durationRange
  return `${minH}-${maxH}h`
}
