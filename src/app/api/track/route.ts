import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { clientIp } from "@/lib/ai/rate-limit"
import { countryFromIp } from "@/lib/tracking/geo"

export const dynamic = "force-dynamic"

const MAX_LEN = {
  visitorId: 64,
  path: 500,
  title: 300,
  referrer: 500,
  userAgent: 300,
  ip: 45,
} as const

function clamp(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null
  const v = value.trim()
  if (!v) return null
  return v.slice(0, max)
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown> = {}
  try {
    body = await req.json()
  } catch {
    // ignore malformed payloads, still record a page view
  }

  const path = clamp(body.path, MAX_LEN.path)
  if (!path || path.startsWith("/api/") || path.startsWith("/_next")) {
    return NextResponse.json({ ok: false })
  }

  const now = new Date()
  const dayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const ip = clamp(clientIp(req), MAX_LEN.ip)
  const country = countryFromIp(ip)
  const visitorId = clamp(body.visitorId, MAX_LEN.visitorId) ?? `anon-${crypto.randomUUID()}`
  const title = clamp(body.title, MAX_LEN.title)
  const referrer = clamp(body.referrer, MAX_LEN.referrer)
  const userAgent = clamp(req.headers.get("user-agent"), MAX_LEN.userAgent)

  await Promise.all([
    prisma.visitEvent.create({
      data: { visitorId, path, title, referrer, ip, country, userAgent, createdAt: now },
    }),
    prisma.visitorSession.upsert({
      where: { visitorId },
      create: {
        visitorId,
        ip,
        country,
        userAgent,
        firstSeen: now,
        lastSeen: now,
        pageCount: 1,
      },
      update: {
        lastSeen: now,
        pageCount: { increment: 1 },
        ...(ip ? { ip } : {}),
        ...(country ? { country } : {}),
        ...(userAgent ? { userAgent } : {}),
      },
    }),
    prisma.pageView.upsert({
      where: { path_date: { path, date: dayStart } },
      create: { path, title, views: 1, date: dayStart },
      update: { views: { increment: 1 } },
    }),
  ]).catch(() => {})

  return NextResponse.json({ ok: true })
}