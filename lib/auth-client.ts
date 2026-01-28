import { buildAuthMessage, type AuthAction, type AuthPayload } from "@/lib/auth-shared"

function getProvider():
  | { signMessage: (message: Uint8Array) => Promise<any>; publicKey?: { toString: () => string } }
  | null {
  if (typeof window === "undefined") return null
  const phantom = (window as any).solana
  if (phantom?.isPhantom && typeof phantom.signMessage === "function") return phantom
  const solflare = (window as any).solflare
  if (solflare?.isSolflare && typeof solflare.signMessage === "function") return solflare
  return null
}

function toBase64(bytes: Uint8Array): string {
  if (typeof window !== "undefined" && typeof window.btoa === "function") {
    let binary = ""
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
    return window.btoa(binary)
  }
  const nodeBuffer = (globalThis as any).Buffer
  if (nodeBuffer?.from) {
    return nodeBuffer.from(bytes).toString("base64")
  }
  throw new Error("Base64 encoding unavailable")
}

export async function signAuth(params: {
  action: AuthAction
  walletAddress: string
  payload: Record<string, unknown>
  timestamp?: number
}): Promise<AuthPayload> {
  const provider = getProvider()
  if (!provider) throw new Error("Wallet does not support message signing")

  const timestamp = params.timestamp ?? Date.now()
  const message = buildAuthMessage({
    action: params.action,
    walletAddress: params.walletAddress,
    timestamp,
    payload: params.payload,
  })

  const encoded = new TextEncoder().encode(message)
  const signed = await provider.signMessage(encoded)

  const signatureBytes: Uint8Array =
    signed?.signature instanceof Uint8Array
      ? signed.signature
      : signed instanceof Uint8Array
        ? signed
        : signed?.signature?.data
          ? new Uint8Array(signed.signature.data)
          : (() => {
              throw new Error("Unsupported signMessage return format")
            })()

  return {
    message,
    signature: toBase64(signatureBytes),
    timestamp,
  }
}
