import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { clientIp } from "@/lib/ai/rate-limit"
import { countryFromIp } from "@/lib/tracking/geo"

export const dynamic = "force-dynamic"

// ---- 突发去重（CPU/DB 优化）----
// 同一 (visitorId, path) 在窗口内的重复埋点直接丢弃，不写数据库。
// 真实用户浏览同一路径的间隔远大于该窗口，行为不受影响；但爬虫/刷新风暴会
// 短时间内对同一路径连发埋点，这里把每次 3 行写入（visitEvent + visitorSession
// + pageView upsert）降为 0，明显减轻双核小机 Postgres 的 IO/CPU 压力。
// 部署为单 PM2 fork 实例，进程内 Map 全局共享，不会出现多实例重复写入问题。
const BURST_WINDOW_MS = 12_000
const MAX_BURST_KEYS = 20_000
const lastBurst = new Map<string, number>()

function isBurst(visitorId: string, path: string, now: number): boolean {
  const key = `${visitorId}|${path}`
  const prev = lastBurst.get(key)
  if (prev !== undefined && now - prev < BURST_WINDOW_MS) return true
  lastBurst.set(key, now)
  if (lastBurst.size > MAX_BURST_KEYS) {
    for (const [k, t] of lastBurst) {
      if (now - t >= BURST_WINDOW_MS) lastBurst.delete(k)
    }
    if (lastBurst.size > MAX_BURST_KEYS) lastBurst.clear()
  }
  return false
}

const MAX_LEN = {
  visitorId: 64,
  path: 500,
  url: 2000,
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

  const now = new Date()
  const path = clamp(body.path, MAX_LEN.path)
  const urlRaw = clamp(body.url, MAX_LEN.url)

  if (!path || path.startsWith("/api/") || path.startsWith("/_next")) {
    return NextResponse.json({ ok: false })
  }

  const fullUrl = urlRaw && (urlRaw.startsWith("http://") || urlRaw.startsWith("https://")) ? urlRaw : req.nextUrl.href
  const pathname = path || req.nextUrl.pathname

  const visitorId = clamp(body.visitorId, MAX_LEN.visitorId) ?? `anon-${crypto.randomUUID()}`
  if (isBurst(visitorId, pathname, now.getTime())) {
    return NextResponse.json({ ok: true, deduped: true })
  }

  const dayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const ip = clamp(clientIp(req), MAX_LEN.ip)
  const country = countryFromIp(ip)
  const title = clamp(body.title, MAX_LEN.title)
  const referrer = clamp(body.referrer, MAX_LEN.referrer)
  const userAgent = clamp(req.headers.get("user-agent"), MAX_LEN.userAgent)

  await Promise.all([
    prisma.visitEvent.create({
      data: { visitorId, path: pathname, url: fullUrl, title, referrer, ip, country, userAgent, createdAt: now },
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
      where: { url_date: { url: fullUrl, date: dayStart } } as any,
      create: { url: fullUrl, path: pathname, title, views: 1, date: dayStart },
      update: { views: { increment: 1 } } as any,
    }),
  ]).catch(() => {})

  return NextResponse.json({ ok: true })
}