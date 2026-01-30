import { NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth-server"
import { rateLimitGate } from "@/lib/api-guard"
import { signSession, SESSION_COOKIE } from "@/lib/session"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    const limited = await rateLimitGate(request, { id: "session", windowMs: 10_000, max: 20 })
    if (limited) return limited

    const { walletAddress, auth } = await request.json()

    if (!walletAddress || !auth) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const authResult = verifyAuth({
      action: "session",
      walletAddress,
      payload: { scope: "session" },
      auth,
    })

    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: 401 })
    }

    const { token, expiresAt } = signSession(walletAddress)

    const response = NextResponse.json({ success: true, expiresAt })
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: new Date(expiresAt),
    })

    return response
  } catch (error) {
    console.error("Session error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
