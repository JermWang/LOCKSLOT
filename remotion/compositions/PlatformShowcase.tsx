import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  Img,
  staticFile,
  continueRender,
  delayRender,
} from "remotion";

// Font loading disabled - uses system fonts as fallback
// The Geist font URL was returning 404, so we skip loading it

// ============================================
// ACTUAL TIER SYMBOLS FROM reel-symbols.tsx
// ============================================
const BrickSymbol: React.FC<{ size?: number }> = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64">
    <defs>
      <linearGradient id="brick-top" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#dc5044" />
        <stop offset="100%" stopColor="#b83a30" />
      </linearGradient>
      <linearGradient id="brick-front" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#c4453b" />
        <stop offset="50%" stopColor="#a83328" />
        <stop offset="100%" stopColor="#8b2720" />
      </linearGradient>
      <linearGradient id="brick-side" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#9c2e24" />
        <stop offset="100%" stopColor="#7a2018" />
      </linearGradient>
    </defs>
    <path d="M8 20 L32 10 L56 20 L32 30 Z" fill="url(#brick-top)" />
    <path d="M8 20 L8 44 L32 54 L32 30 Z" fill="url(#brick-front)" />
    <path d="M32 30 L32 54 L56 44 L56 20 Z" fill="url(#brick-side)" />
    <line x1="8" y1="32" x2="32" y2="42" stroke="#6b1a14" strokeWidth="1.5" opacity="0.4" />
    <line x1="20" y1="26" x2="20" y2="48" stroke="#6b1a14" strokeWidth="1" opacity="0.3" />
    <line x1="32" y1="42" x2="56" y2="32" stroke="#5a1510" strokeWidth="1.5" opacity="0.4" />
    <line x1="44" y1="25" x2="44" y2="49" stroke="#5a1510" strokeWidth="1" opacity="0.3" />
  </svg>
);

const MidSymbol: React.FC<{ size?: number }> = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64">
    <defs>
      <linearGradient id="mid-glass" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#ffd700" />
        <stop offset="50%" stopColor="#ffb347" />
        <stop offset="100%" stopColor="#ffd700" />
      </linearGradient>
      <linearGradient id="mid-sand" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#daa520" />
        <stop offset="100%" stopColor="#b8860b" />
      </linearGradient>
    </defs>
    <rect x="14" y="8" width="36" height="6" rx="2" fill="#8b7355" />
    <rect x="14" y="50" width="36" height="6" rx="2" fill="#8b7355" />
    <path d="M18 14 L18 24 L32 36 L46 24 L46 14 Z" fill="url(#mid-glass)" opacity="0.4" />
    <path d="M18 50 L18 40 L32 28 L46 40 L46 50 Z" fill="url(#mid-glass)" opacity="0.4" />
    <path d="M22 14 L22 22 L32 30 L42 22 L42 14 Z" fill="url(#mid-sand)" opacity="0.8" />
    <circle cx="32" cy="44" r="8" fill="url(#mid-sand)" opacity="0.8" />
    <line x1="32" y1="32" x2="32" y2="38" stroke="#daa520" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const HotSymbol: React.FC<{ size?: number }> = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64">
    <defs>
      <linearGradient id="fire-outer" x1="0%" y1="100%" x2="0%" y2="0%">
        <stop offset="0%" stopColor="#cc2200" />
        <stop offset="30%" stopColor="#ff4500" />
        <stop offset="60%" stopColor="#ff6a00" />
        <stop offset="100%" stopColor="#ffaa00" />
      </linearGradient>
      <linearGradient id="fire-mid" x1="0%" y1="100%" x2="0%" y2="0%">
        <stop offset="0%" stopColor="#ff6600" />
        <stop offset="50%" stopColor="#ff9900" />
        <stop offset="100%" stopColor="#ffcc00" />
      </linearGradient>
      <linearGradient id="fire-inner" x1="0%" y1="100%" x2="0%" y2="0%">
        <stop offset="0%" stopColor="#ffdd00" />
        <stop offset="100%" stopColor="#ffffaa" />
      </linearGradient>
    </defs>
    <path d="M32 4 C38 12 46 22 46 34 C46 46 40 56 32 60 C24 56 18 46 18 34 C18 22 26 12 32 4Z" fill="url(#fire-outer)" />
    <path d="M32 14 C36 20 40 28 40 38 C40 48 36 54 32 56 C28 54 24 48 24 38 C24 28 28 20 32 14Z" fill="url(#fire-mid)" />
    <path d="M32 26 C35 30 37 36 37 42 C37 48 35 52 32 54 C29 52 27 48 27 42 C27 36 29 30 32 26Z" fill="url(#fire-inner)" />
    <ellipse cx="32" cy="46" rx="4" ry="6" fill="#fffef0" opacity="0.95" />
  </svg>
);

