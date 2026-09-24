import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { clientIp } from "@/lib/ai/rate-limit"
import { countryFromIp } from "@/lib/tracking/geo"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  let body: Record<string, unknown> = {}
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false })
  }

  const email = typeof body.email === "string" ? body.email.trim().slice(0, 255) : ""
  if (!email) return NextResponse.json({ ok: false })

  const provider = typeof body.provider === "string" ? body.provider.slice(0, 30) : "unknown"
  const success = body.success !== false
  const userId = typeof body.userId === "string" ? body.userId.slice(0, 64) : null
  const ip = clientIp(req).trim().slice(0, 45) || null
  const country = countryFromIp(ip)
  const userAgent = (req.headers.get("user-agent") ?? "").slice(0, 300) || null

  await prisma.loginRecord
    .create({ data: { userId, email, provider, success, ip, country, userAgent } })
    .catch(() => {})

  return NextResponse.json({ ok: true })
}