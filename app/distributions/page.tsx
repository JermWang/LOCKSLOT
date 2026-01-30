"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Coins, Clock, Users, TrendingUp } from "lucide-react"
import { formatTokenAmountFromBase } from "@/lib/token-utils"

interface Distribution {
  epoch: number
  amount: number
  recipients: number
  status: "pending" | "completed"
}

interface DistributionStats {
  totalDistributed: number
  nextDistributionTime: string
  avgRecipients: number
  avgPerEpoch: number
}

export default function DistributionsPage() {
  const [distributions, setDistributions] = useState<Distribution[]>([])
  const [stats, setStats] = useState<DistributionStats>({
    totalDistributed: 0,
    nextDistributionTime: "--",
    avgRecipients: 0,
    avgPerEpoch: 0,
  })
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Distributions</h1>
        <p className="text-muted-foreground">
          Weekly reward pool distributions to top holders
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card className="border-border bg-card/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Coins className="h-4 w-4 text-primary" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Total Distributed</div>
                <div className="text-lg font-bold font-mono">{formatTokenAmountFromBase(stats.totalDistributed)} $LOCK</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Clock className="h-4 w-4 text-primary" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Next Distribution</div>
                <div className="text-lg font-bold font-mono">{stats.nextDistributionTime}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Users className="h-4 w-4 text-primary" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Avg Recipients</div>
                <div className="text-lg font-bold font-mono">{stats.avgRecipients}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Avg per Epoch</div>
                <div className="text-lg font-bold font-mono">{formatTokenAmountFromBase(stats.avgPerEpoch)} $LOCK</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Distribution History */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg">Distribution History</CardTitle>
        </CardHeader>
        <CardContent>
          {distributions.length > 0 ? (
            <div className="space-y-3">
              {distributions.map((dist) => (
                <div
                  key={dist.epoch}
                  className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Epoch </span>
                      <span className="font-mono text-primary">#{dist.epoch}</span>
                    </div>
                    <Badge
                      variant={dist.status === "pending" ? "outline" : "secondary"}
                      className={dist.status === "pending" ? "border-primary text-primary" : ""}
                    >
                      {dist.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div>
                      <span className="text-muted-foreground">Recipients: </span>
                      <span className="font-mono">{dist.recipients}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Amount: </span>
                      <span className="font-mono text-primary">{formatTokenAmountFromBase(dist.amount)} $LOCK</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No distributions yet
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