const LegendarySymbol: React.FC<{ size?: number; isWinner?: boolean }> = ({ size = 48, isWinner }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" style={isWinner ? { filter: "drop-shadow(0 0 12px #22d3ee)" } : {}}>
    <defs>
      <linearGradient id="diamond-top" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#b8f4ff" />
        <stop offset="100%" stopColor="#00d4aa" />
      </linearGradient>
      <linearGradient id="diamond-left" x1="100%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#00d4aa" />
        <stop offset="100%" stopColor="#00a080" />
      </linearGradient>
      <linearGradient id="diamond-right" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#40e0d0" />
        <stop offset="100%" stopColor="#00b894" />
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
  <svg width={size} height={size} viewBox="0 0 64 64" style={isWinner ? { filter: "drop-shadow(0 0 16px #fb7185)" } : {}}>
    <defs>
      <linearGradient id="bolt-main" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ff6bff" />
        <stop offset="50%" stopColor="#bf5fff" />
        <stop offset="100%" stopColor="#8b5cf6" />
      </linearGradient>
      <linearGradient id="bolt-highlight" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#ffd6ff" />
        <stop offset="100%" stopColor="#ff9eff" />
      </linearGradient>
    </defs>
    <polygon points="36,4 18,30 28,30 22,60 46,28 34,28 42,4" fill="url(#bolt-main)" />
    <polygon points="34,10 24,28 30,28 26,50 40,30 34,30 38,10" fill="url(#bolt-highlight)" opacity="0.7" />
    <polygon points="32,18 28,28 32,28 30,40 36,30 32,30 34,18" fill="white" opacity="0.8" />
    <circle cx="14" cy="20" r="2" fill="#ff9eff" opacity="0.8" />
    <circle cx="50" cy="40" r="2" fill="#ff9eff" opacity="0.8" />
  </svg>
);

type Tier = "brick" | "mid" | "hot" | "legendary" | "mythic";
const TierSymbol: React.FC<{ tier: Tier; size?: number; isWinner?: boolean }> = ({ tier, size, isWinner }) => {
  switch (tier) {
    case "brick": return <BrickSymbol size={size} />;
    case "mid": return <MidSymbol size={size} />;
    case "hot": return <HotSymbol size={size} />;
    case "legendary": return <LegendarySymbol size={size} isWinner={isWinner} />;
    case "mythic": return <MythicSymbol size={size} isWinner={isWinner} />;
  }
};

const TIER_CONFIG: Record<Tier, { label: string; color: string }> = {
  brick: { label: "BRICK", color: "#ef4444" },
  mid: { label: "MID", color: "#f59e0b" },
  hot: { label: "HOT", color: "#f97316" },
  legendary: { label: "LEGEND", color: "#22d3ee" },
  mythic: { label: "MYTHIC", color: "#fb7185" },
};

const getTierColor = (tier: Tier) => TIER_CONFIG[tier].color;

// Theme colors matching globals.css
const THEME = {
  background: "#0a1628",
  foreground: "#e8f4f8",
  primary: "#00d4aa",
  muted: "#6b8a9a",
  legendary: "#22d3ee",
  mythic: "#fb7185",
};

// ============================================
// CYBER-PANEL: Exact match from deposit-withdraw.tsx styling
// className="cyber-panel p-4" equivalent
// ============================================
const CyberPanel: React.FC<{
  children: React.ReactNode;
  width: number;
  glowing?: boolean;
}> = ({ children, width, glowing }) => (
  <div
    style={{
      width,
      fontFamily: "Geist, system-ui, sans-serif",
      background: "rgba(10, 22, 40, 0.95)",
      borderRadius: 16,
      border: "1px solid rgba(0, 212, 170, 0.2)",
      boxShadow: glowing
        ? "0 0 30px rgba(0, 212, 170, 0.25), 0 0 60px rgba(0, 212, 170, 0.1)"
        : "0 4px 24px rgba(0, 0, 0, 0.4)",
      overflow: "hidden",
    }}
  >
    {children}
  </div>
);

// ============================================
// REEL WINDOW: Exact match from slot-machine.tsx
// className="reel-window" equivalent
// ============================================
const ReelWindow: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      width: 80,
      height: 128,
      borderRadius: 12,
      background: "#081420",
      border: "1px solid rgba(26, 58, 74, 0.5)",
      overflow: "hidden",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: "inset 0 2px 8px rgba(0,0,0,0.4)",
    }}
  >
    {children}
  </div>
);

