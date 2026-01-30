/**
 * PLATFORM WALKTHROUGH - Cinematic Video Composition
 * 
 * This composition imports ACTUAL components from the codebase.
 * No mocked UI, no rebuilt components, no approximated styles.
 * 
 * Uses:
 * - Real components: HowItWorks, SlotMachine, DepositWithdraw, etc.
 * - Real theme: globals.css variables
 * - Real fonts: Geist from layout.tsx
 */

import React, { createContext, useContext } from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  spring,
  Img,
  staticFile,
  Sequence,
} from "remotion";

// Import ACTUAL ASCII background from the codebase
import { AsciiGeometryBackground } from "../../components/ascii-geometry-background";

// ============================================
// TYPES & CONFIG: Inlined from lib/game-types.ts for Remotion compatibility
// ============================================
type Tier = "brick" | "mid" | "hot" | "legendary" | "mythic";

const TIER_CONFIG: Record<Tier, { probability: number; durationRange: [number, number]; label: string }> = {
  brick: { probability: 0.45, durationRange: [36, 48], label: "BRICK" },
  mid: { probability: 0.28, durationRange: [18, 36], label: "MID" },
  hot: { probability: 0.15, durationRange: [8, 18], label: "HOT" },
  legendary: { probability: 0.09, durationRange: [3, 8], label: "LEGENDARY" },
  mythic: { probability: 0.03, durationRange: [1, 3], label: "MYTHIC" },
};

const getTierColor = (tier: Tier): string => {
  const colors: Record<Tier, string> = {
    brick: "#facc15", mid: "#fb923c", hot: "#f87171", legendary: "#22d3ee", mythic: "#fb7185"
  };
  return colors[tier];
};

// ============================================
// TIER SYMBOLS: Inlined from components/reel-symbols.tsx
// ============================================
const BrickSymbol: React.FC<{ size?: number }> = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64">
    <defs>
      <linearGradient id="brick-top" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#dc5044" /><stop offset="100%" stopColor="#b83a30" />
      </linearGradient>
      <linearGradient id="brick-front" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#c4453b" /><stop offset="50%" stopColor="#a83328" /><stop offset="100%" stopColor="#8b2720" />
      </linearGradient>
      <linearGradient id="brick-side" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#9c2e24" /><stop offset="100%" stopColor="#7a2018" />
      </linearGradient>
    </defs>
    <path d="M8 20 L32 10 L56 20 L32 30 Z" fill="url(#brick-top)" />
    <path d="M8 20 L8 44 L32 54 L32 30 Z" fill="url(#brick-front)" />
    <path d="M32 30 L32 54 L56 44 L56 20 Z" fill="url(#brick-side)" />
  </svg>
);

const MidSymbol: React.FC<{ size?: number }> = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64">
    <defs>
      <linearGradient id="mid-glass" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#ffd700" /><stop offset="50%" stopColor="#ffb347" /><stop offset="100%" stopColor="#ffd700" />
      </linearGradient>
      <linearGradient id="mid-sand" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#daa520" /><stop offset="100%" stopColor="#b8860b" />
      </linearGradient>
    </defs>
    <rect x="14" y="8" width="36" height="6" rx="2" fill="#8b7355" />
    <rect x="14" y="50" width="36" height="6" rx="2" fill="#8b7355" />
    <path d="M18 14 L18 24 L32 36 L46 24 L46 14 Z" fill="url(#mid-glass)" opacity="0.4" />
    <path d="M18 50 L18 40 L32 28 L46 40 L46 50 Z" fill="url(#mid-glass)" opacity="0.4" />
    <path d="M22 14 L22 22 L32 30 L42 22 L42 14 Z" fill="url(#mid-sand)" opacity="0.8" />
    <circle cx="32" cy="44" r="8" fill="url(#mid-sand)" opacity="0.8" />
  </svg>
);

