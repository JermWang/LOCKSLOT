"use client"

import { useState, useMemo } from "react"
import { useWallet } from "@/lib/wallet-context"
import { useGameStore } from "@/lib/game-store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Gift, Wallet, Clock, CheckCircle } from "lucide-react"
import { formatTokenAmountFromBase } from "@/lib/token-utils"

export default function ClaimsPage() {
  const { connected, connect } = useWallet()
  const { locks, claimLock } = useGameStore()
  const [claimingId, setClaimingId] = useState<string | null>(null)
  const [claimingAll, setClaimingAll] = useState(false)

  const { claimableLocks, claimedLocks, totalClaimable } = useMemo(() => {
    const getPayout = (lock: { amount: number; feeAmount?: number; bonusAmount?: number }) => {
      const principal = Math.max(0, lock.amount - (lock.feeAmount ?? 0))
      const bonus = lock.bonusAmount ?? 0
      return principal + bonus
    }

    const claimable = locks
      .filter((lock) => lock.status === "unlocked")
      .sort((a, b) => b.endTime.getTime() - a.endTime.getTime())
    const claimed = locks
      .filter((lock) => lock.status === "claimed")
      .sort((a, b) => b.endTime.getTime() - a.endTime.getTime())

    return {
      claimableLocks: claimable,
      claimedLocks: claimed,
      totalClaimable: claimable.reduce((acc, lock) => acc + getPayout(lock), 0),
    }
  }, [locks])

  const handleClaim = async (spinId: string) => {
    setClaimingId(spinId)
    try {
      await claimLock(spinId)
    } finally {
      setClaimingId(null)
    }
  }

  const handleClaimAll = async () => {
    if (!claimableLocks.length) return
    setClaimingAll(true)
    try {
      for (const lock of claimableLocks) {
        await claimLock(lock.id)
      }
    } finally {
      setClaimingAll(false)
    }
  }

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
                  {formatTokenAmountFromBase(totalClaimable)} <span className="text-xl">$LOCK</span>
                </div>
              </div>
            </div>
            <Button className="glow-primary" disabled={totalClaimable === 0 || claimingAll} onClick={handleClaimAll}>
              {claimingAll ? "Claiming..." : "Claim All"}
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
          {claimableLocks.length > 0 ? (
            <div className="space-y-3">
              {claimableLocks.map((lock) => (
                <div
                  key={lock.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Epoch </span>
                      <span className="font-mono text-primary">#{lock.epochNumber ?? "—"}</span>
                    </div>
                    <Badge variant="outline" className="border-primary text-primary">
                      Claimable
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-primary">
                      {formatTokenAmountFromBase(Math.max(0, lock.amount - (lock.feeAmount ?? 0)) + (lock.bonusAmount ?? 0))} $LOCK
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-primary text-primary hover:bg-primary hover:text-primary-foreground bg-transparent"
                      onClick={() => handleClaim(lock.id)}
                      disabled={claimingAll || claimingId === lock.id}
                    >
                      {claimingId === lock.id ? "Claiming..." : "Claim"}
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
          {claimedLocks.length > 0 ? (
            <div className="space-y-3">
              {claimedLocks.map((lock) => (
                <div
                  key={lock.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-4 opacity-60"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Epoch </span>
                      <span className="font-mono">#{lock.epochNumber ?? "—"}</span>
                    </div>
                    <Badge variant="secondary">Claimed</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground">{lock.endTime.toLocaleString()}</span>
                    <span className="font-mono">
                      {formatTokenAmountFromBase(Math.max(0, lock.amount - (lock.feeAmount ?? 0)) + (lock.bonusAmount ?? 0))} $LOCK
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No claims yet
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