// Scene 1: Connect Wallet (frames 0-90)
const ConnectScene: React.FC<{ progress: number }> = ({ progress }) => {
  const opacity = interpolate(progress, [0, 0.1, 0.85, 1], [0, 1, 1, 0]);
  const scale = interpolate(progress, [0, 0.15], [0.9, 1], { extrapolateRight: "clamp" });

  return (
    <div style={{ opacity, transform: `scale(${scale})`, width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <CyberPanel width={500}>
        <div style={{ padding: 32 }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: `${THEME.primary}20`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 20 }}>🔗</span>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: THEME.foreground, textTransform: "uppercase", letterSpacing: 1 }}>Connect Wallet</div>
              <div style={{ fontSize: 11, color: THEME.muted }}>Link your Solana wallet</div>
            </div>
          </div>

          {/* Wallet options */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ padding: "16px 20px", borderRadius: 12, background: "rgba(0, 212, 170, 0.1)", border: `1px solid ${THEME.primary}40`, display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: "#ab9ff2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>👻</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: THEME.foreground }}>Phantom</div>
                <div style={{ fontSize: 11, color: THEME.muted }}>Recommended</div>
              </div>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: THEME.primary, boxShadow: `0 0 10px ${THEME.primary}` }} />
            </div>
            <div style={{ padding: "16px 20px", borderRadius: 12, background: "rgba(30, 60, 90, 0.3)", border: "1px solid rgba(107, 138, 154, 0.2)", display: "flex", alignItems: "center", gap: 16, opacity: 0.6 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: "#fc822b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>☀️</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: THEME.foreground }}>Solflare</div>
            </div>
          </div>
        </div>
      </CyberPanel>
    </div>
  );
};

