"use client"

import { useState, useEffect } from "react"
import { useWallet } from "@/lib/wallet-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Gift, Wallet, Clock, CheckCircle, Coins } from "lucide-react"

interface ClaimableReward {
  epoch: number
  amount: number
  status: "claimable" | "pending"
}

interface ClaimedReward {
  epoch: number
  amount: number
  claimedAt: string
  txHash: string
}

export default function ClaimsPage() {
  const { connected, connect, publicKey } = useWallet()
  const [claimableRewards, setClaimableRewards] = useState<ClaimableReward[]>([])
  const [claimedRewards, setClaimedRewards] = useState<ClaimedReward[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const totalClaimable = claimableRewards.reduce((acc, r) => acc + r.amount, 0)

  if (!connected) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4">
        <div className="rounded-full bg-secondary p-6 mb-6">
          <Wallet className="h-12 w-12 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
        <p className="text-muted-foreground mb-6 text-center max-w-md">
          Connect your Solana wallet to view and claim your rewards
        </p>
        <Button onClick={connect} className="gap-2">
          <Wallet className="h-4 w-4" />
          Connect Wallet
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Claims</h1>
        <p className="text-muted-foreground">
          Claim your earned rewards from distributions
        </p>
      </div>

      {/* Claimable Summary */}
      <Card className="border-primary/30 bg-primary/5 mb-8">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-primary/20 p-3">
                <Gift className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Total Claimable</div>
                <div className="text-3xl font-bold font-mono text-primary flex items-center gap-2">
                  {totalClaimable.toLocaleString()} <span className="text-xl">$LOCK</span>
                </div>
              </div>
            </div>
            <Button className="glow-primary" disabled={totalClaimable === 0}>
              Claim All
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Claimable Rewards */}
      <Card className="border-border bg-card mb-8">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Pending Claims
          </CardTitle>
        </CardHeader>
        <CardContent>
          {claimableRewards.length > 0 ? (
            <div className="space-y-3">
              {claimableRewards.map((reward) => (
                <div
                  key={reward.epoch}
                  className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Epoch </span>
                      <span className="font-mono text-primary">#{reward.epoch}</span>
                    </div>
                    <Badge variant="outline" className="border-primary text-primary">
                      Claimable
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-primary">{reward.amount.toLocaleString()} $LOCK</span>
                    <Button size="sm" variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground bg-transparent">
                      Claim
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No pending claims
            </div>
          )}
        </CardContent>
      </Card>

      {/* Claimed History */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-muted-foreground" />
            Claim History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {claimedRewards.map((reward) => (
              <div
                key={reward.epoch}
                className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-4 opacity-60"
              >
                <div className="flex items-center gap-4">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Epoch </span>
                    <span className="font-mono">#{reward.epoch}</span>
                  </div>
                  <Badge variant="secondary">Claimed</Badge>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-muted-foreground">{reward.claimedAt}</span>
                  <span className="font-mono">{reward.amount.toLocaleString()} $LOCK</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
