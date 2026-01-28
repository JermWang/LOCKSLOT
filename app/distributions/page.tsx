"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Coins, Clock, Users, TrendingUp } from "lucide-react"

const distributions = [
  { epoch: 42, amount: 12.5, recipients: 47, status: "pending" },
  { epoch: 41, amount: 10.2, recipients: 45, status: "completed" },
  { epoch: 40, amount: 11.8, recipients: 48, status: "completed" },
  { epoch: 39, amount: 9.7, recipients: 42, status: "completed" },
  { epoch: 38, amount: 13.1, recipients: 50, status: "completed" },
]

export default function DistributionsPage() {
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
                <div className="text-lg font-bold font-mono">57.3 SOL</div>
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
                <div className="text-lg font-bold font-mono">3d 14h</div>
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
                <div className="text-lg font-bold font-mono">46</div>
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
                <div className="text-lg font-bold font-mono">11.5 SOL</div>
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
                    <span className="font-mono text-primary">{dist.amount} SOL</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
