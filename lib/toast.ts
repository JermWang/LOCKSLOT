import { toast } from "sonner"
import { triggerWinConfetti, triggerDepositConfetti } from "./confetti"
import { gameSounds } from "./sounds"
import { formatTokenAmountFromBase } from "./token-utils"

const SOLSCAN_BASE = "https://solscan.io/tx"

function getSolscanLink(txSignature: string): string {
  return `${SOLSCAN_BASE}/${txSignature}`
}

export const gameToast = {
  deposit: (amount: number, txSignature?: string) => {
    triggerDepositConfetti()
    gameSounds.deposit()
    toast.success("Deposit Confirmed", {
      description: txSignature 
        ? `${formatTokenAmountFromBase(amount)} tokens added` 
        : `${formatTokenAmountFromBase(amount)} tokens added to your balance`,
      action: txSignature ? {
        label: "View TX",
        onClick: () => window.open(getSolscanLink(txSignature), "_blank"),
      } : undefined,
      duration: 4000,
    })
  },

  depositPending: (amount: number, txSignature?: string) => {
    toast.info("Deposit Pending", {
      description: `${formatTokenAmountFromBase(amount)} tokens pending confirmations`,
      action: txSignature ? {
        label: "View TX",
        onClick: () => window.open(getSolscanLink(txSignature), "_blank"),
      } : undefined,
      duration: 4000,
    })
  },

  withdraw: (amount: number, txSignature?: string) => {
    gameSounds.withdraw()
    toast.success("Withdrawal Sent", {
      description: `${formatTokenAmountFromBase(amount)} tokens sent to your wallet`,
      action: txSignature ? {
        label: "View TX",
        onClick: () => window.open(getSolscanLink(txSignature), "_blank"),
      } : undefined,
      duration: 4000,
    })
  },

  spin: (tier: string, multiplier: number, duration: number, txSignature?: string) => {
    const isWin = tier === "legendary" || tier === "mythic"
    const durationStr = duration >= 24 ? `${Math.round(duration / 24 * 10) / 10}d` : `${duration}h`
    
    if (isWin) {
      triggerWinConfetti(tier as "legendary" | "mythic")
      toast.success(`🎉 ${tier.toUpperCase()} WIN!`, {
        description: `${multiplier}× multiplier • ${durationStr} lock`,
        action: txSignature ? {
          label: "View TX",
          onClick: () => window.open(getSolscanLink(txSignature), "_blank"),
        } : undefined,
        duration: 6000,
      })
    } else {
      toast.info(`${tier.toUpperCase()}`, {
        description: `${multiplier}× • ${durationStr} lock`,
        action: txSignature ? {
          label: "View TX",
          onClick: () => window.open(getSolscanLink(txSignature), "_blank"),
        } : undefined,
        duration: 3000,
      })
    }
  },

  claim: (principal: number, bonus: number, txSignature?: string) => {
    const total = principal + bonus
    gameSounds.claim()
    toast.success("Claim Successful!", {
      description: `${formatTokenAmountFromBase(principal)} principal + ${formatTokenAmountFromBase(bonus)} bonus = ${formatTokenAmountFromBase(total)} tokens`,
      action: txSignature ? {
        label: "View TX",
        onClick: () => window.open(getSolscanLink(txSignature), "_blank"),
      } : undefined,
      duration: 5000,
    })
  },

  unlocked: (spinId: string) => {
    toast.info("Lock Unlocked! 🔓", {
      description: "Your stake is ready to claim",
      duration: 4000,
    })
  },

  error: (message: string) => {
    toast.error("Error", {
      description: message,
      duration: 5000,
    })
  },

  walletConnected: (address: string) => {
    toast.success("Wallet Connected", {
      description: `${address.slice(0, 4)}...${address.slice(-4)}`,
      duration: 3000,
    })
  },

  walletDisconnected: () => {
    toast.info("Wallet Disconnected", {
      duration: 2000,
    })
  },
}
