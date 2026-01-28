"use client"

import { Leaderboard } from "@/components/leaderboard"

export default function LeaderboardsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Leaderboards</h1>
        <p className="text-muted-foreground">
          Top performers eligible for bonus distributions
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Leaderboard />
      </div>
    </div>
  )
}
