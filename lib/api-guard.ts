import { NextRequest, NextResponse } from "next/server"

type RateLimitEntry = {
  count: number
  resetAtMs: number
}

function getStore(): Map<string, RateLimitEntry> {
  const g = globalThis as unknown as { __lockslotRateLimit?: Map<string, RateLimitEntry> }
  if (!g.__lockslotRateLimit) g.__lockslotRateLimit = new Map()
  return g.__lockslotRateLimit
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

export function rateLimitGate(
  request: NextRequest,
  params: { id: string; windowMs: number; max: number }
): NextResponse | null {
  const ip = getIp(request)
  const key = `${params.id}:${ip}`
  const now = Date.now()

  const store = getStore()
  const existing = store.get(key)

  if (!existing || now >= existing.resetAtMs) {
    store.set(key, { count: 1, resetAtMs: now + params.windowMs })
    return null
  }

  existing.count += 1
  store.set(key, existing)

  if (existing.count > params.max) {
    const retryAfterSec = Math.max(1, Math.ceil((existing.resetAtMs - now) / 1000))
    const res = NextResponse.json(
      { error: "Rate limit exceeded", retryAfterSec },
      { status: 429 }
    )
    res.headers.set("Retry-After", String(retryAfterSec))
    return res
  }

  return null
}