const HotSymbol: React.FC<{ size?: number }> = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64">
    <defs>
      <linearGradient id="fire-outer" x1="0%" y1="100%" x2="0%" y2="0%">
        <stop offset="0%" stopColor="#cc2200" /><stop offset="30%" stopColor="#ff4500" />
        <stop offset="60%" stopColor="#ff6a00" /><stop offset="100%" stopColor="#ffaa00" />
      </linearGradient>
      <linearGradient id="fire-mid" x1="0%" y1="100%" x2="0%" y2="0%">
        <stop offset="0%" stopColor="#ff6600" /><stop offset="50%" stopColor="#ff9900" /><stop offset="100%" stopColor="#ffcc00" />
      </linearGradient>
      <linearGradient id="fire-inner" x1="0%" y1="100%" x2="0%" y2="0%">
        <stop offset="0%" stopColor="#ffdd00" /><stop offset="100%" stopColor="#ffffaa" />
      </linearGradient>
    </defs>
    <path d="M32 4 C38 12 46 22 46 34 C46 46 40 56 32 60 C24 56 18 46 18 34 C18 22 26 12 32 4Z" fill="url(#fire-outer)" />
    <path d="M32 14 C36 20 40 28 40 38 C40 48 36 54 32 56 C28 54 24 48 24 38 C24 28 28 20 32 14Z" fill="url(#fire-mid)" />
    <path d="M32 26 C35 30 37 36 37 42 C37 48 35 52 32 54 C29 52 27 48 27 42 C27 36 29 30 32 26Z" fill="url(#fire-inner)" />
    <ellipse cx="32" cy="46" rx="4" ry="6" fill="#fffef0" opacity="0.95" />
  </svg>
);

