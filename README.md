<p align="center">
  <img src="https://img.shields.io/badge/Solana-Mainnet-9945FF?style=for-the-badge&logo=solana&logoColor=white" alt="Solana Mainnet" />
  <img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/Vercel-Deployed-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel" />
</p>

<p align="center">
  <img src="public/LOCK-SLOT-BANNER-optimized.gif" alt="LOCK SLOT banner" />
</p>

<h1 align="center">🎰 LOCK SLOT</h1>

<p align="center">
  <strong>A provably-fair, pari-mutuel staking slot machine on Solana</strong>
</p>

<p align="center">
  <a href="https://www.lockslot.xyz">Live Demo</a> •
  <a href="#features">Features</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#deployment">Deployment</a> •
  <a href="#contributing">Contributing</a>
</p>

---

## 🎲 What is LOCK SLOT?

LOCK SLOT is a **provably-fair gambling platform** where players lock tokens for random durations and multipliers. Long locks are "bricks" (bad), short locks are "legendary" (good). Losers directly fund winners through a shared reward pool.

**Key Principles:**
- 🔒 **Pari-mutuel system** — The house never pays out more than it collects
- 🎯 **Provably fair RNG** — All outcomes are verifiable and auditable
- 💰 **Zero inflation** — Rewards are funded exclusively by player fees
- 🔐 **Principal protection** — Your stake is always returned after unlock

## ✨ Features

- **Wallet Integration** — Seamless Solana wallet connection (Phantom, Solflare, etc.)
- **Provably Fair** — Commit-reveal scheme with server seed hashing
- **Real-time Updates** — Live reward pool, leaderboards, and spin history
- **Epoch System** — Weekly game cycles with bonus distributions
- **Beautiful UI** — Modern, responsive design with Tailwind CSS & Framer Motion
- **Rate Limiting** — Upstash Redis-powered protection against abuse
- **Type-Safe** — Full TypeScript coverage with Zod validation

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│  Next.js 16 • React 19 • TailwindCSS • Framer Motion        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Routes                              │
│  /api/spin • /api/deposit • /api/withdraw • /api/claim      │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
┌─────────────────┐  ┌─────────────┐  ┌─────────────────┐
│    Supabase     │  │   Solana    │  │     Upstash     │
│   PostgreSQL    │  │  Blockchain │  │      Redis      │
│   + RLS + RPC   │  │   Web3.js   │  │   Rate Limit    │
└─────────────────┘  └─────────────┘  └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ 
- **pnpm** (recommended) or npm/yarn
- **Supabase** account
- **Solana wallet** with SOL for transactions

### 1. Clone the Repository

```bash
git clone https://github.com/JermWang/LOCKSLOT.git
cd LOCKSLOT
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Solana
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta

# Escrow (CRITICAL - keep secure)
ESCROW_WALLET_PRIVATE_KEY=your-base58-private-key
NEXT_PUBLIC_TOKEN_MINT=your-spl-token-mint

# Game Config
NEXT_PUBLIC_FEE_BPS=500
NEXT_PUBLIC_MIN_STAKE=1000000
NEXT_PUBLIC_MAX_STAKE=1000000000000
```

### 4. Set Up Database

Run the schema in your Supabase SQL editor:

```bash
# Located at: supabase/schema.sql
```

### 5. Start Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## 📦 Project Structure

```
├── app/                    # Next.js App Router
│   ├── api/               # API routes (spin, deposit, withdraw, etc.)
│   ├── board/             # Leaderboard page
│   ├── claims/            # Claim management
│   ├── provably-fair/     # Fairness verification
│   └── page.tsx           # Main game interface
├── components/            # React components
│   ├── ui/               # shadcn/ui primitives
│   └── ...               # Feature components
├── lib/                   # Utilities & helpers
│   ├── supabase.ts       # Database client
│   ├── auth-server.ts    # Authentication
│   └── api-guard.ts      # Rate limiting & maintenance
├── supabase/             # Database schema & migrations
└── docs/                 # Technical documentation
```

## 🎮 Game Mechanics

### Tier System

| Tier | Probability | Lock Duration | Multiplier | Bonus Eligible |
|------|-------------|---------------|------------|----------------|
| 🧱 Brick | ~45% | 36-48 hours | 1.2-2.0× | ❌ |
| 🔵 Mid | ~28% | 18-36 hours | 1.8-3.5× | ❌ |
| 🔥 Hot | ~15% | 8-18 hours | 3.0-7.0× | ❌ |
| ⭐ Legendary | ~9% | 3-8 hours | 5.0-8.0× | ✅ |
| 💎 Mythic | ~3% | 1-3 hours | 8.0-15.0× | ✅ |

### Provably Fair RNG

```
hash = SHA256(serverSeed + ":" + clientSeed + ":" + nonce)
roll = parseInt(hash.slice(0, 8), 16) / 0xFFFFFFFF
```

- **Server Seed** — Committed (hashed) before epoch starts, revealed after
- **Client Seed** — User-provided randomness per spin
- **Nonce** — Auto-incrementing counter per user per epoch

## 🌐 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables
4. Deploy

### Environment Variables for Production

Ensure these are set in your hosting platform:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `NEXT_PUBLIC_SOLANA_RPC_URL` | Solana RPC endpoint |
| `ESCROW_WALLET_PRIVATE_KEY` | Escrow wallet private key |
| `NEXT_PUBLIC_TOKEN_MINT` | SPL token mint address |
| `CRON_SECRET` | Secret for cron job authentication |

## 🛠️ Available Scripts

```bash
pnpm dev              # Start development server
pnpm build            # Build for production
pnpm start            # Start production server
pnpm lint             # Run ESLint
pnpm typecheck        # Run TypeScript checks
```

## 🔒 Security Considerations

- **Never commit `.env.local`** — Contains sensitive keys
- **Use premium RPC** — Public endpoints have rate limits
- **Secure escrow key** — Controls all user funds
- **Enable RLS** — Row Level Security on all Supabase tables
- **Rate limiting** — Configured via Upstash Redis

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow existing code style
- Add TypeScript types for new code
- Test thoroughly before submitting PR
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

LOCK SLOT is a gambling platform. Users must be of legal gambling age in their jurisdiction. This software is provided "as is" without warranty. **Gamble responsibly.** The developers are not responsible for any financial losses incurred while using this platform.

---

<p align="center">
  Built with 💜 on Solana
</p>

<p align="center">
  <a href="https://www.lockslot.xyz">lockslot.xyz</a>
</p>
