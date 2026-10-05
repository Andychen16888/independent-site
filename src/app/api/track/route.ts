import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
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

// ---- 写入失败诊断 ----
// 埋点写入失败时必须留下痕迹：之前这里整体 `.catch(() => {})`，任何一次数据库
// 报错（例如生产库漏跑 url 字段迁移）都会被静默吞掉，后台只能看到「没有新数据」，
// 完全没有线索。限流到 5 分钟一条，避免刷屏把 logs/err.log 冲垮。
const LOG_THROTTLE_MS = 5 * 60 * 1000
const lastLogAt = new Map<string, number>()

function isMissingColumn(error: unknown): boolean {
  return (
    (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2022") ||
    /column .* does not exist/i.test(error instanceof Error ? error.message : String(error))
  )
}

function reportWriteFailure(label: string, error: unknown): void {
  const key = `${label}:${error instanceof Error ? error.message : String(error)}`
  const now = Date.now()
  const prev = lastLogAt.get(key)
  if (prev !== undefined && now - prev < LOG_THROTTLE_MS) return
  lastLogAt.set(key, now)

  const hint = isMissingColumn(error)
    ? ' Database schema is out of date: run "npm run db:migrate" (prisma migrate deploy) on the server.'
    : ""
  console.error(`[track] ${label} write failed.${hint}`, error)
}

// ---- url 字段可用性探测 ----
// 20261002115757 迁移给 visit_events / page_views 加了 url 字段。生产库漏跑这条
// 迁移时 Prisma 会因为列不存在直接拒绝写入（P2022），访客数据从此全部丢失。
// 这里每小时探测一次列是否存在：缺列就退回旧字段写入，埋点不再中断，补完迁移后
// 自动恢复完整字段。
type UrlColumns = { visitEvent: boolean; pageView: boolean }
const URL_COLUMN_TTL_MS = 60 * 60 * 1000
let urlColumnsCache: { at: number; value: UrlColumns } | null = null

async function urlColumnAvailability(): Promise<UrlColumns> {
  if (urlColumnsCache && Date.now() - urlColumnsCache.at < URL_COLUMN_TTL_MS) return urlColumnsCache.value

  let value: UrlColumns = { visitEvent: true, pageView: true }
  try {
    const rows = await prisma.$queryRaw<{ table_name: string }[]>`
      SELECT table_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND column_name = 'url'
        AND table_name IN ('visit_events', 'page_views')
    `
    const names = new Set(rows.map((row) => row.table_name))
    value = { visitEvent: names.has("visit_events"), pageView: names.has("page_views") }
  } catch (error) {
    reportWriteFailure("schemaProbe", error)
  }

  if (!value.visitEvent || !value.pageView) {
    console.warn(
      '[track] visit_events/page_views are missing the "url" column; falling back to path-based writes until "npm run db:migrate" is applied.',
      value
    )
  }

  urlColumnsCache = { at: Date.now(), value }
  return value
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

  const columns = await urlColumnAvailability()

  // 三路写入彼此独立：任何一路失败都不能连累另外两路（之前整体 Promise.all +
  // catch，pageView 的 ON CONFLICT 报错会连带 visitEvent 一起消失）。
  const writes: Array<{ label: string; run: () => Promise<unknown> }> = [
    {
      label: "visitEvent",
      run: () =>
        prisma.visitEvent.create({
          data: {
            visitorId,
            path: pathname,
            title,
            referrer,
            ip,
            country,
            userAgent,
            createdAt: now,
            ...(columns.visitEvent ? { url: fullUrl } : {}),
          },
        }),
    },
    {
      label: "visitorSession",
      run: () =>
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
    },
    {
      // 不用 upsert(where: url_date)：它依赖 (url, date) 唯一约束，约束缺失时
      // ON CONFLICT 直接报错。改成 updateMany + create，并发撞车时回退成自增。
      // 缺 url 列时退回旧的 (path, date) 计数口径。
      label: "pageView",
      run: async () => {
        const where: Prisma.PageViewWhereInput = columns.pageView
          ? { url: fullUrl, date: dayStart }
          : { path: pathname, date: dayStart }

        const bumped = await prisma.pageView.updateMany({
          where,
          data: { views: { increment: 1 } },
        })
        if (bumped.count > 0) return

        try {
          await prisma.pageView.create({
            // 生成的类型按「目标 schema」要求 url 必填，缺列时的降级分支只能断言一次。
            data: (columns.pageView
              ? {
                  url: fullUrl,
                  path: pathname,
                  title,
                  views: 1,
                  date: dayStart,
                  country,
                  userAgent,
                  referrer,
                }
              : { path: pathname, title, views: 1, date: dayStart }) as Prisma.PageViewUncheckedCreateInput,
          })
        } catch (error) {
          if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            await prisma.pageView.updateMany({
              where,
              data: { views: { increment: 1 } },
            })
            return
          }
          throw error
        }
      },
    },
  ]

  const settled = await Promise.allSettled(writes.map((write) => write.run()))
  const failed: string[] = []
  settled.forEach((result, index) => {
    if (result.status === "rejected") {
      failed.push(writes[index].label)
      reportWriteFailure(writes[index].label, result.reason)
    }
  })

  return NextResponse.json(failed.length > 0 ? { ok: false, failed } : { ok: true })
}