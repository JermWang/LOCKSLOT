"use client"

import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

interface ArcGaugeProps {
  value: number // Current value (e.g., hours)
  max?: number // Maximum value (default 48)
  min?: number // Minimum value (default 1)
  size?: number
  strokeWidth?: number
  className?: string
  showValue?: boolean
  label?: string
  animated?: boolean
}

export function ArcGauge({
  value,
  max = 48,
  min = 1,
  size = 120,
  strokeWidth = 8,
  className,
  showValue = true,
  label = "LOCK",
  animated = true,
}: ArcGaugeProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const arcLength = circumference * 0.75 // 270 degrees
  
  // Normalize value to 0-1 range
  const normalizedValue = Math.max(0, Math.min(1, (value - min) / (max - min)))
  const fillLength = arcLength * normalizedValue
  
  // Color based on duration (shorter = better)
  const getColor = () => {
    if (value <= 8) return "hsl(160, 50%, 50%)" // Legendary/Mythic range - teal
    if (value <= 18) return "hsl(28, 50%, 55%)" // Hot range - copper
    if (value <= 36) return "hsl(45, 35%, 50%)" // Mid range - brass
    return "hsl(20, 35%, 42%)" // Brick range - bronze
  }

  const formatValue = () => {
    if (value >= 24) {
      return `${(value / 24).toFixed(1)}d`
    }
    return `${value}h`
  }

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-[135deg]"
      >
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(220, 10%, 20%)"
          strokeWidth={strokeWidth}
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeLinecap="round"
          className="opacity-60"
        />
        
        {/* Tick marks */}
        {[0, 0.25, 0.5, 0.75, 1].map((tick, i) => {
          const angle = -135 + (tick * 270)
          const tickRadius = radius + strokeWidth / 2 + 4
          const x = size / 2 + tickRadius * Math.cos((angle * Math.PI) / 180)
          const y = size / 2 + tickRadius * Math.sin((angle * Math.PI) / 180)
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={1.5}
              fill="hsl(220, 8%, 40%)"
              className="transform rotate-[135deg] origin-center"
            />
          )
        })}
        
        {/* Value arc */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getColor()}
          strokeWidth={strokeWidth}
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeLinecap="round"
          initial={animated ? { strokeDashoffset: arcLength } : { strokeDashoffset: arcLength - fillLength }}
          animate={{ strokeDashoffset: arcLength - fillLength }}
          transition={{ 
            duration: 0.8, 
            ease: [0.34, 1.56, 0.64, 1] // easeOutBack
          }}
          style={{
            filter: value <= 8 ? `drop-shadow(0 0 6px ${getColor()})` : 'none'
          }}
        />
      </svg>
      
      {/* Center content */}
      {showValue && (
        <div className="absolute inset-0 flex flex-col items-center justify-center transform rotate-0">
          <span 
            className="text-xl font-mono font-bold tracking-tight"
            style={{ color: getColor() }}
          >
            {formatValue()}
          </span>
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
            {label}
          </span>
        </div>
      )}
    </div>
  )
}

// Compact version for inline display
export function ArcGaugeMini({
  value,
  max = 48,
  size = 48,
  className,
}: {
  value: number
  max?: number
  size?: number
  className?: string
}) {
  const radius = (size - 4) / 2
  const circumference = 2 * Math.PI * radius
  const arcLength = circumference * 0.75
  const normalizedValue = Math.max(0, Math.min(1, value / max))
  const fillLength = arcLength * normalizedValue

  const getColor = () => {
    if (value <= 8) return "hsl(160, 50%, 50%)"
    if (value <= 18) return "hsl(28, 50%, 55%)"
    if (value <= 36) return "hsl(45, 35%, 50%)"
    return "hsl(20, 35%, 42%)"
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={cn("transform -rotate-[135deg]", className)}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="hsl(220, 10%, 20%)"
        strokeWidth={4}
        strokeDasharray={`${arcLength} ${circumference}`}
        strokeLinecap="round"
        opacity={0.5}
      />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={getColor()}
        strokeWidth={4}
        strokeDasharray={`${arcLength} ${circumference}`}
        strokeLinecap="round"
        initial={{ strokeDashoffset: arcLength }}
        animate={{ strokeDashoffset: arcLength - fillLength }}
        transition={{ duration: 0.6, ease: [0.34, 1.3, 0.64, 1] }}
      />
    </svg>
  )
}
