import { toast } from "sonner"
import { triggerWinConfetti, triggerDepositConfetti } from "./confetti"
import { gameSounds } from "./sounds"

export const gameToast = {
  deposit: (amount: number) => {
    triggerDepositConfetti()
    gameSounds.deposit()
    toast.success("Deposit Confirmed", {
      description: `${amount.toLocaleString()} tokens added to your balance`,
      duration: 4000,
    })
  },

  withdraw: (amount: number) => {
    gameSounds.withdraw()
    toast.success("Withdrawal Sent", {
      description: `${amount.toLocaleString()} tokens sent to your wallet`,
      duration: 4000,
    })
  },

  spin: (tier: string, multiplier: number, duration: number) => {
    const isWin = tier === "legendary" || tier === "mythic"
    
    if (isWin) {
      triggerWinConfetti(tier as "legendary" | "mythic")
      toast.success(`🎉 ${tier.toUpperCase()} WIN!`, {
        description: `${multiplier}× multiplier • ${duration} day lock`,
        duration: 6000,
      })
    } else {
      toast.info(`${tier.toUpperCase()}`, {
        description: `${multiplier}× • ${duration} day lock`,
        duration: 3000,
      })
    }
  },

  claim: (principal: number, bonus: number) => {
    const total = principal + bonus
    gameSounds.claim()
    toast.success("Claim Successful!", {
      description: `${principal.toLocaleString()} principal + ${bonus.toLocaleString()} bonus = ${total.toLocaleString()} tokens`,
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
