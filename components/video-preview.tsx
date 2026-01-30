"use client"

import { useState } from "react"
import { Player } from "@remotion/player"
import { SlotWinVideo } from "@/remotion/compositions/SlotWinVideo"
import { X, Play, Download, Share2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import type { Tier } from "@/lib/game-types"

interface VideoPreviewProps {
  isOpen: boolean
  onClose: () => void
  tier: Tier
  amount: number
  multiplier: number
  duration: number
  username?: string
  walletAddress?: string
}

export function VideoPreview({
  isOpen,
  onClose,
  tier,
  amount,
  multiplier,
  duration,
  username = "Anonymous",
  walletAddress = "...",
}: VideoPreviewProps) {
  const [isPlaying, setIsPlaying] = useState(true)

  const handleShare = async () => {
    const shareData = {
      title: `Lock Slot - ${tier.toUpperCase()} Result!`,
      text: `I just hit ${tier.toUpperCase()} on Lock Slot! ${multiplier}× multiplier, ${duration >= 24 ? `${Math.round(duration / 24)}d` : `${duration}h`} lock. 🎰`,
      url: window.location.origin,
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (err) {
        console.log("Share cancelled")
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(
        `${shareData.text}\n${shareData.url}`
      )
      alert("Copied to clipboard!")
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative bg-[#0a1628] rounded-2xl overflow-hidden border border-[#1a3a4a] shadow-2xl max-w-lg w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#1a3a4a]">
              <h3 className="text-lg font-bold text-[#e8f4f8]">
                Share Your {tier.toUpperCase()} Result
              </h3>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-[#1a3a4a] transition-colors"
              >
                <X className="h-5 w-5 text-[#6b8a9a]" />
              </button>
            </div>

            {/* Video Player */}
            <div className="aspect-square bg-black">
              <Player
                component={SlotWinVideo}
                inputProps={{
                  tier,
                  amount,
                  multiplier,
                  duration,
                  username,
                  walletAddress,
                }}
                durationInFrames={150}
                fps={30}
                compositionWidth={1080}
                compositionHeight={1080}
                style={{
                  width: "100%",
                  height: "100%",
                }}
                controls
                autoPlay
                loop
              />
            </div>

            {/* Actions */}
            <div className="p-4 flex gap-3">
              <button
                onClick={handleShare}
                className={cn(
                  "flex-1 py-3 rounded-lg font-semibold text-sm transition-all duration-200",
                  "bg-gradient-to-r from-[#00d4aa] to-[#00b4d8] text-[#0a1628]",
                  "hover:from-[#00d4aa]/90 hover:to-[#00b4d8]/90",
                  "flex items-center justify-center gap-2"
                )}
              >
                <Share2 className="h-4 w-4" />
                Share Result
              </button>
            </div>

            {/* Info text */}
            <p className="px-4 pb-4 text-[10px] text-[#6b8a9a] text-center">
              Share your spin result on social media! Video rendering coming soon.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