// Scene 2: Deposit (frames 90-180)
const DepositScene: React.FC<{ progress: number }> = ({ progress }) => {
  const opacity = interpolate(progress, [0, 0.1, 0.85, 1], [0, 1, 1, 0]);
  const slideX = interpolate(progress, [0, 0.15], [100, 0], { extrapolateRight: "clamp" });
  const typingProgress = interpolate(progress, [0.2, 0.5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const amount = Math.floor(typingProgress * 500000);

  return (
    <div style={{ opacity, transform: `translateX(${slideX}px)`, width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <CyberPanel width={480}>
        <div style={{ padding: 28 }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `${THEME.primary}20`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 18 }}>⬇️</span>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: THEME.foreground, textTransform: "uppercase", letterSpacing: 1 }}>Manage Funds</div>
              <div style={{ fontSize: 10, color: THEME.muted }}>Deposit or withdraw tokens</div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 4, padding: 4, background: "#081420", borderRadius: 10, marginBottom: 16 }}>
            <div style={{ flex: 1, padding: "10px 16px", borderRadius: 8, background: `${THEME.primary}20`, border: `1px solid ${THEME.primary}40`, textAlign: "center", fontSize: 13, fontWeight: 600, color: THEME.primary }}>⬇️ Deposit</div>
            <div style={{ flex: 1, padding: "10px 16px", borderRadius: 8, textAlign: "center", fontSize: 13, fontWeight: 600, color: THEME.muted }}>⬆️ Withdraw</div>
          </div>

          {/* Balance display */}
          <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1, padding: 14, borderRadius: 10, background: "#081420", border: "1px solid rgba(26, 58, 74, 0.5)" }}>
              <div style={{ fontSize: 9, color: THEME.muted, textTransform: "uppercase", marginBottom: 4 }}>Wallet Balance</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: THEME.foreground, fontFamily: "monospace" }}>2.5M</div>
              <div style={{ fontSize: 9, color: THEME.muted }}>$LOCK</div>
            </div>
            <div style={{ flex: 1, padding: 14, borderRadius: 10, background: "#081420", border: "1px solid rgba(26, 58, 74, 0.5)" }}>
              <div style={{ fontSize: 9, color: THEME.muted, textTransform: "uppercase", marginBottom: 4 }}>Game Balance</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: THEME.primary, fontFamily: "monospace" }}>1.2M</div>
              <div style={{ fontSize: 9, color: THEME.muted }}>$LOCK</div>
            </div>
          </div>

          {/* Amount input */}
          <div style={{ padding: "14px 16px", borderRadius: 10, background: "#081420", border: `1px solid ${THEME.primary}40`, marginBottom: 16, display: "flex", alignItems: "center" }}>
            <div style={{ flex: 1, fontSize: 22, fontWeight: 700, color: THEME.foreground, fontFamily: "monospace" }}>
              {amount > 0 ? amount.toLocaleString() : "0"}
            </div>
            <div style={{ fontSize: 12, color: THEME.muted, fontWeight: 600 }}>$LOCK</div>
          </div>

          {/* Deposit button */}
          <div style={{ padding: "14px 24px", borderRadius: 10, background: `linear-gradient(90deg, ${THEME.primary}, #00b4d8)`, textAlign: "center", fontSize: 14, fontWeight: 700, color: "#0a1628", boxShadow: `0 0 20px ${THEME.primary}40` }}>
            ⬇️ Deposit 500K $LOCK
          </div>
        </div>
      </CyberPanel>
    </div>
  );
};

