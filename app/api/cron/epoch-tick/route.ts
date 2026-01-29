import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { createServerClient } from "@/lib/supabase"

export const runtime = "nodejs"

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

function sha256Hex(value: string): string {
  return crypto.createHash("sha256").update(value, "utf8").digest("hex")
}

function randomSeedHex(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("hex")
}

async function handler(request: NextRequest) {
  try {
    const unauthorized = requireCronAuth(request)
    if (unauthorized) return unauthorized

    const supabase = createServerClient()

    const durationHours = Number(process.env.EPOCH_DURATION_HOURS || 168)
    const durationMs = Math.max(1, durationHours) * 60 * 60 * 1000

    const now = new Date()

    const { data: activeEpoch, error: activeError } = await supabase
      .from("epochs")
      .select("*")
      .eq("status", "active")
      .order("start_time", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (activeError) {
      return NextResponse.json({ error: activeError.message }, { status: 500 })
    }

    if (activeEpoch && new Date(activeEpoch.end_time).getTime() > now.getTime()) {
      return NextResponse.json({ ok: true, action: "noop", activeEpoch })
    }

    // Close current epoch (if exists)
    let rollover = 0
    let closedEpochId: string | null = null

    if (activeEpoch) {
      closedEpochId = activeEpoch.id

      const { data: secretRow, error: secretError } = await supabase
        .from("epoch_secrets")
        .select("server_seed")
        .eq("epoch_id", activeEpoch.id)
        .maybeSingle()

      if (secretError) {
        return NextResponse.json(
          { error: "Failed to load epoch secret", detail: secretError.message },
          { status: 500 }
        )
      }

      const serverSeed = (secretRow as any)?.server_seed as string | undefined
      if (!serverSeed) {
        return NextResponse.json({ error: "Missing epoch server seed" }, { status: 500 })
      }

      const computedHash = sha256Hex(serverSeed)
      if (computedHash !== activeEpoch.server_seed_hash) {
        return NextResponse.json({ error: "Epoch server seed mismatch" }, { status: 500 })
      }

      rollover = Number(activeEpoch.reward_pool || 0)

      // Mark completed + reveal seed
      const { error: closeErr } = await supabase
        .from("epochs")
        .update({ status: "completed", server_seed: serverSeed })
        .eq("id", activeEpoch.id)

      if (closeErr) {
        return NextResponse.json({ error: closeErr.message }, { status: 500 })
      }
    }

    // Determine next epoch number
    const { data: lastEpoch, error: lastErr } = await supabase
      .from("epochs")
      .select("epoch_number")
      .order("epoch_number", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (lastErr) {
      return NextResponse.json({ error: lastErr.message }, { status: 500 })
    }

    const nextEpochNumber = (lastEpoch?.epoch_number ?? 0) + 1

    const nextSeed = randomSeedHex(32)
    const nextSeedHash = sha256Hex(nextSeed)

    const startTime = now
    const endTime = new Date(now.getTime() + durationMs)

    // Create new epoch
    const { data: newEpochRows, error: insertErr } = await supabase
      .from("epochs")
      .insert({
        epoch_number: nextEpochNumber,
        server_seed_hash: nextSeedHash,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        reward_pool: Math.max(0, rollover),
        status: "active",
      })
      .select()
      .limit(1)

    if (insertErr || !newEpochRows || newEpochRows.length === 0) {
      // If another scheduler already created an active epoch, return it.
      const { data: existingActive } = await supabase
        .from("epochs")
        .select("*")
        .eq("status", "active")
        .order("start_time", { ascending: false })
        .limit(1)
        .maybeSingle()

      return NextResponse.json({
        ok: false,
        error: insertErr?.message || "Failed to create epoch",
        existingActive: existingActive ?? null,
      })
    }

    const newEpoch = newEpochRows[0] as any

    const { error: secretInsertErr } = await supabase
      .from("epoch_secrets")
      .insert({ epoch_id: newEpoch.id, server_seed: nextSeed })

    if (secretInsertErr) {
      return NextResponse.json(
        { error: "Failed to persist epoch secret", detail: secretInsertErr.message },
        { status: 500 }
      )
    }

    // If we rolled over pool from a closed epoch, move it out of the previous epoch for clarity.
    if (closedEpochId && rollover > 0) {
      await supabase
        .from("epochs")
        .update({ reward_pool: 0 })
        .eq("id", closedEpochId)

      const { error: ledgerErr } = await supabase.from("reward_pool_ledger").insert([
        {
          epoch_id: closedEpochId,
          type: "rollover_out",
          amount: rollover,
          description: "Rollover to next epoch",
        },
        {
          epoch_id: newEpoch.id,
          type: "rollover_in",
          amount: rollover,
          description: "Rollover from previous epoch",
        },
      ])

      if (ledgerErr) {
        return NextResponse.json(
          { error: "Failed to write rollover ledger", detail: ledgerErr.message },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      ok: true,
      action: activeEpoch ? "closed_and_created" : "created",
      closedEpochId,
      newEpoch: {
        id: newEpoch.id,
        epochNumber: newEpoch.epoch_number,
        startTime: newEpoch.start_time,
        endTime: newEpoch.end_time,
        rewardPool: newEpoch.reward_pool,
        serverSeedHash: newEpoch.server_seed_hash,
      },
    })
  } catch (error: any) {
    console.error("epoch-tick error:", error)
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