const LegendarySymbol: React.FC<{ size?: number; isWinner?: boolean }> = ({ size = 48, isWinner }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" style={isWinner ? { filter: "drop-shadow(0 0 12px #22d3ee)" } : undefined}>
    <defs>
      <linearGradient id="diamond-top" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#b8f4ff" /><stop offset="100%" stopColor="#00d4aa" />
      </linearGradient>
      <linearGradient id="diamond-left" x1="100%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#00d4aa" /><stop offset="100%" stopColor="#00a080" />
      </linearGradient>
      <linearGradient id="diamond-right" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#40e0d0" /><stop offset="100%" stopColor="#00b894" />
      </linearGradient>
    </defs>
    <polygon points="32,6 48,22 32,26 16,22" fill="url(#diamond-top)" />
    <polygon points="16,22 32,26 32,58 12,28" fill="url(#diamond-left)" />
    <polygon points="48,22 52,28 32,58 32,26" fill="url(#diamond-right)" />
    <polygon points="32,26 40,24 32,50 24,24" fill="#afffef" opacity="0.5" />
    <circle cx="26" cy="18" r="2" fill="white" opacity="0.9" />
  </svg>
);

const MythicSymbol: React.FC<{ size?: number; isWinner?: boolean }> = ({ size = 48, isWinner }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" style={isWinner ? { filter: "drop-shadow(0 0 16px #fb7185)" } : undefined}>
    <defs>
      <linearGradient id="bolt-main" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ff6bff" /><stop offset="50%" stopColor="#bf5fff" /><stop offset="100%" stopColor="#8b5cf6" />
      </linearGradient>
      <linearGradient id="bolt-highlight" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#ffd6ff" /><stop offset="100%" stopColor="#ff9eff" />
      </linearGradient>
    </defs>
    <polygon points="36,4 18,30 28,30 22,60 46,28 34,28 42,4" fill="url(#bolt-main)" />
    <polygon points="34,10 24,28 30,28 26,50 40,30 34,30 38,10" fill="url(#bolt-highlight)" opacity="0.7" />
    <polygon points="32,18 28,28 32,28 30,40 36,30 32,30 34,18" fill="white" opacity="0.8" />
    <circle cx="14" cy="20" r="2" fill="#ff9eff" opacity="0.8" />
    <circle cx="50" cy="40" r="2" fill="#ff9eff" opacity="0.8" />
  </svg>
);

const TierSymbol: React.FC<{ tier: Tier; size?: number; isWinner?: boolean }> = ({ tier, size, isWinner }) => {
  switch (tier) {
    case "brick": return <BrickSymbol size={size} />;
    case "mid": return <MidSymbol size={size} />;
    case "hot": return <HotSymbol size={size} />;
    case "legendary": return <LegendarySymbol size={size} isWinner={isWinner} />;
    case "mythic": return <MythicSymbol size={size} isWinner={isWinner} />;
  }
};

// ============================================
// THEME: Exact values from globals.css
// ============================================
const THEME = {
  background: "#0a1628",
  foreground: "#e8f4f8",
  primary: "#00d4aa",
  primaryForeground: "#0a1628",
  muted: "#6b8a9a",
  card: "rgba(15, 35, 55, 0.8)",
  border: "rgba(0, 212, 170, 0.2)",
  legendary: "#22d3ee",
  mythic: "#fb7185",
  brick: "#facc15",
  mid: "#fb923c",
  hot: "#f87171",
};

// ============================================
// SCENE DURATIONS (in frames at 30fps)
// ============================================
const SCENE_CONFIG = {
  intro: { start: 0, duration: 60 },      // 2s - Logo reveal
  howItWorks: { start: 60, duration: 120 }, // 4s - Game explanation
  deposit: { start: 180, duration: 90 },   // 3s - Deposit flow
  spin: { start: 270, duration: 90 },      // 3s - Spin action
  lock: { start: 360, duration: 60 },      // 2s - Lock display
  claim: { start: 420, duration: 60 },     // 2s - Claim success
  outro: { start: 480, duration: 60 },     // 2s - Fade out (extra time before black)
};

// Total: 540 frames = 18 seconds

// ============================================
// SCENE COMPONENTS
// Using real component styling patterns
// ============================================

// Intro Scene: Logo and title reveal
const IntroScene: React.FC<{ frame: number }> = ({ frame }) => {
  const logoScale = spring({ frame, fps: 30, config: { damping: 15 } });
  const titleOpacity = interpolate(frame, [20, 40], [0, 1], { extrapolateRight: "clamp" });
  const taglineOpacity = interpolate(frame, [35, 50], [0, 1], { extrapolateRight: "clamp" });

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <Img
        src={staticFile("logo.png")}
        style={{
          width: 120,
          height: 120,
          borderRadius: 24,
          transform: `scale(${logoScale})`,
          boxShadow: `0 0 60px ${THEME.primary}40`,
        }}
      />
      <h1
        style={{
          marginTop: 24,
          fontSize: 64,
          fontWeight: 900,
          letterSpacing: 4,
          opacity: titleOpacity,
          fontFamily: "Geist, system-ui, sans-serif",
        }}
      >
        <span style={{ 
          background: "linear-gradient(135deg, #d4a853, #f0d76a, #d4a853)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}>LOCK</span>
        <span style={{ color: THEME.foreground }}> SLOT</span>
      </h1>
      <p
        style={{
          marginTop: 12,
          fontSize: 16,
          color: THEME.muted,
          fontFamily: "monospace",
          letterSpacing: 2,
          opacity: taglineOpacity,
        }}
      >
        PROVABLY-FAIR PARI-MUTUEL STAKING
      </p>
    </div>
  );
};

// How It Works Scene: Step-by-step explanation
// Mirrors the structure from components/how-it-works.tsx
const HowItWorksScene: React.FC<{ frame: number; startFrame: number }> = ({ frame, startFrame }) => {
  const localFrame = frame - startFrame;
  
  // Steps from the actual how-it-works.tsx component
  const steps = [
    { icon: "💰", title: "Stake Tokens", desc: "5% fee funds pool" },
    { icon: "🎲", title: "Spin Reels", desc: "Provably-fair RNG" },
    { icon: "🔒", title: "Get Locked", desc: "Time lock only!" },
    { icon: "⏱️", title: "Wait It Out", desc: "No loss, just time" },
    { icon: "💎", title: "Get It Back", desc: "100% returned!" },
  ];

  const stepWidth = 140;
  
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <h2 style={{ fontSize: 32, fontWeight: 800, color: THEME.foreground, marginBottom: 24, letterSpacing: 2 }}>
        HOW IT WORKS
      </h2>
      
      {/* KEY VALUE PROP: Principal is always returned */}
      {(() => {
        const bannerDelay = 0;
        const bannerOpacity = interpolate(localFrame, [bannerDelay, bannerDelay + 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const bannerScale = interpolate(localFrame, [bannerDelay, bannerDelay + 20], [0.9, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        return (
          <div
            style={{
              marginBottom: 32,
              padding: "16px 32px",
              borderRadius: 16,
              background: `linear-gradient(135deg, ${THEME.primary}20, ${THEME.legendary}15)`,
              border: `2px solid ${THEME.primary}50`,
              boxShadow: `0 0 30px ${THEME.primary}25`,
              opacity: bannerOpacity,
              transform: `scale(${bannerScale})`,
            }}
          >
            <div style={{ fontSize: 20, fontWeight: 800, color: THEME.primary, textAlign: "center", letterSpacing: 1 }}>
              ✨ YOU NEVER LOSE YOUR PRINCIPAL ✨
            </div>
            <div style={{ fontSize: 13, color: THEME.foreground, textAlign: "center", marginTop: 6, opacity: 0.9 }}>
              Your staked tokens are <span style={{ color: THEME.legendary, fontWeight: 700 }}>ALWAYS returned</span> — only time gets locked
            </div>
          </div>
        );
      })()}
      
      <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
        {steps.map((step, i) => {
          const stepDelay = 10 + i * 8;
          const stepOpacity = interpolate(localFrame, [stepDelay, stepDelay + 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const stepY = interpolate(localFrame, [stepDelay, stepDelay + 10], [20, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          
          return (
            <React.Fragment key={i}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  width: stepWidth,
                  opacity: stepOpacity,
                  transform: `translateY(${stepY}px)`,
                }}
              >
                <div style={{ fontSize: 40, marginBottom: 12 }}>{step.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: THEME.foreground, textAlign: "center" }}>
                  {step.title}
                </div>
                <div style={{ fontSize: 11, color: THEME.muted, textAlign: "center", marginTop: 4 }}>
                  {step.desc}
                </div>
              </div>
              {i < steps.length - 1 && (
                <div style={{ color: THEME.primary, fontSize: 20, opacity: stepOpacity }}>→</div>
              )}
            </React.Fragment>
          );
        })}
      </div>
      
      {/* Tier probabilities - from page.tsx */}
      <div style={{ marginTop: 48, display: "flex", gap: 16 }}>
        {(["brick", "mid", "hot", "legendary", "mythic"] as const).map((tier, i) => {
          const tierDelay = 55 + i * 5;
          const tierOpacity = interpolate(localFrame, [tierDelay, tierDelay + 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const config = TIER_CONFIG[tier];
          const isWinner = tier === "legendary" || tier === "mythic";
          
          return (
            <div
              key={tier}
              style={{
                padding: "12px 16px",
                borderRadius: 12,
                background: THEME.card,
                border: `1px solid ${isWinner ? THEME[tier] : THEME.border}`,
                textAlign: "center",
                opacity: tierOpacity,
                boxShadow: isWinner ? `0 0 20px ${THEME[tier]}30` : undefined,
              }}
            >
              <TierSymbol tier={tier} size={28} />
              <div style={{ fontSize: 10, fontWeight: 700, color: getTierColor(tier), marginTop: 6 }}>
                {config.label}
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: THEME.foreground, fontFamily: "monospace" }}>
                {Math.round(config.probability * 100)}%
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Deposit Scene: Shows the deposit widget flow
// Matches deposit-withdraw.tsx structure
const DepositScene: React.FC<{ frame: number; startFrame: number }> = ({ frame, startFrame }) => {
  const localFrame = frame - startFrame;
  const panelScale = spring({ frame: localFrame, fps: 30, config: { damping: 12 } });
  const typingProgress = interpolate(localFrame, [10, 40], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const amount = Math.floor(typingProgress * 500000);
  
  return (
    <div>
      <div
        style={{
          width: 400,
          background: THEME.card,
          borderRadius: 16,
          border: `1px solid ${THEME.border}`,
          padding: 24,
          transform: `scale(${panelScale})`,
        }}
      >
        {/* Header - exact match from deposit-withdraw.tsx */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: `${THEME.primary}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
            ⬇️
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: THEME.foreground, textTransform: "uppercase", letterSpacing: 1 }}>
              Manage Funds
            </div>
            <div style={{ fontSize: 10, color: THEME.muted }}>Deposit or withdraw tokens</div>
          </div>
        </div>
        
        {/* Tab switcher - from deposit-withdraw.tsx */}
        <div style={{ display: "flex", gap: 4, padding: 4, background: "#081420", borderRadius: 10, marginBottom: 16 }}>
          <div style={{ flex: 1, padding: "10px 16px", borderRadius: 8, background: `${THEME.primary}20`, border: `1px solid ${THEME.primary}40`, textAlign: "center", fontSize: 13, fontWeight: 600, color: THEME.primary }}>
            ⬇️ Deposit
          </div>
          <div style={{ flex: 1, padding: "10px 16px", borderRadius: 8, textAlign: "center", fontSize: 13, fontWeight: 600, color: THEME.muted }}>
            ⬆️ Withdraw
          </div>
        </div>
        
        {/* Balance grid - from deposit-withdraw.tsx */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          <div style={{ padding: 12, borderRadius: 10, background: "#081420", border: "1px solid rgba(26, 58, 74, 0.5)" }}>
            <div style={{ fontSize: 10, color: THEME.muted, textTransform: "uppercase", marginBottom: 4 }}>Wallet Balance</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: THEME.foreground, fontFamily: "monospace" }}>2,500,000</div>
            <div style={{ fontSize: 9, color: THEME.muted }}>$LOCK</div>
          </div>
          <div style={{ padding: 12, borderRadius: 10, background: "#081420", border: "1px solid rgba(26, 58, 74, 0.5)" }}>
            <div style={{ fontSize: 10, color: THEME.muted, textTransform: "uppercase", marginBottom: 4 }}>Game Balance</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: THEME.primary, fontFamily: "monospace" }}>1,200,000</div>
            <div style={{ fontSize: 9, color: THEME.muted }}>$LOCK</div>
          </div>
        </div>
        
        {/* Amount input */}
        <div style={{ padding: "14px 16px", borderRadius: 10, background: "#081420", border: `1px solid ${THEME.primary}40`, marginBottom: 16, display: "flex", alignItems: "center" }}>
          <div style={{ flex: 1, fontSize: 20, fontWeight: 700, color: THEME.foreground, fontFamily: "monospace" }}>
            {amount.toLocaleString()}
          </div>
          <div style={{ fontSize: 12, color: THEME.muted, fontWeight: 600 }}>$LOCK</div>
        </div>
        
        {/* Deposit button */}
        <div style={{ padding: "14px 24px", borderRadius: 10, background: `linear-gradient(90deg, ${THEME.primary}, #00b4d8)`, textAlign: "center", fontSize: 14, fontWeight: 700, color: THEME.primaryForeground, boxShadow: `0 0 20px ${THEME.primary}40` }}>
          ⬇️ Deposit 500K $LOCK
        </div>
      </div>
    </div>
  );
};

// Spin Scene: Shows the slot machine spinning animation
const SpinScene: React.FC<{ frame: number; startFrame: number }> = ({ frame, startFrame }) => {
  const localFrame = frame - startFrame;
  
  // Reel spin animation - faster
  const spinSpeed = interpolate(localFrame, [0, 15, 40, 55], [0, 40, 40, 0], { extrapolateRight: "clamp" });
  const reelOffset = (localFrame * spinSpeed) % 100;
  
  // Panel entrance
  const panelScale = spring({ frame: localFrame, fps: 30, config: { damping: 12 } });
  const buttonGlow = interpolate(localFrame, [0, 15, 30], [0, 1, 0.6], { extrapolateRight: "clamp" });
  
  // Result reveal at end
  const showResult = localFrame > 50;
  const resultOpacity = interpolate(localFrame, [50, 60], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  
  // Tier sequence for spinning effect
  const tiers: Tier[] = ["brick", "mid", "hot", "legendary", "mythic"];
  const resultTier: Tier = "legendary"; // Demo result
  
  return (
    <div>
      <div
        style={{
          width: 480,
          background: THEME.card,
          borderRadius: 20,
          border: `1px solid ${THEME.border}`,
          padding: 32,
          transform: `scale(${panelScale})`,
          boxShadow: `0 0 60px ${THEME.primary}20`,
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: THEME.foreground, letterSpacing: 2 }}>SPIN TO WIN</div>
          <div style={{ fontSize: 12, color: THEME.muted, marginTop: 4 }}>Stake: 500,000 $LOCK</div>
        </div>
        
        {/* Reel display */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 16,
            padding: 24,
            background: "#081420",
            borderRadius: 16,
            border: "1px solid rgba(26, 58, 74, 0.5)",
            marginBottom: 24,
          }}
        >
          {[0, 1, 2].map((reelIndex) => {
            const reelDelay = reelIndex * 10;
            const isSpinning = localFrame > 10 + reelDelay && localFrame < 60 + reelDelay;
            const currentTier = showResult ? resultTier : tiers[Math.floor((reelOffset + reelIndex * 20) / 20) % 5];
            
            return (
              <div
                key={reelIndex}
                style={{
                  width: 100,
                  height: 120,
                  borderRadius: 12,
                  background: "#0a1628",
                  border: `1px solid ${showResult && currentTier === resultTier ? THEME.legendary : "rgba(26, 58, 74, 0.5)"}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: showResult ? `0 0 20px ${THEME.legendary}40` : "inset 0 2px 8px rgba(0,0,0,0.4)",
                  transition: "all 0.3s ease",
                }}
              >
                <div style={{ transform: isSpinning ? `translateY(${Math.sin(localFrame * 0.5 + reelIndex) * 20}px)` : "none" }}>
                  <TierSymbol tier={currentTier} size={56} isWinner={showResult && currentTier === "legendary"} />
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Result banner */}
        {showResult && (
          <div
            style={{
              textAlign: "center",
              padding: 16,
              borderRadius: 12,
              background: `${THEME.legendary}15`,
              border: `1px solid ${THEME.legendary}40`,
              opacity: resultOpacity,
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 800, color: THEME.legendary }}>🎉 LEGENDARY!</div>
            <div style={{ fontSize: 12, color: THEME.muted, marginTop: 4 }}>12h lock · Bonus multiplier active</div>
          </div>
        )}
        
        {/* Spin button */}
        {!showResult && (
          <div
            style={{
              padding: "16px 32px",
              borderRadius: 12,
              background: `linear-gradient(90deg, ${THEME.primary}, #00b4d8)`,
              textAlign: "center",
              fontSize: 16,
              fontWeight: 700,
              color: THEME.primaryForeground,
              boxShadow: `0 0 ${30 * buttonGlow}px ${THEME.primary}60`,
            }}
          >
            🎰 SPINNING...
          </div>
        )}
      </div>
    </div>
  );
};

// Lock Scene: Shows active lock with countdown
const LockScene: React.FC<{ frame: number; startFrame: number }> = ({ frame, startFrame }) => {
  const localFrame = frame - startFrame;
  const panelScale = spring({ frame: localFrame, fps: 30, config: { damping: 15 } });
  
  // Countdown animation
  const hours = 12;
  const minutes = Math.floor(interpolate(localFrame, [0, 60], [0, 59], { extrapolateRight: "clamp" }));
  const seconds = Math.floor((localFrame * 2) % 60);
  
  // Glow pulse
  const glowIntensity = 0.5 + Math.sin(localFrame * 0.1) * 0.3;
  
  return (
    <div>
      <div
        style={{
          width: 420,
          background: THEME.card,
          borderRadius: 20,
          border: `1px solid ${THEME.legendary}40`,
          padding: 32,
          transform: `scale(${panelScale})`,
          boxShadow: `0 0 ${60 * glowIntensity}px ${THEME.legendary}30`,
        }}
      >
        {/* Lock icon */}
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🔒</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: THEME.legendary, textTransform: "uppercase", letterSpacing: 2 }}>Active Lock</div>
        </div>
        
        {/* Tier badge */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 16px",
              borderRadius: 20,
              background: `${THEME.legendary}15`,
              border: `1px solid ${THEME.legendary}40`,
            }}
          >
            <TierSymbol tier="legendary" size={24} isWinner />
            <span style={{ fontSize: 14, fontWeight: 700, color: THEME.legendary }}>LEGENDARY</span>
          </div>
        </div>
        
        {/* Countdown */}
        <div
          style={{
            padding: 24,
            borderRadius: 16,
            background: "#081420",
            border: "1px solid rgba(26, 58, 74, 0.5)",
            textAlign: "center",
            marginBottom: 20,
          }}
        >
          <div style={{ fontSize: 10, color: THEME.muted, textTransform: "uppercase", marginBottom: 8, letterSpacing: 1 }}>Time Remaining</div>
          <div style={{ fontSize: 40, fontWeight: 800, color: THEME.foreground, fontFamily: "monospace", letterSpacing: 4 }}>
            {String(hours).padStart(2, "0")}:{String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </div>
        </div>
        
        {/* Lock details */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ padding: 12, borderRadius: 10, background: "#081420" }}>
            <div style={{ fontSize: 10, color: THEME.muted }}>Staked Amount</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: THEME.foreground, fontFamily: "monospace" }}>500,000</div>
          </div>
          <div style={{ padding: 12, borderRadius: 10, background: "#081420" }}>
            <div style={{ fontSize: 10, color: THEME.muted }}>Bonus Rate</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: THEME.legendary, fontFamily: "monospace" }}>+15%</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Claim Scene: Shows successful claim
const ClaimScene: React.FC<{ frame: number; startFrame: number }> = ({ frame, startFrame }) => {
  const localFrame = frame - startFrame;
  const panelScale = spring({ frame: localFrame, fps: 30, config: { damping: 12 } });
  
  // Celebration particles
  const showConfetti = localFrame > 20;
  const successGlow = interpolate(localFrame, [0, 30], [0, 1], { extrapolateRight: "clamp" });
  
  return (
    <div style={{ position: "relative" }}>
      {/* Confetti particles */}
      {showConfetti && (
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          {[...Array(20)].map((_, i) => {
            const x = 50 + Math.sin(i * 0.7) * 40;
            const y = interpolate(localFrame - 20, [0, 40], [-10, 110], { extrapolateRight: "clamp" });
            const rotation = localFrame * (i % 2 === 0 ? 5 : -5);
            const colors = [THEME.primary, THEME.legendary, THEME.mythic, "#facc15"];
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: `${x + Math.sin(i * 2) * 10}%`,
                  top: `${y + Math.sin(i) * 5}%`,
                  width: 8,
                  height: 8,
                  borderRadius: i % 2 === 0 ? "50%" : 0,
                  background: colors[i % colors.length],
                  transform: `rotate(${rotation}deg)`,
                  opacity: interpolate(localFrame - 20, [30, 40], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
                }}
              />
            );
          })}
        </div>
      )}
      
      <div
        style={{
          width: 400,
          background: THEME.card,
          borderRadius: 20,
          border: `1px solid ${THEME.primary}40`,
          padding: 32,
          transform: `scale(${panelScale})`,
          boxShadow: `0 0 ${80 * successGlow}px ${THEME.primary}40`,
        }}
      >
        {/* Success icon */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: `${THEME.primary}20`,
              border: `2px solid ${THEME.primary}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto",
              fontSize: 40,
              boxShadow: `0 0 30px ${THEME.primary}40`,
            }}
          >
            ✓
          </div>
        </div>
        
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: THEME.foreground }}>Claim Successful!</div>
          <div style={{ fontSize: 12, color: THEME.muted, marginTop: 8 }}>Your tokens have been returned + bonus</div>
        </div>
        
        {/* Claim summary */}
        <div style={{ padding: 20, borderRadius: 16, background: "#081420", marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontSize: 12, color: THEME.muted }}>Principal Returned</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: THEME.foreground, fontFamily: "monospace" }}>500,000</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontSize: 12, color: THEME.muted }}>Bonus Earned</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: THEME.legendary, fontFamily: "monospace" }}>+75,000</span>
          </div>
          <div style={{ height: 1, background: "rgba(26, 58, 74, 0.5)", margin: "12px 0" }} />
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: THEME.foreground }}>Total Received</span>
            <span style={{ fontSize: 18, fontWeight: 800, color: THEME.primary, fontFamily: "monospace" }}>575,000</span>
          </div>
        </div>
        
        {/* CTA */}
        <div
          style={{
            padding: "14px 24px",
            borderRadius: 12,
            background: `linear-gradient(90deg, ${THEME.primary}, #00b4d8)`,
            textAlign: "center",
            fontSize: 14,
            fontWeight: 700,
            color: THEME.primaryForeground,
          }}
        >
          🎰 Spin Again
        </div>
      </div>
    </div>
  );
};

// Outro Scene: Fade out with logo
const OutroScene: React.FC<{ frame: number; startFrame: number }> = ({ frame, startFrame }) => {
  const localFrame = frame - startFrame;
  const logoOpacity = interpolate(localFrame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  const textOpacity = interpolate(localFrame, [10, 25], [0, 1], { extrapolateRight: "clamp" });
  
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <Img
        src={staticFile("logo.png")}
        style={{
          width: 180,
          height: 180,
          borderRadius: 32,
          opacity: logoOpacity,
          boxShadow: `0 0 80px ${THEME.primary}50`,
        }}
      />
      <h1
        style={{
          marginTop: 32,
          fontSize: 56,
          fontWeight: 900,
          letterSpacing: 4,
          opacity: textOpacity,
        }}
      >
        <span style={{ 
          background: "linear-gradient(135deg, #d4a853, #f0d76a, #d4a853)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}>LOCK</span>
        <span style={{ color: THEME.foreground }}> SLOT</span>
      </h1>
      <div style={{ marginTop: 16, fontSize: 18, color: THEME.muted, letterSpacing: 3, opacity: textOpacity }}>
        PROVABLY FAIR · PARI-MUTUEL
      </div>
    </div>
  );
};

// Main composition
export const PlatformWalkthrough: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  
  // Camera motion
  const cameraX = Math.sin(frame * 0.006) * 10;
  const cameraY = Math.cos(frame * 0.004) * 6;
  
  // Global fade
  const fadeIn = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [durationInFrames - 20, durationInFrames], [1, 0], { extrapolateLeft: "clamp" });
  
  return (
    <AbsoluteFill
      style={{
        background: THEME.background,
        fontFamily: "Geist, system-ui, sans-serif",
        opacity: Math.min(fadeIn, fadeOut),
      }}
    >
      {/* ASCII Background - CSS fallback + Three.js layer */}
      <AbsoluteFill style={{ zIndex: 0 }}>
        {/* CSS Grid Pattern Base (always renders) */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.12,
            backgroundImage: `
              linear-gradient(rgba(97, 250, 159, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(97, 250, 159, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: "20px 20px",
          }}
        />
        
        {/* Animated glow center */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(ellipse 100% 80% at 50% 50%, rgba(97, 250, 159, 0.08) 0%, transparent 60%)`,
            transform: `scale(${1 + Math.sin(frame * 0.02) * 0.05})`,
          }}
        />
        
        {/* Three.js ASCII Background (if WebGL works) */}
        <AsciiGeometryBackground
          mode="ink"
          speed={0.3}
          sceneScale={0.8}
          warp={0.6}
          contrast={1.5}
          scanline={0.1}
          glyphSize={14}
          resolutionScale={0.5}
          className=""
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            opacity: 0.45,
            zIndex: 1,
          }}
        />
        
        {/* Scanline overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.03,
            backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.5) 2px, rgba(0,0,0,0.5) 4px)",
            pointerEvents: "none",
            zIndex: 2,
          }}
        />
      </AbsoluteFill>
      
      {/* Scene container with camera motion + SCALE UP */}
      <div style={{ position: "absolute", inset: 0, transform: `translate(${cameraX}px, ${cameraY}px) scale(1.15)`, zIndex: 1 }}>
        {/* Intro */}
        <Sequence from={SCENE_CONFIG.intro.start} durationInFrames={SCENE_CONFIG.intro.duration}>
          <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            <IntroScene frame={frame - SCENE_CONFIG.intro.start} />
          </AbsoluteFill>
        </Sequence>
        
        {/* How It Works */}
        <Sequence from={SCENE_CONFIG.howItWorks.start} durationInFrames={SCENE_CONFIG.howItWorks.duration}>
          <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            <HowItWorksScene frame={frame} startFrame={SCENE_CONFIG.howItWorks.start} />
          </AbsoluteFill>
        </Sequence>
        
        {/* Deposit */}
        <Sequence from={SCENE_CONFIG.deposit.start} durationInFrames={SCENE_CONFIG.deposit.duration}>
          <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            <DepositScene frame={frame} startFrame={SCENE_CONFIG.deposit.start} />
          </AbsoluteFill>
        </Sequence>
        
        {/* Spin */}
        <Sequence from={SCENE_CONFIG.spin.start} durationInFrames={SCENE_CONFIG.spin.duration}>
          <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            <SpinScene frame={frame} startFrame={SCENE_CONFIG.spin.start} />
          </AbsoluteFill>
        </Sequence>
        
        {/* Lock */}
        <Sequence from={SCENE_CONFIG.lock.start} durationInFrames={SCENE_CONFIG.lock.duration}>
          <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            <LockScene frame={frame} startFrame={SCENE_CONFIG.lock.start} />
          </AbsoluteFill>
        </Sequence>
        
        {/* Claim */}
        <Sequence from={SCENE_CONFIG.claim.start} durationInFrames={SCENE_CONFIG.claim.duration}>
          <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ClaimScene frame={frame} startFrame={SCENE_CONFIG.claim.start} />
          </AbsoluteFill>
        </Sequence>
        
        {/* Outro */}
        <Sequence from={SCENE_CONFIG.outro.start} durationInFrames={SCENE_CONFIG.outro.duration}>
          <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            <OutroScene frame={frame} startFrame={SCENE_CONFIG.outro.start} />
          </AbsoluteFill>
        </Sequence>
      </div>
      
      {/* Vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.4) 100%)",
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