// Scene 3: Spin (frames 180-270)
const SpinScene: React.FC<{ progress: number; frame: number }> = ({ progress, frame }) => {
  const opacity = interpolate(progress, [0, 0.1, 0.85, 1], [0, 1, 1, 0]);
  const scale = interpolate(progress, [0, 0.12], [0.85, 1], { extrapolateRight: "clamp" });
  
  // Reel animation
  const spinPhase = interpolate(progress, [0.15, 0.6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const isSpinning = spinPhase > 0 && spinPhase < 1;
  const reelOffset = isSpinning ? (frame * 15) % 320 : 0;

  const tiers: Tier[] = ["brick", "mid", "hot", "legendary", "mythic"];
  const resultTier: Tier = "legendary";

  return (
    <div style={{ opacity, transform: `scale(${scale})`, width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <CyberPanel width={520} glowing={spinPhase >= 1}>
        <div style={{ padding: 24 }}>
          {/* Title */}
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: THEME.primary, letterSpacing: 4, textShadow: `0 0 20px ${THEME.primary}60` }}>LOCK SLOT</div>
          </div>

          {/* Slot machine frame */}
          <div style={{ position: "relative", padding: 8 }}>
            {/* Decorative corners */}
            <div style={{ position: "absolute", inset: 0, border: `1px solid ${THEME.primary}30`, borderRadius: 12 }}>
              <div style={{ position: "absolute", top: -2, left: -2, width: 16, height: 16, borderTop: `2px solid ${THEME.primary}`, borderLeft: `2px solid ${THEME.primary}`, borderRadius: "8px 0 0 0" }} />
              <div style={{ position: "absolute", top: -2, right: -2, width: 16, height: 16, borderTop: `2px solid ${THEME.primary}`, borderRight: `2px solid ${THEME.primary}`, borderRadius: "0 8px 0 0" }} />
              <div style={{ position: "absolute", bottom: -2, left: -2, width: 16, height: 16, borderBottom: `2px solid ${THEME.primary}`, borderLeft: `2px solid ${THEME.primary}`, borderRadius: "0 0 0 8px" }} />
              <div style={{ position: "absolute", bottom: -2, right: -2, width: 16, height: 16, borderBottom: `2px solid ${THEME.primary}`, borderRight: `2px solid ${THEME.primary}`, borderRadius: "0 0 8px 0" }} />
            </div>

            {/* Reels */}
            <div style={{ display: "flex", gap: 12, justifyContent: "center", padding: 16 }}>
              {[0, 1, 2].map((reelIndex) => (
                <div key={reelIndex} style={{ width: 80, height: 100, borderRadius: 12, background: "#081420", border: "1px solid rgba(26, 58, 74, 0.5)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {spinPhase >= 1 ? (
                    <TierSymbol tier={resultTier} size={56} />
                  ) : isSpinning ? (
                    <div style={{ transform: `translateY(${-reelOffset + reelIndex * 20}px)`, display: "flex", flexDirection: "column", gap: 12 }}>
                      {[...tiers, ...tiers, ...tiers].map((t, i) => (
                        <TierSymbol key={i} tier={t} size={48} />
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: 32, color: THEME.muted }}>?</div>
                  )}
                </div>
              ))}
            </div>

            {/* Win line */}
            <div style={{ position: "absolute", left: 24, right: 24, top: "50%", height: 2, background: `linear-gradient(90deg, transparent, ${THEME.primary}60, transparent)` }} />
          </div>

          {/* Result badge */}
          {spinPhase >= 1 && (
            <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
              <div style={{ padding: "8px 24px", borderRadius: 20, background: `${THEME.legendary}20`, border: `2px solid ${THEME.legendary}`, display: "flex", alignItems: "center", gap: 8, boxShadow: `0 0 20px ${THEME.legendary}40` }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: THEME.legendary }}>⚡ LEGENDARY</span>
                <span style={{ fontSize: 12, color: THEME.foreground }}>72h LOCK</span>
              </div>
            </div>
          )}

          {/* Spin button */}
          <div style={{ marginTop: 20, padding: "14px 32px", borderRadius: 12, background: isSpinning ? THEME.muted : `linear-gradient(90deg, ${THEME.primary}, #00b4d8)`, textAlign: "center", fontSize: 16, fontWeight: 800, color: "#0a1628", letterSpacing: 2, boxShadow: isSpinning ? "none" : `0 0 25px ${THEME.primary}50` }}>
            {isSpinning ? "🔓 SPINNING..." : "🔒 SPIN"}
          </div>
        </div>
      </CyberPanel>
    </div>
  );
};

// Scene 4: Lock Active (frames 270-360)
const LockScene: React.FC<{ progress: number }> = ({ progress }) => {
  const opacity = interpolate(progress, [0, 0.1, 0.85, 1], [0, 1, 1, 0]);
  const slideY = interpolate(progress, [0, 0.15], [50, 0], { extrapolateRight: "clamp" });
  const progressBar = interpolate(progress, [0.2, 0.8], [0, 65], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <div style={{ opacity, transform: `translateY(${slideY}px)`, width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <CyberPanel width={500}>
        <div style={{ padding: 24 }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: `${THEME.legendary}20`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 16 }}>🔒</span>
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: THEME.foreground, textTransform: "uppercase", letterSpacing: 1 }}>Active Locks</div>
                <div style={{ fontSize: 10, color: THEME.muted }}>Your staked positions</div>
              </div>
            </div>
            <div style={{ padding: "4px 10px", borderRadius: 12, background: `${THEME.primary}20`, fontSize: 11, fontWeight: 600, color: THEME.primary }}>1 Active</div>
          </div>

          {/* Lock card */}
          <div style={{ padding: 20, borderRadius: 14, background: `${THEME.legendary}10`, border: `1px solid ${THEME.legendary}40` }}>
            {/* Lock header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <TierSymbol tier="legendary" size={40} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: THEME.legendary }}>LEGENDARY</div>
                  <div style={{ fontSize: 11, color: THEME.muted }}>2.5× Multiplier</div>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: THEME.foreground, fontFamily: "monospace" }}>500K</div>
                <div style={{ fontSize: 10, color: THEME.muted }}>$LOCK staked</div>
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <div style={{ fontSize: 10, color: THEME.muted }}>Lock Progress</div>
                <div style={{ fontSize: 10, color: THEME.legendary, fontWeight: 600 }}>{Math.round(progressBar)}%</div>
              </div>
              <div style={{ height: 8, borderRadius: 4, background: "rgba(30, 60, 90, 0.5)", overflow: "hidden" }}>
                <div style={{ width: `${progressBar}%`, height: "100%", borderRadius: 4, background: `linear-gradient(90deg, ${THEME.legendary}, ${THEME.primary})`, boxShadow: `0 0 10px ${THEME.legendary}60` }} />
              </div>
            </div>

            {/* Time remaining */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: 8, background: "rgba(10, 22, 40, 0.6)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 12 }}>⏱️</span>
                <span style={{ fontSize: 11, color: THEME.muted }}>Time Remaining</span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: THEME.foreground, fontFamily: "monospace" }}>25h 14m 32s</div>
            </div>

            {/* Bonus eligible badge */}
            <div style={{ marginTop: 12, textAlign: "center" }}>
              <span style={{ fontSize: 10, color: THEME.legendary, fontWeight: 600, letterSpacing: 2 }}>✦ ELIGIBLE FOR EPOCH BONUS ✦</span>
            </div>
          </div>
        </div>
      </CyberPanel>
    </div>
  );
};

