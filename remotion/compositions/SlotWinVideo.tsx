import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  spring,
  Sequence,
} from "remotion";

type Tier = "brick" | "mid" | "hot" | "legendary" | "mythic";

export interface SlotWinVideoProps {
  tier: Tier;
  amount: number;
  multiplier: number;
  duration: number;
  username: string;
  walletAddress: string;
}

const TIER_CONFIG: Record<Tier, { label: string; color: string; glow: string; emoji: string }> = {
  brick: { label: "BRICK", color: "#f59e0b", glow: "#f59e0b", emoji: "🧱" },
  mid: { label: "MID", color: "#f97316", glow: "#f97316", emoji: "😐" },
  hot: { label: "HOT", color: "#ef4444", glow: "#ef4444", emoji: "🔥" },
  legendary: { label: "LEGENDARY", color: "#00d4aa", glow: "#00d4aa", emoji: "⚡" },
  mythic: { label: "MYTHIC", color: "#ec4899", glow: "#ec4899", emoji: "🌟" },
};

function formatTokenAmount(amount: number): string {
  const displayAmount = amount / 1_000_000; // Convert from base units (6 decimals)
  if (displayAmount >= 1_000_000_000) return `${(displayAmount / 1_000_000_000).toFixed(2)}B`;
  if (displayAmount >= 1_000_000) return `${(displayAmount / 1_000_000).toFixed(2)}M`;
  if (displayAmount >= 1_000) return `${(displayAmount / 1_000).toFixed(2)}K`;
  return displayAmount.toFixed(0);
}

function formatDuration(hours: number): string {
  if (hours >= 24) return `${Math.round(hours / 24)}d`;
  return `${hours}h`;
}

