import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { verifyAuth } from "@/lib/auth-server"
import { rateLimitGate } from "@/lib/api-guard"

export const runtime = "nodejs"

function clampInt(value: string | null, fallback: number, min: number, max: number): number {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  const i = Math.floor(n)
  return Math.max(min, Math.min(max, i))
}

export async function GET(request: NextRequest) {
  try {
    const limited = await rateLimitGate(request, { id: "chat_get", windowMs: 10_000, max: 60 })
    if (limited) return limited

    const { searchParams } = new URL(request.url)
    const limit = clampInt(searchParams.get("limit"), 50, 1, 200)
    const after = searchParams.get("after")

    const supabase = createServerClient()

    let query = supabase
      .from("chat_messages")
      .select("id,wallet_address,message,created_at,users(username)")
      .order("created_at", { ascending: false })
      .limit(limit)

    if (after) {
      const afterMs = Date.parse(after)
      if (Number.isFinite(afterMs)) {
        query = query.gt("created_at", new Date(afterMs).toISOString())
      }
    }

    const { data, error } = await query
    if (error) {
      return NextResponse.json({ error: "Failed to load chat" }, { status: 500 })
    }

    const messages = (data || [])
      .map((row: any) => ({
        id: row.id,
        walletAddress: row.wallet_address,
        username: row.users?.username ?? null,
        message: row.message,
        createdAt: row.created_at,
      }))
      .reverse()

    return NextResponse.json({ messages })
  } catch (error) {
    console.error("Chat get error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const limited = await rateLimitGate(request, { id: "chat_post", windowMs: 10_000, max: 30 })
    if (limited) return limited

    const { walletAddress, message, auth } = await request.json()

    if (!walletAddress || !message || !auth) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const cleanMessage = String(message).trim()
    if (!cleanMessage) {
      return NextResponse.json({ error: "Empty message" }, { status: 400 })
    }

    if (cleanMessage.length > 200) {
      return NextResponse.json({ error: "Message too long" }, { status: 400 })
    }

    const authResult = verifyAuth({
      action: "chat_send",
      walletAddress,
      payload: { message: cleanMessage },
      auth,
    })

    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: 401 })
    }

    const supabase = createServerClient()

    let { data: user } = await supabase
      .from("users")
      .select("id,username")
      .eq("wallet_address", walletAddress)
      .single()

    if (!user) {
      const { data: created, error: createError } = await supabase
        .from("users")
        .insert({ wallet_address: walletAddress, balance: 0 })
        .select("id,username")
        .single()

      if (createError) {
        return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
      }

      user = created
    }

    const { data: inserted, error: insertError } = await supabase
      .from("chat_messages")
      .insert({
        user_id: user.id,
        wallet_address: walletAddress,
        message: cleanMessage,
      })
      .select("id,wallet_address,message,created_at")
      .single()

    if (insertError || !inserted) {
      return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
    }

    return NextResponse.json({
      message: {
        id: inserted.id,
        walletAddress: inserted.wallet_address,
        username: user.username ?? null,
        message: inserted.message,
        createdAt: inserted.created_at,
      },
    })
  } catch (error) {
    console.error("Chat post error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