// Scene 5: Claim (frames 360-450)
const ClaimScene: React.FC<{ progress: number }> = ({ progress }) => {
  const opacity = interpolate(progress, [0, 0.1, 0.85, 1], [0, 1, 1, 0]);
  const scale = interpolate(progress, [0, 0.15], [0.9, 1], { extrapolateRight: "clamp" });
  const confettiProgress = interpolate(progress, [0.4, 0.6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <div style={{ opacity, transform: `scale(${scale})`, width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
      {/* Confetti particles */}
      {confettiProgress > 0 && [...Array(20)].map((_, i) => {
        const angle = (i / 20) * Math.PI * 2;
        const distance = confettiProgress * 200;
        const colors = [THEME.primary, THEME.legendary, THEME.mythic, "#f0c674"];
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: 8,
              height: 8,
              borderRadius: 2,
              background: colors[i % colors.length],
              transform: `translate(-50%, -50%) translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance - confettiProgress * 100}px) rotate(${confettiProgress * 360}deg)`,
              opacity: 1 - confettiProgress * 0.5,
            }}
          />
        );
      })}

      <CyberPanel width={460} glowing>
        <div style={{ padding: 28 }}>
          {/* Success header */}
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🏆</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: THEME.primary, letterSpacing: 2, textShadow: `0 0 20px ${THEME.primary}60` }}>CLAIM SUCCESSFUL!</div>
            <div style={{ fontSize: 13, color: THEME.muted, marginTop: 8 }}>Your lock has matured</div>
          </div>

          {/* Claim breakdown */}
          <div style={{ padding: 20, borderRadius: 12, background: "#081420", marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, paddingBottom: 12, borderBottom: "1px solid rgba(26, 58, 74, 0.5)" }}>
              <div style={{ fontSize: 12, color: THEME.muted }}>Principal</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: THEME.foreground, fontFamily: "monospace" }}>500,000 $LOCK</div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, paddingBottom: 12, borderBottom: "1px solid rgba(26, 58, 74, 0.5)" }}>
              <div style={{ fontSize: 12, color: THEME.legendary }}>⚡ Epoch Bonus</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: THEME.legendary, fontFamily: "monospace" }}>+125,000 $LOCK</div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: THEME.foreground }}>Total Received</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: THEME.primary, fontFamily: "monospace" }}>625,000 $LOCK</div>
            </div>
          </div>

          {/* Transaction link */}
          <div style={{ padding: "12px 16px", borderRadius: 10, background: `${THEME.primary}10`, border: `1px solid ${THEME.primary}30`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: 11, color: THEME.muted }}>Transaction confirmed on Solana</div>
            <div style={{ fontSize: 11, color: THEME.primary, fontWeight: 600 }}>View on Solscan →</div>
          </div>
        </div>
      </CyberPanel>
    </div>
  );
};

