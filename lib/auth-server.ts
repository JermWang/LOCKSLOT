import crypto from "crypto"
import { PublicKey } from "@solana/web3.js"
import { buildAuthMessage, type AuthAction, type AuthPayload } from "@/lib/auth-shared"

function fromBase64(value: string): Uint8Array {
  return new Uint8Array(Buffer.from(value, "base64"))
}

function createEd25519Spki(publicKeyBytes: Uint8Array): Buffer {
  // ASN.1 SubjectPublicKeyInfo prefix for Ed25519
  const prefix = Buffer.from("302a300506032b6570032100", "hex")
  return Buffer.concat([prefix, Buffer.from(publicKeyBytes)])
}

export function verifyAuth(params: {
  action: AuthAction
  walletAddress: string
  payload: Record<string, unknown>
  auth: AuthPayload
  maxAgeMs?: number
}): { ok: true } | { ok: false; error: string } {
  const { action, walletAddress, payload, auth } = params
  const maxAgeMs = params.maxAgeMs ?? 2 * 60 * 1000

  if (!auth?.message || !auth?.signature || !auth?.timestamp) {
    return { ok: false, error: "Missing auth fields" }
  }

  const now = Date.now()
  if (Math.abs(now - auth.timestamp) > maxAgeMs) {
    return { ok: false, error: "Auth expired" }
  }

  const expectedMessage = buildAuthMessage({
    action,
    walletAddress,
    timestamp: auth.timestamp,
    payload,
  })

  if (auth.message !== expectedMessage) {
    return { ok: false, error: "Auth message mismatch" }
  }

  let pubkeyBytes: Uint8Array
  try {
    pubkeyBytes = new PublicKey(walletAddress).toBytes()
  } catch {
    return { ok: false, error: "Invalid wallet address" }
  }

  const keyObject = crypto.createPublicKey({
    key: createEd25519Spki(pubkeyBytes),
    format: "der",
    type: "spki",
  })

  const ok = crypto.verify(
    null,
    Buffer.from(auth.message, "utf8"),
    keyObject,
    Buffer.from(fromBase64(auth.signature))
  )

  if (!ok) return { ok: false, error: "Invalid signature" }
  return { ok: true }
}
