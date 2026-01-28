import confetti from "canvas-confetti"

export function triggerWinConfetti(tier: "legendary" | "mythic") {
  const colors = tier === "mythic" 
    ? ["#ec4899", "#f472b6", "#fbbf24", "#ffffff"] // Pink/gold for mythic
    : ["#10b981", "#34d399", "#fbbf24", "#ffffff"] // Emerald/gold for legendary

  // First burst
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors,
  })

  // Side cannons
  setTimeout(() => {
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors,
    })
    confetti({
      particleCount: 50,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors,
    })
  }, 150)

  // Extra burst for mythic
  if (tier === "mythic") {
    setTimeout(() => {
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.5 },
        colors,
        scalar: 1.2,
      })
    }, 300)
  }
}

export function triggerDepositConfetti() {
  confetti({
    particleCount: 30,
    spread: 50,
    origin: { y: 0.7 },
    colors: ["#10b981", "#34d399", "#6ee7b7"],
  })
}
