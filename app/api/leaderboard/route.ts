import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { rateLimitGate } from "@/lib/api-guard"

export const runtime = "nodejs"

const DEFAULT_LIMIT = 25

function formatWallet(wallet: string | null | undefined) {
  if (!wallet) return "Unknown"
  if (wallet.length <= 10) return wallet
  return `${wallet.slice(0, 4)}...${wallet.slice(-4)}`
}

function toBigInt(value: number | string | null | undefined) {
  if (value === null || value === undefined) return 0n
  return BigInt(value)
}

export async function GET(request: NextRequest) {
  try {
    const limited = await rateLimitGate(request, { id: "leaderboard", windowMs: 10_000, max: 60 })
    if (limited) return limited

    const { searchParams } = new URL(request.url)
    const limitParam = Number(searchParams.get("limit"))
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 100) : DEFAULT_LIMIT

    const supabase = createServerClient()

    const { data: epoch, error: epochError } = await supabase
      .from("epochs")
      .select("id, reward_pool")
      .eq("status", "active")
      .order("start_time", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (epochError) {
      return NextResponse.json({ error: epochError.message }, { status: 500 })
    }

    if (!epoch?.id) {
      return NextResponse.json({ leaderboard: [], activeWinners: 0 })
    }

    const { data: spins, error: spinsError } = await supabase
      .from("spins")
      .select("stake_amount, multiplier, tier, ticket_score, users(username, wallet_address)")
      .eq("epoch_id", epoch.id)
      .eq("bonus_eligible", true)
      .neq("status", "claimed")

    if (spinsError) {
      return NextResponse.json({ error: spinsError.message }, { status: 500 })
    }

    const rows = spins ?? []
    const rewardPool = toBigInt(epoch.reward_pool)
    const totalScore = rows.reduce((sum, row: any) => sum + toBigInt(row.ticket_score), 0n)

    const leaderboard = rows
      .map((row: any) => {
        const score = toBigInt(row.ticket_score)
        const bonus = totalScore > 0n ? (rewardPool * score) / totalScore : 0n
        const username = row.users?.username as string | null | undefined
        const wallet = row.users?.wallet_address as string | null | undefined
        const userLabel = username?.trim() ? username : formatWallet(wallet)

        return {
          user: userLabel,
          tier: row.tier,
          multiplier: Number(row.multiplier ?? 0),
          amount: Number(row.stake_amount ?? 0),
          potentialBonus: Number(bonus),
        }
      })
      .sort((a, b) => {
        if (b.potentialBonus !== a.potentialBonus) return b.potentialBonus - a.potentialBonus
        if (b.multiplier !== a.multiplier) return b.multiplier - a.multiplier
        return b.amount - a.amount
      })
      .slice(0, limit)
      .map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }))

    return NextResponse.json({ leaderboard, activeWinners: rows.length })
  } catch (error) {
    console.error("Leaderboard error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