export const SlotWinVideo: React.FC<SlotWinVideoProps> = ({
  tier,
  amount,
  multiplier,
  duration,
  username,
  walletAddress,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const config = TIER_CONFIG[tier];
  const isWinner = tier === "legendary" || tier === "mythic";

  // Animation timings
  const introEnd = fps * 1; // 1 second
  const mainStart = fps * 1;
  const mainEnd = fps * 4;
  const outroStart = fps * 4;

  // Intro animation
  const introScale = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  // Background pulse for winners
  const pulse = Math.sin(frame * 0.15) * 0.1 + 0.9;

  // Glow intensity
  const glowIntensity = interpolate(frame, [0, 30, 60], [0, 1, 0.7], {
    extrapolateRight: "clamp",
  });

  // Text reveal
  const textOpacity = interpolate(frame, [20, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Stats slide in
  const statsY = spring({
    frame: frame - 45,
    fps,
    config: { damping: 15, stiffness: 80 },
  });

  // Outro fade
  const outroOpacity = interpolate(
    frame,
    [durationInFrames - 30, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 50% 50%, #0a1628 0%, #050a14 100%)`,
        opacity: outroOpacity,
      }}
    >
      {/* Animated background grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            linear-gradient(${config.color}10 1px, transparent 1px),
            linear-gradient(90deg, ${config.color}10 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
          opacity: 0.3,
        }}
      />

      {/* Glow effect */}
      {isWinner && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 600 * pulse,
            height: 600 * pulse,
            background: `radial-gradient(circle, ${config.glow}40 0%, transparent 70%)`,
            filter: `blur(${40 * glowIntensity}px)`,
          }}
        />
      )}

      {/* Main content container */}
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 60,
        }}
      >
        {/* Logo / Brand */}
        <div
          style={{
            position: "absolute",
            top: 40,
            left: 40,
            display: "flex",
            alignItems: "center",
            gap: 12,
            opacity: textOpacity,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: `linear-gradient(135deg, ${config.color}, ${config.color}80)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
            }}
          >
            🎰
          </div>
          <div style={{ color: "#e8f4f8", fontSize: 28, fontWeight: 800, letterSpacing: 2 }}>
            LOCK SLOT
          </div>
        </div>

        {/* Tier emoji burst */}
        <div
          style={{
            fontSize: 120,
            transform: `scale(${introScale})`,
            marginBottom: 20,
            filter: `drop-shadow(0 0 ${30 * glowIntensity}px ${config.glow})`,
          }}
        >
          {config.emoji}
        </div>

        {/* Tier label */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 900,
            color: config.color,
            textShadow: `0 0 ${40 * glowIntensity}px ${config.glow}`,
            letterSpacing: 8,
            opacity: textOpacity,
            marginBottom: 30,
          }}
        >
          {config.label}
        </div>

        {/* Win message for legendary/mythic */}
        {isWinner && (
          <div
            style={{
              fontSize: 36,
              fontWeight: 700,
              color: "#e8f4f8",
              opacity: textOpacity,
              marginBottom: 40,
            }}
          >
            🎉 WINNER! 🎉
          </div>
        )}

        {/* Stats panel */}
        <div
          style={{
            display: "flex",
            gap: 40,
            transform: `translateY(${(1 - statsY) * 50}px)`,
            opacity: statsY,
          }}
        >
          {/* Amount */}
          <div
            style={{
              background: "rgba(10, 22, 40, 0.8)",
              border: `2px solid ${config.color}40`,
              borderRadius: 16,
              padding: "20px 40px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 18, color: "#6b8a9a", marginBottom: 8 }}>STAKED</div>
            <div style={{ fontSize: 42, fontWeight: 800, color: "#e8f4f8", fontFamily: "monospace" }}>
              {formatTokenAmount(amount)}
            </div>
            <div style={{ fontSize: 16, color: config.color }}>$LOCK</div>
          </div>

          {/* Multiplier */}
          <div
            style={{
              background: "rgba(10, 22, 40, 0.8)",
              border: `2px solid ${config.color}40`,
              borderRadius: 16,
              padding: "20px 40px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 18, color: "#6b8a9a", marginBottom: 8 }}>MULTIPLIER</div>
            <div style={{ fontSize: 42, fontWeight: 800, color: config.color, fontFamily: "monospace" }}>
              {multiplier}×
            </div>
          </div>

          {/* Duration */}
          <div
            style={{
              background: "rgba(10, 22, 40, 0.8)",
              border: `2px solid ${config.color}40`,
              borderRadius: 16,
              padding: "20px 40px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 18, color: "#6b8a9a", marginBottom: 8 }}>LOCK TIME</div>
            <div style={{ fontSize: 42, fontWeight: 800, color: "#e8f4f8", fontFamily: "monospace" }}>
              {formatDuration(duration)}
            </div>
          </div>
        </div>

        {/* User info */}
        <div
          style={{
            position: "absolute",
            bottom: 40,
            display: "flex",
            alignItems: "center",
            gap: 16,
            opacity: textOpacity,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${config.color}60, ${config.color}20)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: `2px solid ${config.color}40`,
            }}
          >
            <span style={{ fontSize: 24 }}>👤</span>
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 700, color: "#e8f4f8" }}>
              {username || "Anonymous"}
            </div>
            <div style={{ fontSize: 16, color: "#6b8a9a", fontFamily: "monospace" }}>
              {walletAddress}
            </div>
          </div>
        </div>
      </AbsoluteFill>

      {/* Particle effects for winners */}
      {isWinner && (
        <Sequence from={30}>
          {[...Array(20)].map((_, i) => {
            const angle = (i / 20) * Math.PI * 2;
            const delay = i * 2;
            const particleFrame = frame - 30 - delay;
            const distance = interpolate(particleFrame, [0, 60], [0, 400], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const particleOpacity = interpolate(particleFrame, [0, 30, 60], [0, 1, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });

            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: config.color,
                  boxShadow: `0 0 10px ${config.glow}`,
                  transform: `translate(-50%, -50%) translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px)`,
                  opacity: particleOpacity,
                }}
              />
            );
          })}
        </Sequence>
      )}
    </AbsoluteFill>
  );
};
