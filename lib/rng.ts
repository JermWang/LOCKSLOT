import crypto from 'crypto'

// Tier configuration - durations in HOURS (max 48h), rebalanced for 12% win rate
export const TIER_CONFIG = {
  brick: { probability: 0.45, durationRange: [36, 48], multiplierRange: [1.2, 2.0] },    // 36-48 hours (longest)
  mid: { probability: 0.28, durationRange: [18, 36], multiplierRange: [1.8, 3.5] },      // 18-36 hours
  hot: { probability: 0.15, durationRange: [8, 18], multiplierRange: [3.0, 7.0] },       // 8-18 hours
  legendary: { probability: 0.09, durationRange: [3, 8], multiplierRange: [5.0, 8.0] },  // 3-8 hours
  mythic: { probability: 0.03, durationRange: [1, 3], multiplierRange: [8.0, 15.0] },    // 1-3 hours (shortest)
} as const

export type Tier = keyof typeof TIER_CONFIG

export interface SpinResult {
  tier: Tier
  duration: number
  multiplier: number
  rollValue: number
  combinedHash: string
  bonusEligible: boolean
}

// Generate combined hash for provably fair RNG
export function generateCombinedHash(
  serverSeed: string,
  clientSeed: string,
  nonce: number
): string {
  const combined = `${serverSeed}:${clientSeed}:${nonce}`
  return crypto.createHash('sha256').update(combined).digest('hex')
}

// Convert hash to roll value (0 to 1)
export function hashToRoll(hash: string): number {
  // Use first 8 characters of hash (32 bits)
  const hex = hash.substring(0, 8)
  const int = parseInt(hex, 16)
  return int / 0x100000000
}

// Determine tier from roll value
export function rollToTier(roll: number): Tier {
  let cumulative = 0
  
  for (const [tier, config] of Object.entries(TIER_CONFIG)) {
    cumulative += config.probability
    if (roll < cumulative) {
      return tier as Tier
    }
  }
  
  return 'brick' // Fallback
}

// Generate random value within range using hash
export function hashToRange(hash: string, offset: number, min: number, max: number): number {
  const hex = hash.substring(offset, offset + 8)
  const int = parseInt(hex, 16)
  const normalized = int / 0x100000000
  return min + normalized * (max - min)
}

// Main spin function
export function calculateSpin(
  serverSeed: string,
  clientSeed: string,
  nonce: number
): SpinResult {
  const combinedHash = generateCombinedHash(serverSeed, clientSeed, nonce)
  const rollValue = hashToRoll(combinedHash)
  const tier = rollToTier(rollValue)
  
  const config = TIER_CONFIG[tier]
  
  // Use different parts of hash for duration and multiplier
  const duration = Math.round(hashToRange(combinedHash, 8, config.durationRange[0], config.durationRange[1]))
  const multiplier = Math.round(hashToRange(combinedHash, 16, config.multiplierRange[0], config.multiplierRange[1]) * 10) / 10
  
  const bonusEligible = tier === 'legendary' || tier === 'mythic'
  
  return {
    tier,
    duration,
    multiplier,
    rollValue,
    combinedHash,
    bonusEligible,
  }
}

// Verify a spin result (for auditing)
export function verifySpin(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  expectedHash: string
): boolean {
  const calculatedHash = generateCombinedHash(serverSeed, clientSeed, nonce)
  return calculatedHash === expectedHash
}

// Generate server seed hash (commitment)
export function generateServerSeedHash(serverSeed: string): string {
  return crypto.createHash('sha256').update(serverSeed).digest('hex')
}

// Generate a new random server seed
export function generateServerSeed(): string {
  return crypto.randomBytes(32).toString('hex')
}

// Generate client seed from wallet signature or random
export function generateClientSeed(): string {
  return crypto.randomBytes(16).toString('hex')
}
