const TOKEN_DECIMALS = Number(process.env.NEXT_PUBLIC_TOKEN_DECIMALS) || 6
const TOKEN_BASE_UNITS = Math.pow(10, TOKEN_DECIMALS)

function toBaseUnits(amountTokens: number): number {
  return Math.round(amountTokens * TOKEN_BASE_UNITS)
}

function fromBaseUnits(amountBase: number): number {
  return amountBase / TOKEN_BASE_UNITS
}

function formatTokenAmount(amountTokens: number): string {
  if (amountTokens >= 1_000_000_000) return `${(amountTokens / 1_000_000_000).toFixed(2)}B`
  if (amountTokens >= 1_000_000) return `${(amountTokens / 1_000_000).toFixed(2)}M`
  if (amountTokens >= 1_000) return `${(amountTokens / 1_000).toFixed(2)}K`
  if (amountTokens >= 1) return amountTokens.toFixed(0)
  return amountTokens.toFixed(2)
}

function formatTokenAmountFromBase(amountBase: number): string {
  return formatTokenAmount(fromBaseUnits(amountBase))
}

function formatTokenAmountFull(amountTokens: number): string {
  return amountTokens.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: TOKEN_DECIMALS,
  })
}

function formatTokenAmountFullFromBase(amountBase: number): string {
  return formatTokenAmountFull(fromBaseUnits(amountBase))
}

export {
  TOKEN_DECIMALS,
  toBaseUnits,
  fromBaseUnits,
  formatTokenAmount,
  formatTokenAmountFromBase,
  formatTokenAmountFull,
  formatTokenAmountFullFromBase,
}
