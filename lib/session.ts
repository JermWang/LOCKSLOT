import crypto from "crypto"
import type { NextRequest } from "next/server"

export const SESSION_COOKIE = "lockslot_session"

const DEFAULT_TTL_MS = 1000 * 60 * 60 * 12 // 12h
const SESSION_TTL_MS = Number(process.env.SESSION_TTL_MS) || DEFAULT_TTL_MS

function getSecret(): string | null {
  return process.env.SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || null
}

function base64UrlEncode(value: string | Buffer): string {
  return Buffer.from(value).toString("base64url")
}

function base64UrlDecode(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8")
}

export function signSession(walletAddress: string): { token: string; expiresAt: number } {
  const secret = getSecret()
  if (!secret) {
    throw new Error("SESSION_SECRET not configured")
  }

  const now = Date.now()
  const payload = JSON.stringify({
    walletAddress,
    iat: now,
    exp: now + SESSION_TTL_MS,
  })

  const body = base64UrlEncode(payload)
  const signature = crypto.createHmac("sha256", secret).update(body).digest("base64url")

  return { token: `${body}.${signature}`, expiresAt: now + SESSION_TTL_MS }
}

export function verifySession(token: string):
  | { ok: true; walletAddress: string; exp: number }
  | { ok: false; error: string } {
  const secret = getSecret()
  if (!secret) {
    return { ok: false, error: "SESSION_SECRET not configured" }
  }

  const [body, signature] = token.split(".")
  if (!body || !signature) {
    return { ok: false, error: "Invalid session token" }
  }

  const expected = crypto.createHmac("sha256", secret).update(body).digest()
  const received = Buffer.from(signature, "base64url")
  if (received.length !== expected.length || !crypto.timingSafeEqual(received, expected)) {
    return { ok: false, error: "Invalid session token" }
  }

  let payload: { walletAddress?: string; exp?: number }
  try {
    payload = JSON.parse(base64UrlDecode(body))
  } catch {
    return { ok: false, error: "Invalid session payload" }
  }

  if (!payload.walletAddress || !payload.exp) {
    return { ok: false, error: "Invalid session payload" }
  }

  if (Date.now() > payload.exp) {
    return { ok: false, error: "Session expired" }
  }

  return { ok: true, walletAddress: payload.walletAddress, exp: payload.exp }
}

export function getSessionFromRequest(request: NextRequest):
  | { ok: true; walletAddress: string; exp: number }
  | { ok: false; error: string } {
  const token = request.cookies.get(SESSION_COOKIE)?.value
  if (!token) {
    return { ok: false, error: "Missing session" }
  }

  return verifySession(token)
}
