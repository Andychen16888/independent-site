import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/db/prisma"
import { clientIp } from "@/lib/ai/rate-limit"
import { countryFromIp } from "@/lib/tracking/geo"
import { isBotUserAgent } from "@/lib/tracking/bot"
import { detectDeviceType, isKnownDeviceType } from "@/lib/tracking/device"
import { analyticsColumns } from "@/lib/tracking/schema"
import { classifySource, utmFromUrl } from "@/lib/tracking/source"
import { getVerifiedSessionEmail } from "@/lib/tracking/admin"
import {
  classifyTrackingSubject,
  shouldWriteVisitEvent,
  shouldWriteVisitorAggregates,
} from "@/lib/tracking/policy"
import { shouldStartNewSession } from "@/lib/tracking/session"

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
  utm: 128,
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
  // 爬虫 / 监控 / 无头浏览器：仍写一条 visitEvent 并打上 isBot 标记（便于排查），
  // 但不计入访客会话与页面浏览聚合，避免污染后台的真人统计。
  const isBot = isBotUserAgent(userAgent)

  // 管理员排除：只相信 getToken 校验过的会话邮箱（admin.ts），绝不看请求体自报的
  // email / isAdmin / role。命中管理员时立即返回，不写 visit_events / visitor_sessions /
  // page_views 中的任何一处，因此后台所有普通访客指标天然都不含管理员流量。
  const sessionEmail = await getVerifiedSessionEmail(req)
  const subject = classifyTrackingSubject({ email: sessionEmail, isBot })
  if (subject === "admin") {
    return NextResponse.json({ ok: true, excluded: true })
  }

  // 访客来源：优先用客户端上报的 utm 参数（邮件/广告链接），缺省时从落地 URL 兜底解析，
  // 再结合 Referer 主机名归类。站内跳转的 Referer 会被判为 direct。
  const urlUtm = utmFromUrl(fullUrl)
  const utmSource = clamp(body.utmSource, MAX_LEN.utm) ?? clamp(urlUtm.utmSource, MAX_LEN.utm)
  const utmMedium = clamp(body.utmMedium, MAX_LEN.utm) ?? clamp(urlUtm.utmMedium, MAX_LEN.utm)
  const utmCampaign = clamp(body.utmCampaign, MAX_LEN.utm) ?? clamp(urlUtm.utmCampaign, MAX_LEN.utm)
  let siteHost: string | null = null
  try {
    siteHost = new URL(fullUrl).hostname
  } catch {
    siteHost = req.headers.get("host")
  }
  const source = classifySource({ referrer, utmSource, utmMedium, siteHost })

  // 设备类型优先用客户端上报值（iPadOS 等 UA 识别不出的平板也能正确区分），
  // 客户端缺失时退回服务器端 UA 识别；两者都无留空，读侧会再次兜底。
  const reportedDeviceType = clamp(body.deviceType, 16)
  const uaDeviceType = detectDeviceType(userAgent)
  const deviceType = isKnownDeviceType(reportedDeviceType)
    ? reportedDeviceType
    : (uaDeviceType === "unknown" ? null : uaDeviceType)

  const columns = await analyticsColumns()

  // 会话切分：为普通访客分配 sessionId。相邻两次事件空闲超过 SESSION_IDLE_MS 即视为
  // 新会话，避免一条 visitorId 的轨迹无限累积、跨越多个访问日。列缺失或查询失败时
  // 降级为 null（轨迹回退为按访客分组），不破坏写入容错。
  let sessionId: string | null = null
  if (shouldWriteVisitorAggregates(subject) && columns.visitEventSessionId) {
    const lastWhere: Prisma.VisitEventWhereInput = columns.visitEventIsBot
      ? { visitorId, isBot: false }
      : { visitorId }
    const lastEvent = await prisma.visitEvent
      .findFirst({
        where: lastWhere,
        orderBy: { createdAt: "desc" },
        select: { sessionId: true, createdAt: true },
      })
      .catch(() => null)
    sessionId =
      lastEvent && lastEvent.sessionId && !shouldStartNewSession(lastEvent.createdAt, now)
        ? lastEvent.sessionId
        : crypto.randomUUID()
  }

  // 各路写入彼此独立：任何一路失败都不能连累其他路（之前整体 Promise.all +
  // catch，pageView 的 ON CONFLICT 报错会连带 visitEvent 一起消失）。
  // 主体分类：机器人只写带 isBot 标记的 visitEvent；普通访客写全部；管理员已在上面返回。
  const writes: Array<{ label: string; run: () => Promise<unknown> }> = []

  if (shouldWriteVisitEvent(subject)) {
    writes.push({
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
            ...(columns.visitEventUrl ? { url: fullUrl } : {}),
            // isBot/deviceType/source 列缺失（迁移未跑）时降级为不写，避免 P2022 连累整条埋点。
            ...(columns.visitEventIsBot ? { isBot } : {}),
            ...(columns.visitEventDeviceType ? { deviceType } : {}),
            ...(columns.visitEventSource ? { source } : {}),
            ...(columns.visitEventUtm ? { utmSource, utmMedium, utmCampaign } : {}),
            ...(columns.visitEventSessionId && sessionId ? { sessionId } : {}),
          },
        }),
    })
  }

  if (shouldWriteVisitorAggregates(subject)) {
    writes.push(
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
              ...(columns.visitorSessionDeviceType ? { deviceType } : {}),
              // 来源采用「首次触达」归因：只在新建会话时写入，后续访问不覆盖。
              ...(columns.visitorSessionSource ? { source } : {}),
              ...(columns.visitorSessionUtm ? { utmSource, utmMedium, utmCampaign } : {}),
            },
            update: {
              lastSeen: now,
              pageCount: { increment: 1 },
              ...(ip ? { ip } : {}),
              ...(country ? { country } : {}),
              ...(userAgent ? { userAgent } : {}),
              // 设备类型以最新一次请求为准：桌面/平板/手机切换时更新到其实设备。
              ...(columns.visitorSessionDeviceType && deviceType ? { deviceType } : {}),
            },
          }),
      },
      {
        // 不用 upsert(where: url_date)：它依赖 (url, date) 唯一约束，约束缺失时
        // ON CONFLICT 直接报错。改成 updateMany + create，并发撞车时回退成自增。
        // 缺 url 列时退回旧的 (path, date) 计数口径。
        label: "pageView",
        run: async () => {
          const where: Prisma.PageViewWhereInput = columns.pageViewUrl
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
              data: (columns.pageViewUrl
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
      }
    )
  }

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