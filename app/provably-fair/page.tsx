"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import Image from "next/image"
import Link from "next/link"
import { 
  Shield, 
  Hash, 
  Lock,
  Eye,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  Code,
  FileCode,
  Shuffle,
  KeyRound,
  Binary,
  Fingerprint,
  GitBranch,
  ExternalLink,
  Copy,
  Check
} from "lucide-react"
import { motion } from "framer-motion"

export default function ProvablyFairPage() {
  const [copied, setCopied] = useState<string | null>(null)

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Hero Section */}
      <div className="mb-12 text-center">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-[#00d4aa]/20 blur-3xl rounded-full" />
            <div className="relative p-4 rounded-2xl bg-[#0a1628] border border-[#1a3a4a]">
              <Shield className="h-16 w-16 text-[#00d4aa]" />
            </div>
          </div>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-[#00d4aa] via-[#00b4d8] to-[#00d4aa] bg-clip-text text-transparent">
          Provably Fair
        </h1>
        <p className="text-lg text-[#6b8a9a] max-w-2xl mx-auto">
          Every spin on Lock Slot is cryptographically verifiable. 
          You can independently verify that outcomes are fair and unmanipulated.
        </p>
      </div>

      {/* Trust Badges */}
      <div className="flex flex-wrap justify-center gap-4 mb-12">
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#00d4aa]/10 border border-[#00d4aa]/30">
          <CheckCircle2 className="h-4 w-4 text-[#00d4aa]" />
          <span className="text-sm font-medium text-[#00d4aa]">SHA-256 Hashing</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#00b4d8]/10 border border-[#00b4d8]/30">
          <Lock className="h-4 w-4 text-[#00b4d8]" />
          <span className="text-sm font-medium text-[#00b4d8]">Commit-Reveal Scheme</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-pink-400/10 border border-pink-400/30">
          <Eye className="h-4 w-4 text-pink-400" />
          <span className="text-sm font-medium text-pink-400">Open Source</span>
        </div>
      </div>

      {/* What is Provably Fair */}
      <section className="mb-12">
        <Card className="cyber-panel border-[#1a3a4a]">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-[#e8f4f8]">
              <div className="p-2 rounded-lg bg-[#00d4aa]/20">
                <Shield className="h-5 w-5 text-[#00d4aa]" />
              </div>
              What Does Provably Fair Mean?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-[#a8c5d6]">
            <p>
              <span className="text-[#00d4aa] font-semibold">Provably fair</span> means you can mathematically verify 
              that every spin outcome was determined fairly, without any possibility of manipulation by us or anyone else.
            </p>
            <p>
              Unlike traditional casinos where you must trust the house, Lock Slot uses cryptographic techniques 
              that allow you to independently verify every single spin result after the fact.
            </p>
            <div className="grid md:grid-cols-3 gap-4 mt-6">
              <div className="p-4 rounded-lg bg-[#0a1628] border border-[#1a3a4a]">
                <KeyRound className="h-8 w-8 text-[#00d4aa] mb-3" />
                <h4 className="font-semibold text-[#e8f4f8] mb-2">Server Seed</h4>
                <p className="text-sm text-[#6b8a9a]">
                  We generate a secret seed before each epoch and publish its hash as a commitment.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-[#0a1628] border border-[#1a3a4a]">
                <Fingerprint className="h-8 w-8 text-[#00b4d8] mb-3" />
                <h4 className="font-semibold text-[#e8f4f8] mb-2">Client Seed</h4>
                <p className="text-sm text-[#6b8a9a]">
                  You provide your own random seed, ensuring we cannot predict or manipulate your outcome.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-[#0a1628] border border-[#1a3a4a]">
                <Binary className="h-8 w-8 text-pink-400 mb-3" />
                <h4 className="font-semibold text-[#e8f4f8] mb-2">Combined Hash</h4>
                <p className="text-sm text-[#6b8a9a]">
                  Both seeds combine with a nonce to create a deterministic, verifiable outcome.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* How It Works - Step by Step */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-[#e8f4f8] mb-6 flex items-center gap-3">
          <RefreshCw className="h-6 w-6 text-[#00d4aa]" />
          How It Works
        </h2>
        
        <div className="space-y-4">
          {/* Step 1 */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="cyber-panel p-6"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#00d4aa]/20 flex items-center justify-center text-[#00d4aa] font-bold">
                1
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-[#e8f4f8] mb-2">Epoch Begins - Server Commits</h3>
                <p className="text-[#a8c5d6] mb-3">
                  At the start of each epoch (21-day period), we generate a random <code className="px-1.5 py-0.5 rounded bg-[#1a3a4a] text-[#00d4aa] text-sm">serverSeed</code> and 
                  publish its SHA-256 hash. This hash is our <span className="text-[#00d4aa]">commitment</span> - we cannot change the seed without changing the hash.
                </p>
                <div className="p-3 rounded-lg bg-[#0a1628] border border-[#1a3a4a] font-mono text-sm">
                  <div className="text-[#6b8a9a] mb-1">// Server seed hash (published before epoch)</div>
                  <div className="text-[#00d4aa]">serverSeedHash = SHA256(serverSeed)</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Step 2 */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="cyber-panel p-6"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#00b4d8]/20 flex items-center justify-center text-[#00b4d8] font-bold">
                2
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-[#e8f4f8] mb-2">You Spin - Client Seed Generated</h3>
                <p className="text-[#a8c5d6] mb-3">
                  When you spin, your browser generates a random <code className="px-1.5 py-0.5 rounded bg-[#1a3a4a] text-[#00b4d8] text-sm">clientSeed</code>. 
                  This seed is sent to our server along with your spin request. Since you generate this seed, we cannot have predicted it in advance.
                </p>
                <div className="p-3 rounded-lg bg-[#0a1628] border border-[#1a3a4a] font-mono text-sm">
                  <div className="text-[#6b8a9a] mb-1">// Client seed (generated by your browser)</div>
                  <div className="text-[#00b4d8]">clientSeed = randomBytes(16).toHex()</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Step 3 */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="cyber-panel p-6"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-pink-400/20 flex items-center justify-center text-pink-400 font-bold">
                3
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-[#e8f4f8] mb-2">Outcome Calculated Deterministically</h3>
                <p className="text-[#a8c5d6] mb-3">
                  The server combines both seeds with your spin number (nonce) using SHA-256 hashing. 
                  The resulting hash deterministically determines your tier, lock duration, and multiplier.
                </p>
                <div className="p-3 rounded-lg bg-[#0a1628] border border-[#1a3a4a] font-mono text-sm space-y-1">
                  <div className="text-[#6b8a9a]">// Combined hash calculation</div>
                  <div className="text-pink-400">combinedHash = SHA256(serverSeed + clientSeed + nonce)</div>
                  <div className="text-[#6b8a9a] mt-2">// First 8 hex chars → roll value (0-1)</div>
                  <div className="text-[#e8f4f8]">rollValue = parseInt(hash.slice(0,8), 16) / 0x100000000</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Step 4 */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="cyber-panel p-6"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-400/20 flex items-center justify-center text-emerald-400 font-bold">
                4
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-[#e8f4f8] mb-2">Epoch Ends - Server Seed Revealed</h3>
                <p className="text-[#a8c5d6] mb-3">
                  When the epoch ends, we reveal the original <code className="px-1.5 py-0.5 rounded bg-[#1a3a4a] text-emerald-400 text-sm">serverSeed</code>. 
                  You can now hash it yourself and verify it matches the commitment we published at the start.
                  Then you can recalculate any spin result independently.
                </p>
                <div className="p-3 rounded-lg bg-[#0a1628] border border-[#1a3a4a] font-mono text-sm">
                  <div className="text-[#6b8a9a] mb-1">// Verification</div>
                  <div className="text-emerald-400">SHA256(revealedServerSeed) === publishedHash // Must be true!</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Tier Probability Table */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-[#e8f4f8] mb-6 flex items-center gap-3">
          <Shuffle className="h-6 w-6 text-[#00d4aa]" />
          Outcome Probabilities
        </h2>
        <Card className="cyber-panel border-[#1a3a4a] overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#1a3a4a] bg-[#0a1628]">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-[#6b8a9a]">Tier</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-[#6b8a9a]">Roll Range</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-[#6b8a9a]">Probability</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-[#6b8a9a]">Lock Duration</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-[#6b8a9a]">Bonus Eligible</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-[#1a3a4a]/50">
                    <td className="px-4 py-3 font-semibold text-yellow-400">BRICK</td>
                    <td className="px-4 py-3 text-center font-mono text-sm text-[#a8c5d6]">0.00 - 0.45</td>
                    <td className="px-4 py-3 text-center font-mono text-[#e8f4f8]">45%</td>
                    <td className="px-4 py-3 text-center font-mono text-[#a8c5d6]">36-48 hours</td>
                    <td className="px-4 py-3 text-center text-[#6b8a9a]">No</td>
                  </tr>
                  <tr className="border-b border-[#1a3a4a]/50">
                    <td className="px-4 py-3 font-semibold text-orange-400">MID</td>
                    <td className="px-4 py-3 text-center font-mono text-sm text-[#a8c5d6]">0.45 - 0.73</td>
                    <td className="px-4 py-3 text-center font-mono text-[#e8f4f8]">28%</td>
                    <td className="px-4 py-3 text-center font-mono text-[#a8c5d6]">18-36 hours</td>
                    <td className="px-4 py-3 text-center text-[#6b8a9a]">No</td>
                  </tr>
                  <tr className="border-b border-[#1a3a4a]/50">
                    <td className="px-4 py-3 font-semibold text-red-400">HOT</td>
                    <td className="px-4 py-3 text-center font-mono text-sm text-[#a8c5d6]">0.73 - 0.88</td>
                    <td className="px-4 py-3 text-center font-mono text-[#e8f4f8]">15%</td>
                    <td className="px-4 py-3 text-center font-mono text-[#a8c5d6]">8-18 hours</td>
                    <td className="px-4 py-3 text-center text-[#6b8a9a]">No</td>
                  </tr>
                  <tr className="border-b border-[#1a3a4a]/50 bg-cyan-400/5">
                    <td className="px-4 py-3 font-semibold text-cyan-400">LEGENDARY</td>
                    <td className="px-4 py-3 text-center font-mono text-sm text-[#a8c5d6]">0.88 - 0.97</td>
                    <td className="px-4 py-3 text-center font-mono text-[#e8f4f8]">9%</td>
                    <td className="px-4 py-3 text-center font-mono text-[#a8c5d6]">3-8 hours</td>
                    <td className="px-4 py-3 text-center text-[#00d4aa]">✓ Yes</td>
                  </tr>
                  <tr className="bg-pink-400/5">
                    <td className="px-4 py-3 font-semibold text-pink-400">MYTHIC</td>
                    <td className="px-4 py-3 text-center font-mono text-sm text-[#a8c5d6]">0.97 - 1.00</td>
                    <td className="px-4 py-3 text-center font-mono text-[#e8f4f8]">3%</td>
                    <td className="px-4 py-3 text-center font-mono text-[#a8c5d6]">1-3 hours</td>
                    <td className="px-4 py-3 text-center text-[#00d4aa]">✓ Yes</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        <p className="text-sm text-[#6b8a9a] mt-4 text-center">
          Win rate (Legendary + Mythic): <span className="text-[#00d4aa] font-semibold">12%</span> of all spins
        </p>
      </section>

      {/* Verification Algorithm */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-[#e8f4f8] mb-6 flex items-center gap-3">
          <Code className="h-6 w-6 text-[#00d4aa]" />
          Verification Code
        </h2>
        <Card className="cyber-panel border-[#1a3a4a]">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-[#e8f4f8]">
              <span className="flex items-center gap-2">
                <FileCode className="h-5 w-5 text-[#00b4d8]" />
                JavaScript Verification
              </span>
              <button
                onClick={() => copyToClipboard(verificationCode, 'code')}
                className="p-2 rounded-lg hover:bg-[#1a3a4a] transition-colors"
              >
                {copied === 'code' ? (
                  <Check className="h-4 w-4 text-[#00d4aa]" />
                ) : (
                  <Copy className="h-4 w-4 text-[#6b8a9a]" />
                )}
              </button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="p-4 rounded-lg bg-[#0a1628] border border-[#1a3a4a] overflow-x-auto text-sm">
              <code className="text-[#a8c5d6]">{verificationCode}</code>
            </pre>
          </CardContent>
        </Card>
      </section>

      {/* Open Source */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-[#e8f4f8] mb-6 flex items-center gap-3">
          <GitBranch className="h-6 w-6 text-[#00d4aa]" />
          Open Source
        </h2>
        <Card className="cyber-panel border-[#1a3a4a]">
          <CardContent className="p-6">
            <p className="text-[#a8c5d6] mb-4">
              Lock Slot is fully open source. You can audit our RNG implementation, smart contracts, 
              and verification logic yourself. We have nothing to hide.
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href="https://github.com/JermWang/LOCKSLOT"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0a1628] border border-[#1a3a4a] hover:border-[#00d4aa]/50 transition-colors text-[#e8f4f8]"
              >
                <GitBranch className="h-4 w-4" />
                View on GitHub
                <ExternalLink className="h-3 w-3 text-[#6b8a9a]" />
              </a>
              <Link
                href="/docs"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#00d4aa]/10 border border-[#00d4aa]/30 hover:bg-[#00d4aa]/20 transition-colors text-[#00d4aa]"
              >
                Read Full Documentation
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* FAQ */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-[#e8f4f8] mb-6">Frequently Asked Questions</h2>
        <div className="space-y-4">
          <Card className="cyber-panel border-[#1a3a4a]">
            <CardContent className="p-6">
              <h3 className="font-semibold text-[#e8f4f8] mb-2">Can you manipulate my spin results?</h3>
              <p className="text-[#a8c5d6]">
                No. Because we commit to the server seed hash before you spin, and you provide your own client seed, 
                neither party can manipulate the outcome. The result is determined by both inputs combined.
              </p>
            </CardContent>
          </Card>
          <Card className="cyber-panel border-[#1a3a4a]">
            <CardContent className="p-6">
              <h3 className="font-semibold text-[#e8f4f8] mb-2">When can I verify my spins?</h3>
              <p className="text-[#a8c5d6]">
                You can verify all your spins after the epoch ends, when we reveal the server seed. 
                This delay is necessary to prevent you from finding favorable client seeds in advance.
              </p>
            </CardContent>
          </Card>
          <Card className="cyber-panel border-[#1a3a4a]">
            <CardContent className="p-6">
              <h3 className="font-semibold text-[#e8f4f8] mb-2">What if the revealed seed doesn&apos;t match the hash?</h3>
              <p className="text-[#a8c5d6]">
                If SHA256(revealedSeed) does not equal the published hash, it would prove we cheated. 
                This has never happened and never will - it would destroy all trust in our platform instantly.
              </p>
            </CardContent>
          </Card>
          <Card className="cyber-panel border-[#1a3a4a]">
            <CardContent className="p-6">
              <h3 className="font-semibold text-[#e8f4f8] mb-2">Why use SHA-256?</h3>
              <p className="text-[#a8c5d6]">
                SHA-256 is a cryptographic hash function used by Bitcoin and countless security systems worldwide. 
                It is computationally infeasible to reverse (find the input from output) or find collisions (two inputs with same output).
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Back to Game */}
      <div className="text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#00d4aa] to-[#00b4d8] text-[#0a1628] font-bold hover:opacity-90 transition-opacity"
        >
          <Shuffle className="h-5 w-5" />
          Start Playing
        </Link>
      </div>
    </div>
  )
}

const verificationCode = `// Verify a Lock Slot spin result
const crypto = require('crypto');

function verifySpin(serverSeed, clientSeed, nonce) {
  // Step 1: Generate combined hash
  const combined = \`\${serverSeed}:\${clientSeed}:\${nonce}\`;
  const hash = crypto.createHash('sha256').update(combined).digest('hex');
  
  // Step 2: Convert first 8 hex chars to roll value (0-1)
  const rollValue = parseInt(hash.substring(0, 8), 16) / 0x100000000;
  
  // Step 3: Determine tier from roll value
  const tiers = [
    { name: 'brick', threshold: 0.45 },
    { name: 'mid', threshold: 0.73 },
    { name: 'hot', threshold: 0.88 },
    { name: 'legendary', threshold: 0.97 },
    { name: 'mythic', threshold: 1.00 }
  ];
  
  let tier = 'brick';
  for (const t of tiers) {
    if (rollValue < t.threshold) {
      tier = t.name;
      break;
    }
  }
  
  return { hash, rollValue, tier };
}

// Verify server seed commitment
function verifyServerSeed(revealedSeed, publishedHash) {
  const calculatedHash = crypto.createHash('sha256')
    .update(revealedSeed)
    .digest('hex');
  return calculatedHash === publishedHash;
}

// Example usage:
const result = verifySpin(
  'your_server_seed_here',
  'your_client_seed_here',
  1  // your spin nonce
);
console.log(result);`