export const PlatformShowcase: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Scene timing (90 frames each = 3 seconds at 30fps, total 450 = 15 seconds)
  const sceneLength = 90;
  const currentScene = Math.min(Math.floor(frame / sceneLength), 4);
  const sceneProgress = (frame % sceneLength) / sceneLength;

  // Camera motion
  const cameraX = Math.sin(frame * 0.008) * 15;
  const cameraY = Math.cos(frame * 0.006) * 8;

  // Spotlight motion
  const spotX = interpolate(frame, [0, durationInFrames], [30, 70]);
  const spotY = 30 + Math.sin(frame * 0.01) * 15;

  // Global fade
  const introOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const outroOpacity = interpolate(frame, [durationInFrames - 25, durationInFrames], [1, 0], { extrapolateLeft: "clamp" });

  return (
    <AbsoluteFill style={{ background: THEME.background, opacity: Math.min(introOpacity, outroOpacity) }}>
      {/* Studio lighting */}
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 100% 80% at ${spotX}% ${spotY}%, ${THEME.primary}15 0%, transparent 50%), radial-gradient(ellipse 80% 100% at ${100-spotX}% ${100-spotY}%, ${THEME.mythic}10 0%, transparent 50%)` }} />

      {/* Grid floor */}
      <div style={{ position: "absolute", bottom: 0, left: "-25%", right: "-25%", height: "50%", transform: `perspective(800px) rotateX(65deg) translateX(${cameraX}px)`, backgroundImage: `linear-gradient(${THEME.primary}15 1px, transparent 1px), linear-gradient(90deg, ${THEME.primary}15 1px, transparent 1px)`, backgroundSize: "50px 50px", opacity: 0.5 }} />

      {/* Top branding with actual logo */}
      <div style={{ position: "absolute", top: 30, left: 0, right: 0, display: "flex", justifyContent: "center", alignItems: "center", gap: 14, zIndex: 10 }}>
        <Img src={staticFile("logo.png")} style={{ width: 48, height: 48, borderRadius: 12 }} />
        <div style={{ fontSize: 32, fontWeight: 900, color: THEME.foreground, letterSpacing: 3 }}>LOCK SLOT</div>
      </div>

      {/* Scene container with camera motion */}
      <div style={{ position: "absolute", inset: 0, transform: `translateX(${cameraX}px) translateY(${cameraY}px)` }}>
        {currentScene === 0 && <ConnectScene progress={sceneProgress} />}
        {currentScene === 1 && <DepositScene progress={sceneProgress} />}
        {currentScene === 2 && <SpinScene progress={sceneProgress} frame={frame} />}
        {currentScene === 3 && <LockScene progress={sceneProgress} />}
        {currentScene === 4 && <ClaimScene progress={sceneProgress} />}
      </div>

      {/* Scene label */}
      <div style={{ position: "absolute", bottom: 80, left: 0, right: 0, textAlign: "center" }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: THEME.muted, letterSpacing: 4, textTransform: "uppercase" }}>
          {["Connect", "Deposit", "Spin", "Lock", "Claim"][currentScene]}
        </div>
      </div>

      {/* Progress dots */}
      <div style={{ position: "absolute", bottom: 40, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 10 }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} style={{ width: i === currentScene ? 28 : 10, height: 10, borderRadius: 5, background: i <= currentScene ? THEME.primary : "rgba(107, 138, 154, 0.3)", boxShadow: i === currentScene ? `0 0 15px ${THEME.primary}` : "none", transition: "all 0.3s" }} />
        ))}
      </div>

      {/* Vignette */}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.5) 100%)", pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};
