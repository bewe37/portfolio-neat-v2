import { Redis } from "@upstash/redis"
import { NextRequest, NextResponse } from "next/server"

const kv = new Redis({
  url:   (process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL)!,
  token: (process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN)!,
})

const KEY    = "companions:v1"
const MAX    = 1000         // keep the 1000 most recent drawings
const RL_KEY = (ip: string, slot: number) => `rl:companion:${ip}:${slot}`
const RL_MAX = 100          // max submissions per IP per 24 h
const RL_TTL = 60 * 60 * 24

export async function GET() {
  try {
    const companions = await kv.lrange<string>(KEY, 0, -1)
    return NextResponse.json({ companions: companions ?? [] })
  } catch {
    return NextResponse.json({ companions: [] })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json() as { url?: string }

    if (typeof url !== "string" || !url.startsWith("data:image/png;base64,")) {
      return NextResponse.json({ error: "Invalid" }, { status: 400 })
    }
    if (url.length > 4000) {
      return NextResponse.json({ error: "Too large" }, { status: 400 })
    }

    // Max 5 submissions per IP per 24 h
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
    let slot = 0
    while (slot < RL_MAX && await kv.get(RL_KEY(ip, slot))) slot++
    if (slot >= RL_MAX) {
      return NextResponse.json({ error: "Rate limited" }, { status: 429 })
    }

    await kv.lpush(KEY, url)
    await kv.ltrim(KEY, 0, MAX - 1)
    await kv.set(RL_KEY(ip, slot), 1, { ex: RL_TTL })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const secret = req.headers.get("x-admin-secret")
    if (!secret || secret !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { url } = await req.json() as { url?: string }
    if (typeof url !== "string") return NextResponse.json({ error: "Invalid" }, { status: 400 })
    await kv.lrem(KEY, 0, url)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
