"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TIER_CONFIG } from "@/lib/game-types"
import { cn } from "@/lib/utils"

const tierColors: Record<string, string> = {
  brick: "text-brick",
  mid: "text-mid",
  hot: "text-hot",
  legendary: "text-legendary",
  mythic: "text-mythic",
}

export default function DocsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Documentation</h1>
        <p className="text-muted-foreground">
          Learn how LOCK SLOT works and understand the mechanics
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tiers">Tiers</TabsTrigger>
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
          <TabsTrigger value="fairness">Fairness</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>How LOCK SLOT Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                LOCK SLOT is a provably-fair, pari-mutuel <strong className="text-foreground">gambling mechanism</strong> with 
                time-lock constraints. It is <em>not</em> a staking protocol, yield system, or investment vehicle.
                Short locks are rare wins. Long locks are painful losses. Losers fund winners.
              </p>
              <div className="space-y-3">
                <div className="rounded-lg border border-border bg-secondary/30 p-4">
                  <h4 className="font-semibold text-foreground mb-2">1. Spin</h4>
                  <p className="text-sm">
                    Choose your stake amount and spin. The slot machine randomly determines
                    your outcome tier, lock duration, and potential multiplier.
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-secondary/30 p-4">
                  <h4 className="font-semibold text-foreground mb-2">2. Lock</h4>
                  <p className="text-sm">
                    Your tokens are locked for the determined duration (1-21 days). 
                    Your principal is always recoverable—you just can&apos;t access it until the lock expires.
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-secondary/30 p-4">
                  <h4 className="font-semibold text-foreground mb-2">3. Resolve</h4>
                  <p className="text-sm">
                    On unlock, your principal is returned. Only Legendary &amp; Mythic outcomes 
                    receive bonus payouts from the reward pool. Most players get nothing but their principal back.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tiers">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>Outcome Tiers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="py-3 text-left font-medium">Tier</th>
                      <th className="py-3 text-left font-medium">Probability</th>
                      <th className="py-3 text-left font-medium">Duration</th>
                      <th className="py-3 text-left font-medium">Multiplier</th>
                      <th className="py-3 text-left font-medium">Bonus</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(TIER_CONFIG).map(([tier, config]) => (
                      <tr key={tier} className="border-b border-border/50">
                        <td className={cn("py-3 font-semibold capitalize", tierColors[tier])}>
                          {tier}
                        </td>
                        <td className="py-3 font-mono">
                          {(config.probability * 100).toFixed(1)}%
                        </td>
                        <td className="py-3 font-mono">
                          {config.durationRange[0]}-{config.durationRange[1]}d
                        </td>
                        <td className="py-3 font-mono">
                          {config.multiplierRange[0]}x-{config.multiplierRange[1]}x
                        </td>
                        <td className="py-3">
                          {tier === "legendary" || tier === "mythic" ? (
                            <Badge variant="outline" className="border-primary text-primary">
                              Eligible
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rewards">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>Reward System</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                LOCK SLOT is <strong className="text-foreground">pari-mutuel</strong>. The system never pays out more than it collects. 
                All bonuses are funded exclusively by player-paid fees. Principal is never used for rewards.
              </p>
              <div className="rounded-lg border border-border bg-secondary/30 p-4">
                <h4 className="font-semibold text-foreground mb-2">Reward Pool</h4>
                <p className="font-mono text-sm text-primary">
                  P = Σ(fees) + Σ(early exit penalties)
                </p>
                <p className="text-sm mt-2">
                  The pool grows from 5% fees on each spin plus any early exit penalties.
                  It can only increase—never decrease except through winner payouts.
                </p>
              </div>
              <div className="rounded-lg border border-border bg-secondary/30 p-4">
                <h4 className="font-semibold text-foreground mb-2">Bonus Distribution</h4>
                <p className="font-mono text-sm text-primary">
                  bonus_i = Pool × (S_i / Σ S_winners)
                </p>
                <p className="text-sm mt-2">
                  Where ticket score S = Stake × Multiplier. Winners split the pool proportionally
                  based on their ticket scores. If no winners, the pool rolls over.
                </p>
              </div>
              <div className="rounded-lg border border-border bg-secondary/30 p-4">
                <h4 className="font-semibold text-foreground mb-2">Core Invariants</h4>
                <ul className="text-sm space-y-2 list-disc list-inside">
                  <li>Total bonuses paid ≤ total fees collected</li>
                  <li>Principal is never used for payouts</li>
                  <li>Only Legendary & Mythic tiers receive bonus distributions</li>
                  <li>Brick, Mid, and Hot tiers recover principal but receive no bonus</li>
                  <li>All outcomes are verifiably random and fair</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fairness">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>Provably Fair</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                LOCK SLOT uses a commit-reveal scheme to ensure all outcomes are
                verifiably fair and cannot be manipulated.
              </p>
              <div className="space-y-3">
                <div className="rounded-lg border border-border bg-secondary/30 p-4">
                  <h4 className="font-semibold text-foreground mb-2">Server Seed</h4>
                  <p className="text-sm">
                    Before each spin, the server commits to a hashed seed. The actual
                    seed is revealed after the spin and can be verified against the hash.
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-secondary/30 p-4">
                  <h4 className="font-semibold text-foreground mb-2">Client Seed</h4>
                  <p className="text-sm">
                    Players provide their own seed that is combined with the server seed.
                    This prevents the server from predicting outcomes.
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-secondary/30 p-4">
                  <h4 className="font-semibold text-foreground mb-2">Verification</h4>
                  <p className="text-sm">
                    Anyone can verify any spin by combining the server seed, client seed,
                    and nonce to reproduce the exact outcome.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
