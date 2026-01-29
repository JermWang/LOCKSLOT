import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { Connection } from "@solana/web3.js"

export const runtime = "nodejs"

function getRpcUrl(): string {
  const urls = process.env.NEXT_PUBLIC_SOLANA_RPC_URLS || process.env.NEXT_PUBLIC_SOLANA_RPC_URL
  if (!urls) return "https://api.mainnet-beta.solana.com"
  const first = urls
    .split(",")
    .map((u) => u.trim())
    .filter(Boolean)[0]
  return first || "https://api.mainnet-beta.solana.com"
}

function requireCronAuth(request: NextRequest): NextResponse | null {
  const envSecret = process.env.CRON_SECRET
  const secret = envSecret?.trim() || ""
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 })
  }

  const headerSecret = request.headers.get("x-cron-secret")?.trim() || null
  const authHeader = request.headers.get("authorization")?.trim() || ""
  const bearerMatch = authHeader.match(/^Bearer\s+(.+)$/i)
  const bearer = bearerMatch ? bearerMatch[1]?.trim() || null : null
  const querySecret = new URL(request.url).searchParams.get("secret")?.trim() || null

  if (headerSecret !== secret && bearer !== secret && querySecret !== secret) {
    return NextResponse.json(
      {
        error: "Unauthorized",
        auth: {
          hasXcronSecret: !!headerSecret,
          hasAuthorization: !!authHeader,
          hasQuerySecret: !!querySecret,
        },
      },
      { status: 401 }
    )
  }

  return null
}

async function handler(request: NextRequest) {
  try {
    const unauthorized = requireCronAuth(request)
    if (unauthorized) return unauthorized

    const supabase = createServerClient()
    const connection = new Connection(getRpcUrl(), "confirmed")

    const pendingTimeoutMin = Number(process.env.WITHDRAW_PENDING_TIMEOUT_MIN || 15)
    const pendingTimeoutMs = Math.max(1, pendingTimeoutMin) * 60_000

    const { data: rows, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("type", "withdraw")
      .order("created_at", { ascending: false })
      .limit(200)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const nowMs = Date.now()

    let checked = 0
    let finalized = 0
    let failed = 0
    let skipped = 0
    const errors: Array<{ txId: string; op: string; message: string }> = []

    for (const tx of rows || []) {
      const status = (tx?.metadata as any)?.status as string | undefined

      if (status !== "pending" && status !== "submitted") {
        skipped += 1
        continue
      }

      checked += 1

      const createdAtMs = new Date(tx.created_at).getTime()
      const ageMs = nowMs - createdAtMs

      const sig = tx.tx_signature as string | null

      if (!sig) {
        if (status === "pending" && ageMs >= pendingTimeoutMs) {
          const { error: failErr } = await supabase.rpc("fail_withdrawal", {
            p_tx_id: tx.id,
            p_reason: "reconcile_timeout",
          })
          if (!failErr) failed += 1
          else errors.push({ txId: tx.id, op: "fail_withdrawal(timeout)", message: failErr.message })
        }
        continue
      }

      const sigStatus = await connection.getSignatureStatus(sig, { searchTransactionHistory: true })
      const st = sigStatus.value

      if (!st) {
        continue
      }

      if (st.err) {
        const { error: failErr } = await supabase.rpc("fail_withdrawal", {
          p_tx_id: tx.id,
          p_reason: "onchain_failed",
        })
        if (!failErr) failed += 1
        else errors.push({ txId: tx.id, op: "fail_withdrawal(onchain_failed)", message: failErr.message })
        continue
      }

      if (st.confirmationStatus === "finalized") {
        const { error: finalizeErr } = await supabase.rpc("finalize_withdrawal", {
          p_tx_id: tx.id,
          p_tx_signature: sig,
        })
        if (!finalizeErr) finalized += 1
        else errors.push({ txId: tx.id, op: "finalize_withdrawal", message: finalizeErr.message })
      }
    }

    return NextResponse.json({
      ok: true,
      checked,
      finalized,
      failed,
      skipped,
      errors,
    })
  } catch (error: any) {
    console.error("reconcile-withdrawals error:", error)
    return NextResponse.json(
      { error: "Internal server error", detail: error?.message || String(error) },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  return handler(request)
}

export async function POST(request: NextRequest) {
  return handler(request)
}
