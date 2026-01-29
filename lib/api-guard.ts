import { NextRequest, NextResponse } from "next/server"

type RateLimitParams = { id: string; windowMs: number; max: number }

type RateLimitEntry = {
  count: number
  resetAtMs: number
}

type RateLimitResult =
  | { ok: true }
  | { ok: false; retryAfterSec: number }

function getStore(): Map<string, RateLimitEntry> {
  const g = globalThis as unknown as { __lockslotRateLimit?: Map<string, RateLimitEntry> }
  if (!g.__lockslotRateLimit) g.__lockslotRateLimit = new Map()
  return g.__lockslotRateLimit
}

async function rateLimitUpstash(key: string, params: RateLimitParams): Promise<RateLimitResult> {
  // Lazy import so local dev doesn't require the package and so the module stays edge-safe
  const { Redis } = await import("@upstash/redis")
  const { Ratelimit } = await import("@upstash/ratelimit")

  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) {
    return { ok: true }
  }

  const redis = new Redis({ url, token })
  const ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(params.max, `${params.windowMs} ms`),
    prefix: `lockslot:${params.id}`,
  })

  const result = await ratelimit.limit(key)
  if (result.success) return { ok: true }
  const resetMs = result.reset ? result.reset - Date.now() : params.windowMs
  const retryAfterSec = Math.max(1, Math.ceil(resetMs / 1000))
  return { ok: false, retryAfterSec }
}

function rateLimitMemory(key: string, params: RateLimitParams): RateLimitResult {
  const now = Date.now()

  const store = getStore()
  const existing = store.get(key)

  if (!existing || now >= existing.resetAtMs) {
    store.set(key, { count: 1, resetAtMs: now + params.windowMs })
    return { ok: true }
  }

  existing.count += 1
  store.set(key, existing)

  if (existing.count > params.max) {
    const retryAfterSec = Math.max(1, Math.ceil((existing.resetAtMs - now) / 1000))
    return { ok: false, retryAfterSec }
  }

  return { ok: true }
}

function getIp(request: NextRequest): string {
  const xf = request.headers.get("x-forwarded-for")
  if (xf) return xf.split(",")[0]?.trim() || "unknown"
  const xr = request.headers.get("x-real-ip")
  if (xr) return xr.trim()
  return "unknown"
}

export function maintenanceGate(): NextResponse | null {
  if (process.env.MAINTENANCE_MODE === "true") {
    return NextResponse.json({ error: "Maintenance mode" }, { status: 503 })
  }
  return null
}

export async function rateLimitGate(
  request: NextRequest,
  params: RateLimitParams
): Promise<NextResponse | null> {
  const ip = getIp(request)
  const key = `${params.id}:${ip}`

  // Prefer shared rate limiting in production if Upstash is configured.
  // Fall back to in-memory limiter (sufficient for local dev).
  let verdict: RateLimitResult
  const hasUpstash =
    !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN

  if (!hasUpstash) {
    verdict = rateLimitMemory(key, params)
  } else {
    try {
      verdict = await rateLimitUpstash(key, params)
    } catch {
      verdict = rateLimitMemory(key, params)
    }
  }

  if (verdict.ok) return null

  const res = NextResponse.json(
    { error: "Rate limit exceeded", retryAfterSec: verdict.retryAfterSec },
    { status: 429 }
  )
  res.headers.set("Retry-After", String(verdict.retryAfterSec))
  return res
}
