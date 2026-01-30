export type AuthAction =
  | "spin"
  | "withdraw"
  | "withdraw_submit"
  | "claim"
  | "get_user"
  | "get_claimable"
  | "set_username"
  | "chat_send"

export interface AuthPayload {
  message: string
  signature: string // base64
  timestamp: number // ms since epoch
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

export function stableStringify(value: unknown): string {
  if (value === null) return "null"
  if (typeof value === "string") return JSON.stringify(value)
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "null"
  if (typeof value === "boolean") return value ? "true" : "false"
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`
  if (isPlainObject(value)) {
    const keys = Object.keys(value).sort()
    return `{${keys.map(k => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(",")}}`
  }
  // Unsupported values become null
  return "null"
}

export function buildAuthMessage(params: {
  action: AuthAction
  walletAddress: string
  timestamp: number
  payload: Record<string, unknown>
}): string {
  const { action, walletAddress, timestamp, payload } = params
  const payloadStr = stableStringify(payload)
  return `LOCKSLOT|${action}|${walletAddress}|${timestamp}|${payloadStr}`
}
