"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"

interface VerificationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Mock verification data
const MOCK_GAME_DATA = {
  serverSeedHash: "0x8a7f3c2e9d1b6a4f5c8e7d2a9b3f6c1e4d7a2b5c8f1e4d7a2b5c8f1e4d7a2b5c",
  currentNonce: 1847,
  gameId: "GAME-2026-001",
}

export function VerificationModal({ open, onOpenChange }: VerificationModalProps) {
  const [clientSeed, setClientSeed] = useState("")
  const [nonce, setNonce] = useState("")
  const [verificationResult, setVerificationResult] = useState<null | {
    tier: string
    duration: number
    multiplier: number
    hash: string
  }>(null)

  const handleVerify = () => {
    // Mock verification - in production this would actually compute the hash
    if (clientSeed && nonce) {
      setVerificationResult({
        tier: "MID",
        duration: 12,
        multiplier: 2.4,
        hash: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`,
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground">
            Provably Fair Verification
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-2">
          <div className="space-y-6">
            {/* Explanation */}
            <section>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Every spin outcome is determined by combining a pre-committed server seed 
                (hashed before the game), your client seed, and an incrementing nonce. 
                This ensures outcomes cannot be manipulated by either party.
              </p>
            </section>

            {/* Current Game Info */}
            <section className="rounded-lg border border-border bg-secondary/30 p-4">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Current Game
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Game ID:</span>
                  <span className="font-mono text-foreground">{MOCK_GAME_DATA.gameId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current Nonce:</span>
                  <span className="font-mono text-foreground">{MOCK_GAME_DATA.currentNonce}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground">Server Seed Hash:</span>
                  <span className="font-mono text-xs text-foreground break-all bg-background/50 p-2 rounded">
                    {MOCK_GAME_DATA.serverSeedHash}
                  </span>
                </div>
              </div>
            </section>

            {/* RNG Formula */}
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                RNG Formula
              </h3>
              <div className="rounded-lg bg-background/50 p-3 font-mono text-xs text-muted-foreground">
                <code>
                  hash = SHA256(serverSeed || clientSeed || nonce)
                  <br />
                  u = hash_to_float(hash) // u in (0, 1)
                  <br />
                  outcome = map_to_tier(u)
                </code>
              </div>
            </section>

            {/* Verification Form */}
            <section>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Verify a Spin
              </h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="clientSeed" className="text-xs text-muted-foreground">
                    Client Seed
                  </Label>
                  <Input
                    id="clientSeed"
                    value={clientSeed}
                    onChange={(e) => setClientSeed(e.target.value)}
                    placeholder="Enter your client seed"
                    className="mt-1 font-mono text-sm bg-secondary/50"
                  />
                </div>
                <div>
                  <Label htmlFor="nonce" className="text-xs text-muted-foreground">
                    Nonce
                  </Label>
                  <Input
                    id="nonce"
                    type="number"
                    value={nonce}
                    onChange={(e) => setNonce(e.target.value)}
                    placeholder="Enter the spin nonce"
                    className="mt-1 font-mono text-sm bg-secondary/50"
                  />
                </div>
                <Button
                  onClick={handleVerify}
                  disabled={!clientSeed || !nonce}
                  className="w-full"
                >
                  Verify Outcome
                </Button>
              </div>
            </section>

            {/* Verification Result */}
            {verificationResult && (
              <section className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-primary">
                  Verification Result
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tier:</span>
                    <span className="font-medium text-foreground">{verificationResult.tier}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duration:</span>
                    <span className="font-mono text-foreground">{verificationResult.duration}d</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Multiplier:</span>
                    <span className="font-mono text-foreground">{verificationResult.multiplier}x</span>
                  </div>
                  <div className="flex flex-col gap-1 mt-2">
                    <span className="text-muted-foreground">Result Hash:</span>
                    <span className="font-mono text-[10px] text-foreground break-all bg-background/50 p-2 rounded">
                      {verificationResult.hash}
                    </span>
                  </div>
                </div>
              </section>
            )}

            {/* Note */}
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground/60">
                Server seed is revealed after each game period ends.
                <br />
                All historical outcomes can be independently verified.
              </p>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
