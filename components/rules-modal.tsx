"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

interface RulesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const TIER_INFO = [
  { name: "BRICK", probability: "55%", duration: "14-21d", multiplier: "1.2-2.0x", color: "text-orange-400", eligible: false },
  { name: "MID", probability: "30%", duration: "7-14d", multiplier: "1.8-3.5x", color: "text-yellow-400", eligible: false },
  { name: "HOT", probability: "12%", duration: "3-7d", multiplier: "3.0-7.0x", color: "text-orange-500", eligible: false },
  { name: "LEGENDARY", probability: "2.5%", duration: "1-3d", multiplier: "7.0-12x", color: "text-emerald-400", eligible: true },
  { name: "MYTHIC", probability: "0.5%", duration: "~1d", multiplier: "12-20x", color: "text-pink-400", eligible: true },
]

export function RulesModal({ open, onOpenChange }: RulesModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground">
            How LOCK SLOT Works
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="space-y-6">
            {/* Core Concept */}
            <section>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-primary">
                The Game
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                LOCK SLOT is a provably-fair, pari-mutuel game. When you spin, your tokens are 
                locked for a random duration with a random multiplier. Short locks are rare and 
                celebrated. Long locks are common and painful. Losers fund winners.
              </p>
            </section>

            {/* How It Works */}
            <section>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-primary">
                How Spins Work
              </h3>
              <ol className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-3">
                  <span className="font-mono text-primary">1.</span>
                  <span>Enter your stake amount and click SPIN & LOCK</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-mono text-primary">2.</span>
                  <span>A 5% fee is taken and added to the Reward Pool</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-mono text-primary">3.</span>
                  <span>Provably-fair RNG determines your tier, lock duration, and multiplier</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-mono text-primary">4.</span>
                  <span>Your principal is locked until the duration expires</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-mono text-primary">5.</span>
                  <span>On unlock, your principal is returned (always recoverable)</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-mono text-primary">6.</span>
                  <span>Only Legendary & Mythic outcomes receive bonus distributions</span>
                </li>
              </ol>
            </section>

            {/* Tier Table */}
            <section>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary">
                Outcome Tiers
              </h3>
              <div className="rounded-lg border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-secondary/30">
                      <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Tier</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">Odds</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">Lock</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">Multi</th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-muted-foreground">Bonus</th>
                    </tr>
                  </thead>
                  <tbody>
                    {TIER_INFO.map((tier) => (
                      <tr key={tier.name} className="border-b border-border/50 last:border-0">
                        <td className={cn("px-3 py-2 font-medium", tier.color)}>
                          {tier.name}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-muted-foreground">
                          {tier.probability}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-muted-foreground">
                          {tier.duration}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-muted-foreground">
                          {tier.multiplier}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {tier.eligible ? (
                            <span className="text-primary">Yes</span>
                          ) : (
                            <span className="text-muted-foreground/50">No</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Reward Pool */}
            <section>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-primary">
                Reward Pool & Bonuses
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                The Reward Pool is funded exclusively by player fees (5% of each stake). 
                At the end of each game period, the pool is distributed proportionally 
                among Legendary and Mythic winners based on their ticket score (stake x multiplier).
                If no winners occur, the pool rolls over.
              </p>
            </section>

            {/* Disclosures */}
            <section className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-destructive">
                Risk Disclosures
              </h3>
              <ul className="space-y-1 text-xs text-muted-foreground">
                <li>- This is a gambling game with random, uncertain outcomes</li>
                <li>- Expected value is negative for most players</li>
                <li>- Long lock durations represent real opportunity cost</li>
                <li>- Only ~3% of outcomes qualify for bonus distributions</li>
                <li>- Past outcomes do not influence future results</li>
                <li>- Play only what you can afford to lock</li>
              </ul>
            </section>

            {/* Tagline */}
            <div className="text-center py-2">
              <p className="text-xs text-muted-foreground italic">
                Pain funds glory. Play responsibly.
              </p>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
