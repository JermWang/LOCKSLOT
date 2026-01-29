"use client"

import { Shield, Lock, ExternalLink, Heart, Github, Twitter } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="mt-auto border-t border-border bg-card/50 backdrop-blur-sm">
      {/* Main footer content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand & Description */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <Image src="/logo.png" alt="Lock Slot" width={40} height={40} className="rounded-lg" />
              <span className="font-bold text-lg">LOCK SLOT</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Provably fair, pari-mutuel staking slot machine on Solana. 
              Your principal is always returned.
            </p>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider mb-3 text-foreground">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/terms" className="text-muted-foreground hover:text-primary transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-muted-foreground hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/disclaimer" className="text-muted-foreground hover:text-primary transition-colors">
                  Risk Disclaimer
                </Link>
              </li>
            </ul>
          </div>

          {/* Provably Fair */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider mb-3 text-foreground">Verification</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/provably-fair" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5" />
                  Provably Fair
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5" />
                  How It Works
                </Link>
              </li>
              <li>
                <a 
                  href="https://github.com/JermWang/LOCKSLOT" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5"
                >
                  <Github className="h-3.5 w-3.5" />
                  GitHub Repo
                </a>
              </li>
              <li>
                <a
                  href="https://twitter.com/LockSlotSolana"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5"
                >
                  <Twitter className="h-3.5 w-3.5" />
                  @LockSlotSolana
                </a>
              </li>
            </ul>
          </div>

          {/* Responsible Gambling */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider mb-3 text-foreground">Responsible Play</h4>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              Gambling can be addictive. Play responsibly and only stake what you can afford to lose.
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="px-2 py-1 rounded bg-destructive/10 text-destructive font-medium">18+</span>
              <span>Adults Only</span>
            </div>
          </div>
        </div>

        {/* Trust badges */}
        <div className="mt-8 pt-6 border-t border-border">
          <div className="flex flex-wrap items-center justify-center gap-6 mb-6">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium text-primary">Provably Fair</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <Lock className="h-4 w-4 text-emerald-600" />
              <span className="text-xs font-medium text-emerald-600">Principal Protected</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20">
              <svg className="h-4 w-4 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" fill="none"/>
              </svg>
              <span className="text-xs font-medium text-blue-600">Solana Powered</span>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="text-center text-xs text-muted-foreground">
          <p className="flex items-center justify-center gap-1">
            © {currentYear} LOCK SLOT. All rights reserved. Built with 
            <Heart className="h-3 w-3 text-destructive inline" /> 
            on Solana.
          </p>
        </div>
      </div>
    </footer>
  )
}
