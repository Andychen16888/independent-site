import Link from "next/link"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/db/prisma"
import { bi } from "@/components/admin/bilingual"
import { formatDateShort } from "@/lib/utils/format"
import { countryName, countryFlag } from "@/lib/tracking/geo"
import { analyticsColumns } from "@/lib/tracking/schema"
import { isPrivateIp } from "@/lib/ai/rate-limit"
import { detectDeviceType, isKnownDeviceType, type DeviceType } from "@/lib/tracking/device"
import {
  classifySource,
  isTrafficSource,
  SOURCE_META,
  type TrafficSource,
} from "@/lib/tracking/source"
import {
  HiOutlineComputerDesktop,
  HiOutlineDevicePhoneMobile,
  HiOutlineDeviceTablet,
  HiOutlineQuestionMarkCircle,
} from "react-icons/hi2"

export const dynamic = "force-dynamic"

const BIZ_TIMEZONE = process.env.BUSINESS_TIMEZONE || "Asia/Shanghai"

function tzParts(d: Date, timeZone: string): { year: number; month: number; day: number; hour: number; minute: number; second: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(d)

  const value = (type: string) => Number(parts.find((p) => p.type === type)?.value || "0")

  return {
    year: value("year"),
    month: value("month"),
    day: value("day"),
    hour: value("hour"),
    minute: value("minute"),
    second: value("second"),
  }
}

function startOfBusinessDay(d: Date): Date {
  const day = tzParts(d, BIZ_TIMEZONE)
  const utcMidnight = Date.UTC(day.year, day.month - 1, day.day, 0, 0, 0)
  const offsetPoint = tzParts(new Date(utcMidnight), BIZ_TIMEZONE)
  const offsetMs =
    Date.UTC(
      offsetPoint.year,
      offsetPoint.month - 1,
      offsetPoint.day,
      offsetPoint.hour,
      offsetPoint.minute,
      offsetPoint.second
    ) - utcMidnight
  return new Date(utcMidnight - offsetMs)
}

function timeLabel(d: Date): string {
  return d.toLocaleString("en-US", {
    timeZone: BIZ_TIMEZONE,
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
}

const DESCRIPTION = "Visitor analytics: trails, pages and countries. 访客统计：访问轨迹、页面与国家分布。"
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://commoditychina.com"
const SITE_HOST = (() => {
  try {
    return new URL(SITE_URL).hostname
  } catch {
    return null
  }
})()

/**
 * 会话没有存来源（旧会话）时，用该访客最近一次事件的 Referer / UTM 现算，保证轨迹上仍能显示来源。
 */
function classifyEventSource(event: {
  referrer?: string | null
  source?: unknown
  utmSource?: unknown
  utmMedium?: unknown
}): TrafficSource {
  if (isTrafficSource(event.source)) return event.source
  return classifySource({
    referrer: event.referrer ?? null,
    utmSource: typeof event.utmSource === "string" ? event.utmSource : null,
    utmMedium: typeof event.utmMedium === "string" ? event.utmMedium : null,
    siteHost: SITE_HOST,
  })
}

// Mirrors scripts/check-analytics-schema.ts. A migration that is recorded as
// applied but whose SQL never actually ran leaves the columns missing, so the
// page checks the live schema instead of trusting _prisma_migrations alone.
const REQUIRED_ANALYTICS_COLUMNS: Record<string, string[]> = {
  visit_events: ["visitorId", "path", "url", "title", "referrer", "ip", "country", "userAgent", "deviceType", "isBot", "source", "utmSource", "createdAt"],
  visitor_sessions: ["visitorId", "ip", "country", "userAgent", "deviceType", "source", "utmSource", "firstSeen", "lastSeen", "pageCount"],
  page_views: ["url", "path", "title", "views", "date", "country", "userAgent", "referrer", "createdAt", "updatedAt"],
}

type SchemaHealth = {
  ok: boolean
  checkFailed: boolean
  missingColumns: { table: string; columns: string[] }[]
  missingConstraints: string[]
  pendingMigrations: string[]
}

async function getSchemaHealth(): Promise<SchemaHealth> {
  const missingColumns: { table: string; columns: string[] }[] = []
  const missingConstraints: string[] = []
  const pendingMigrations: string[] = []
  let checkFailed = false

  try {
    for (const [table, required] of Object.entries(REQUIRED_ANALYTICS_COLUMNS)) {
      const rows = await prisma.$queryRaw<{ column_name: string }[]>`
        SELECT column_name FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = ${table}
      `
      const present = new Set(rows.map((row) => row.column_name))
      const missing = required.filter((column) => !present.has(column))
      if (missing.length > 0) missingColumns.push({ table, columns: missing })
    }

    const constraints = await prisma.$queryRaw<{ conname: string }[]>`
      SELECT conname FROM pg_constraint
      WHERE conrelid = 'public.page_views'::regclass AND contype = 'u'
    `
    if (!constraints.some((row) => row.conname === "page_views_url_date_key")) {
      missingConstraints.push("page_views_url_date_key")
    }

    try {
      // 失败/未完成的迁移：Prisma 只在 finished_at 为 NULL 且未被显式回滚时才会
      // 阻塞后续 migrate deploy（P3009）。已应用（finished_at 非空）的迁移即使历史
      // 上被 --rolled-back 过（rolled_back_at 仍留值），也是正常的，不能判为失败——
      // 否则会对「回滚后重新应用」的迁移产生假阳性。与 docs/DEPLOYMENT.md 保持一致。
      const pending = await prisma.$queryRaw<{ migration_name: string }[]>`
        SELECT migration_name FROM _prisma_migrations
        WHERE finished_at IS NULL AND rolled_back_at IS NULL
      `
      pendingMigrations.push(...pending.map((row) => row.migration_name))
    } catch {
      // _prisma_migrations does not exist until the first migration runs.
    }
  } catch {
    // Never let the diagnostic itself 500 the analytics page.
    checkFailed = true
  }

  return {
    ok:
      !checkFailed &&
      missingColumns.length === 0 &&
      missingConstraints.length === 0 &&
      pendingMigrations.length === 0,
    checkFailed,
    missingColumns,
    missingConstraints,
    pendingMigrations,
  }
}

async function getStats(sourceStart: Date | null) {
  const now = new Date()
  const today = startOfBusinessDay(now)
  const weekAgo = startOfBusinessDay(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000))
  const schemaHealth = await getSchemaHealth()
  // 只有 isBot 列存在时才过滤爬虫；列缺失（迁移未跑）时退回不过滤，避免整页 500。
  const columns = await analyticsColumns()
  const human: { isBot?: boolean } = columns.visitEventIsBot ? { isBot: false } : {}

  // Get visitor IDs with events in last 7 days, ordered by most recent activity
  const activeVisitors = await prisma.visitEvent.groupBy({
    by: ["visitorId"],
    where: { createdAt: { gte: weekAgo }, ...human },
    _max: { createdAt: true },
    orderBy: { _max: { createdAt: "desc" } },
    take: 30,
  })

  const activeVisitorIds = activeVisitors.map((v) => v.visitorId)

  const [
    visitorCountDistinct7d,
    pageViewCount,
    todayViews,
    countryStats,
    pageStats,
    botEventCount,
    loginTotal,
    loginFailed,
    recentSessionsForActive,
    activeVisitorEvents,
    weeklyPageViews,
    latestEvent,
    rawDeviceRows,
  ] = await Promise.all([
    prisma.visitEvent.findMany({
      where: { createdAt: { gte: weekAgo }, ...human },
      select: { visitorId: true },
      distinct: ["visitorId"],
    }),
    prisma.visitEvent.count({ where: human }),
    prisma.visitEvent.count({ where: { createdAt: { gte: today }, ...human } }),
    prisma.visitEvent.groupBy({
      by: ["country"],
      where: human,
      _count: { _all: true },
      orderBy: { _count: { country: "desc" } },
      take: 40,
    }),
    prisma.visitEvent.groupBy({
      by: ["path"],
      where: human,
      _count: { _all: true },
      orderBy: { _count: { path: "desc" } },
      take: 30,
    }),
    columns.visitEventIsBot
      ? prisma.visitEvent.count({ where: { isBot: true } })
      : Promise.resolve(0),
    prisma.loginRecord.count(),
    prisma.loginRecord.count({ where: { success: false } }),
    activeVisitorIds.length > 0
      ? prisma.visitorSession.findMany({
          where: { visitorId: { in: activeVisitorIds } },
          // 显式列出字段并按探针降级：迁移未跑（缺 deviceType / source 列）时
          // 仍能渲染轨迹，而不是整页 P2022 报错。
          select: {
            id: true,
            visitorId: true,
            ip: true,
            country: true,
            userAgent: true,
            firstSeen: true,
            lastSeen: true,
            pageCount: true,
            ...(columns.visitorSessionDeviceType ? { deviceType: true } : {}),
            ...(columns.visitorSessionSource ? { source: true } : {}),
            ...(columns.visitorSessionUtm
              ? { utmSource: true, utmMedium: true, utmCampaign: true }
              : {}),
          },
        })
      : Promise.resolve([]),
    activeVisitorIds.length > 0
      ? prisma.visitEvent.findMany({
          where: { visitorId: { in: activeVisitorIds }, ...human },
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            visitorId: true,
            path: true,
            title: true,
            referrer: true,
            ip: true,
            country: true,
            userAgent: true,
            createdAt: true,
            ...(columns.visitEventDeviceType ? { deviceType: true } : {}),
            ...(columns.visitEventSource ? { source: true } : {}),
            ...(columns.visitEventUtm
              ? { utmSource: true, utmMedium: true, utmCampaign: true }
              : {}),
          },
        })
      : Promise.resolve([]),
    prisma.pageView.findMany({
      where: { date: { gte: weekAgo } },
      orderBy: { date: "asc" },
      select: {
        id: true,
        path: true,
        title: true,
        views: true,
        date: true,
      },
    }),
    prisma.visitEvent.findFirst({
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
    // 每个访客取最近一次事件的设备信息：按时间倒序取回后在前端去重（首个即最新）。
    // deviceType 列缺失（迁移未跑）时退回按 userAgent 读取。
    prisma.visitEvent.findMany({
      where: { createdAt: { gte: weekAgo }, ...human },
      orderBy: { createdAt: "desc" },
      take: 3000,
      select: {
        visitorId: true,
        userAgent: true,
        ...(columns.visitEventDeviceType ? { deviceType: true } : {}),
      },
    }),
  ])

  // 访客来源统计：按来源分组，分别统计「独立访客数」与「访问量」。
  // source 列缺失（迁移未跑）时整块留空，页面其余部分照常渲染。
  let sourceStats: SourceStat[] = []
  if (columns.visitEventSource) {
    const conditions: Prisma.Sql[] = []
    if (sourceStart) conditions.push(Prisma.sql`"createdAt" >= ${sourceStart}`)
    if (columns.visitEventIsBot) conditions.push(Prisma.sql`"isBot" = false`)
    const whereSql = conditions.length
      ? Prisma.sql`WHERE ${Prisma.join(conditions, " AND ")}`
      : Prisma.empty
    const sourceRows = await prisma.$queryRaw<
      { source: string | null; visitors: bigint; views: bigint }[]
    >(Prisma.sql`
      SELECT "source" AS source,
             COUNT(DISTINCT "visitorId") AS visitors,
             COUNT(*) AS views
      FROM "visit_events"
      ${whereSql}
      GROUP BY "source"
    `)
    sourceStats = sourceRows.map((row) => ({
      source: normalizeSource(row.source),
      visitors: Number(row.visitors),
      views: Number(row.views),
    }))
  }

  const seenVisitorIds = new Set<string>()
  const deviceVisitorRows: Array<{ visitorId: string; userAgent: string | null; deviceType?: string | null }> = []
  for (const row of rawDeviceRows) {
    if (seenVisitorIds.has(row.visitorId)) continue
    seenVisitorIds.add(row.visitorId)
    deviceVisitorRows.push(row)
  }

  const deviceCounts: Record<DeviceType, number> = { desktop: 0, mobile: 0, tablet: 0, unknown: 0 }
  for (const row of deviceVisitorRows) {
    const device = resolveDevice(row.deviceType, row.userAgent)
    deviceCounts[device] += 1
  }
  const deviceTotal = deviceCounts.desktop + deviceCounts.mobile + deviceCounts.tablet

  return {
    visitorCount: visitorCountDistinct7d.length,
    pageViewCount,
    todayViews,
    countryStats,
    pageStats,
    botEventCount,
    loginTotal,
    loginFailed,
    recentSessions: recentSessionsForActive,
    recentEvents: activeVisitorEvents,
    weeklyPageViews,
    weekAgo,
    latestEventAt: latestEvent?.createdAt ?? null,
    deviceCounts,
    deviceTotal,
    schemaHealth,
    sourceStats,
    sourceAvailable: columns.visitEventSource,
  }
}

type SourceStat = { source: TrafficSource; visitors: number; views: number }

function normalizeSource(value: string | null | undefined): TrafficSource {
  return isTrafficSource(value) ? value : "direct"
}

// 与「国际芯片交易网」一致的两组来源：SEO 组（含直接访问作为自然流量基线）与其它来源组。
const SOURCE_GROUPS: { en: string; zh: string; sources: TrafficSource[] }[] = [
  { en: "SEO Sources", zh: "SEO来源", sources: ["google", "bing", "baidu", "search", "direct"] },
  { en: "Other Sources", zh: "其它来源", sources: ["email", "social", "referral"] },
]

function StatCard({
  label,
  labelZh,
  value,
  sub,
}: {
  label: string
  labelZh: string
  value: number | string
  sub?: string
}) {
  return (
    <div className="bg-white border border-mist p-5">
      <p className="text-[10px] uppercase tracking-wider text-stone">
        {label} <span className="opacity-60">{labelZh}</span>
      </p>
      <p className="mt-2 text-3xl font-light tabular-nums">{value}</p>
      {sub && <p className="mt-1 text-xs text-stone">{sub}</p>}
    </div>
  )
}

function SectionCard({
  title,
  titleZh,
  action,
  children,
}: {
  title: string
  titleZh: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="bg-white border border-mist p-6">
      <div className="flex items-start justify-between gap-3 mb-4">
        <h3 className="font-serif text-base">
          {title} <span className="text-sm text-stone">{titleZh}</span>
        </h3>
        {action}
      </div>
      {children}
    </section>
  )
}

function resolveDevice(deviceType: string | null | undefined, userAgent: string | null | undefined): DeviceType {
  return isKnownDeviceType(deviceType) ? deviceType : detectDeviceType(userAgent)
}

const DEVICE_LABELS: Record<DeviceType, { en: string; zh: string; Icon: React.ComponentType<{ className?: string }> }> = {
  desktop: { en: "Desktop", zh: "电脑", Icon: HiOutlineComputerDesktop },
  mobile: { en: "Mobile", zh: "手机", Icon: HiOutlineDevicePhoneMobile },
  tablet: { en: "Tablet", zh: "平板", Icon: HiOutlineDeviceTablet },
  unknown: { en: "Unknown", zh: "未知", Icon: HiOutlineQuestionMarkCircle },
}
const DEVICE_ORDER: DeviceType[] = ["desktop", "mobile", "tablet", "unknown"]

function DeviceBadge({ device }: { device: DeviceType }) {
  const { en, zh, Icon } = DEVICE_LABELS[device]
  return (
    <span className="inline-flex items-center gap-1 border border-mist px-1 py-px">
      <Icon className="w-3.5 h-3.5 text-stone" />
      <span className="text-[9px] uppercase tracking-wider text-stone/80">
        {bi(en, zh)}
      </span>
    </span>
  )
}

function SourceBadge({ source }: { source: TrafficSource }) {
  const { en, zh } = SOURCE_META[source]
  return (
    <span className="inline-flex items-center gap-1 border border-navy/30 bg-navy/5 px-1.5 py-px">
      <span className="text-[9px] uppercase tracking-wider text-navy/80">{en}</span>
      {zh !== en && <span className="text-[9px] text-stone/80">{zh}</span>}
    </span>
  )
}

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  // 轨迹步骤默认倒序（最新一步在最上面），?steps=asc 可切回时间正序
  const stepsNewestFirst = params.steps !== "asc"
  // 访客来源统计窗口：默认近 30 天，?sourceRange=7 / all 可切换。推广看短期效果用 7 天，看全量用 all。
  const sourceRangeParam = typeof params.sourceRange === "string" ? params.sourceRange : "30"
  const sourceDays = sourceRangeParam === "7" ? 7 : sourceRangeParam === "all" ? null : 30
  const sourceStart =
    sourceDays === null ? null : startOfBusinessDay(new Date(Date.now() - sourceDays * 24 * 60 * 60 * 1000))
  const stats = await getStats(sourceStart)
  const schemaHealth = stats.schemaHealth

  // 埋点写入失败时页面不会报错，只会「看起来很久没人访问」。这里显式暴露数据新鲜度，
  // 免得再出现「只有旧数据」却查不到原因的情况。
  const latestEventAt = stats.latestEventAt
  const staleHours = latestEventAt
    ? Math.floor((Date.now() - latestEventAt.getTime()) / (60 * 60 * 1000))
    : null
  const isStale = staleHours === null || staleHours >= 6
  const showStaleWarning = schemaHealth.ok && isStale

  const maxPathViews = stats.pageStats[0]?._count._all ?? 0
  const maxCountryViews = stats.countryStats[0]?._count._all ?? 0

  const sourceTotals = new Map<TrafficSource, SourceStat>()
  for (const row of stats.sourceStats) sourceTotals.set(row.source, row)
  const sourceTotalVisitors = stats.sourceStats.reduce((sum, row) => sum + row.visitors, 0)
  const maxSourceVisitors = Math.max(
    1,
    ...SOURCE_GROUPS.flatMap((group) =>
      group.sources.map((source) => sourceTotals.get(source)?.visitors ?? 0)
    )
  )

  const weeklyMap = new Map<string, number>()
  const weekLabels: string[] = []
  for (let i = 6; i >= 0; i--) {
    const day = startOfBusinessDay(new Date(Date.now() - i * 24 * 60 * 60 * 1000))
    weekLabels.push(
      day.toLocaleDateString("en-US", { timeZone: BIZ_TIMEZONE, weekday: "short", month: "numeric", day: "numeric" })
    )
    weeklyMap.set(day.toISOString(), 0)
  }
  for (const pv of stats.weeklyPageViews) {
    const key = startOfBusinessDay(pv.date).toISOString()
    if (weeklyMap.has(key)) weeklyMap.set(key, (weeklyMap.get(key) ?? 0) + pv.views)
  }
  const weekCounts = [...weeklyMap.values()]
  const maxWeekViews = Math.max(1, ...weekCounts)

  const eventsByVisitor = new Map<string, (typeof stats.recentEvents)[number][]>()
  for (const event of stats.recentEvents) {
    const list = eventsByVisitor.get(event.visitorId) ?? []
    list.push(event)
    eventsByVisitor.set(event.visitorId, list)
  }

  const sessionByVisitor = new Map<string, (typeof stats.recentSessions)[number]>()
  for (const session of stats.recentSessions) {
    sessionByVisitor.set(session.visitorId, session)
  }

  // 访客按「最近一次访问时间」倒序：最近活跃的访客排在最前面。
  // 不依赖 groupBy 的聚合排序，直接用已取回的事件时间戳算，避免数据库端排序
  // 未生效时又静默退化成按插入顺序显示。
  const lastSeenByVisitor = new Map<string, number>()
  for (const event of stats.recentEvents) {
    const time = event.createdAt.getTime()
    const prev = lastSeenByVisitor.get(event.visitorId) ?? 0
    if (time > prev) lastSeenByVisitor.set(event.visitorId, time)
  }
  const visitorIds = [...lastSeenByVisitor.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([visitorId]) => visitorId)

  const trails = visitorIds
    .map((visitorId) => {
      const session = sessionByVisitor.get(visitorId)
      const events = [...(eventsByVisitor.get(visitorId) ?? [])].sort((a, b) =>
        stepsNewestFirst
          ? b.createdAt.getTime() - a.createdAt.getTime()
          : a.createdAt.getTime() - b.createdAt.getTime()
      )
      if (!events.length) return null
      if (session) return { session, events }

      const newest = events[0]
      const oldest = events[events.length - 1]
      return {
        session: {
          id: `fallback-${visitorId}`,
          visitorId,
          ip: newest.ip ?? oldest.ip,
          country: newest.country ?? oldest.country,
          userAgent: newest.userAgent ?? oldest.userAgent,
          deviceType: newest.deviceType ?? null,
          source: classifyEventSource(newest),
          utmSource: typeof newest.utmSource === "string" ? newest.utmSource : null,
          utmMedium: typeof newest.utmMedium === "string" ? newest.utmMedium : null,
          utmCampaign: typeof newest.utmCampaign === "string" ? newest.utmCampaign : null,
          firstSeen: oldest.createdAt,
          lastSeen: newest.createdAt,
          pageCount: events.length,
        },
        events,
      }
    })
    .filter((trail): trail is NonNullable<typeof trail> => trail !== null)
    .slice(0, 30)

  const recentLogins = await prisma.loginRecord.findMany({
    orderBy: { createdAt: "desc" },
    take: 30,
  })

  return (
    <div>
      <div className="mb-8">
        <h1 className="heading-md">{bi("Analytics", "数据分析")}</h1>
        <p className="text-body text-sm mt-1">{DESCRIPTION}</p>
        <p className="text-xs text-stone mt-2">
          {bi("Latest visitor data", "最新访客数据")}:{" "}
          {latestEventAt ? timeLabel(latestEventAt) : bi("none", "无")}
          {!schemaHealth.checkFailed &&
            (schemaHealth.ok
              ? bi(" · schema ok", " · 表结构正常")
              : bi(" · schema mismatch", " · 表结构异常"))}
        </p>
        {stats.botEventCount > 0 && (
          <p className="text-xs text-stone mt-1">
            {bi(
              `${stats.botEventCount} crawler/monitor event(s) hidden from the figures below.`,
              `已从下列统计中过滤 ${stats.botEventCount} 条爬虫/监控事件。`
            )}
          </p>
        )}
      </div>

      {!schemaHealth.ok && (
        <div className="mb-8 border border-red-300 bg-red-50 p-4 text-sm">
          <p className="font-medium text-charcoal">
            {bi("Database schema is out of date", "数据库表结构未同步")}
          </p>
          <ul className="text-xs text-stone mt-1 space-y-1 list-disc pl-5">
            {schemaHealth.checkFailed && (
              <li>
                {bi(
                  "Could not read the schema health; see the server logs.",
                  "无法读取表结构自检结果，请查看服务器日志。"
                )}
              </li>
            )}
            {schemaHealth.missingColumns.map((item) => (
              <li key={item.table}>
                {bi(
                  `${item.table} is missing column(s): ${item.columns.join(", ")}`,
                  `数据表 ${item.table} 缺少字段：${item.columns.join("、")}`
                )}
              </li>
            ))}
            {schemaHealth.missingConstraints.map((constraint) => (
              <li key={constraint}>
                {bi(`Missing unique constraint: ${constraint}`, `缺少唯一约束：${constraint}`)}
              </li>
            ))}
            {schemaHealth.pendingMigrations.map((migration) => (
              <li key={migration}>
                {bi(
                  `Pending or failed migration: ${migration}`,
                  `未完成或失败的迁移：${migration}`
                )}
              </li>
            ))}
            <li>{bi('Fix: run "npm run db:migrate" on the server.', '修复：在服务器执行 "npm run db:migrate"。')}</li>
          </ul>
        </div>
      )}

      {showStaleWarning && (
        <div className="mb-8 border border-rosegold/40 bg-rosegold/5 p-4 text-sm">
          <p className="font-medium text-charcoal">
            {bi("Visitor tracking looks stale", "访客埋点可能已停止写入")}
          </p>
          <p className="text-xs text-stone mt-1 leading-relaxed">
            {latestEventAt
              ? `${timeLabel(latestEventAt)} ${bi(`(${staleHours}h ago)`, `（${staleHours} 小时前）`)}`
              : bi("No visitor event recorded yet.", "尚未记录到任何访客事件。")}
            {" "}
            {bi(
              "Tracking writes may be failing, or the server may have been unreachable (down, out of memory, or under attack). Check \"pm2 logs b2b-independent-site --lines 100\" for [track] or 500 errors. If a schema problem is shown above, run \"npm run db:migrate\" first.",
              "可能是埋点写入失败，或服务器一度不可达（宕机、内存耗尽或遭受攻击）。请查看 \"pm2 logs b2b-independent-site --lines 100\" 是否有 [track] 或 500 错误；如上方提示表结构异常，请先执行 \"npm run db:migrate\"。"
            )}
          </p>
        </div>
      )}

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        <StatCard
          label="Visitors"
          labelZh="访客数"
          value={stats.visitorCount}
          sub={bi("Total anonymous visitors", "匿名访客总数")}
        />
        <StatCard
          label="Page Views"
          labelZh="页面访问"
          value={stats.pageViewCount}
          sub={`${stats.todayViews} ${bi("today", "今日")}`}
        />
        <StatCard
          label="Countries"
          labelZh="国家"
          value={stats.countryStats.length}
          sub={bi("Detected visitor origins", "监测到的访客来源地")}
        />
        <StatCard
          label="Logins"
          labelZh="登录"
          value={stats.loginTotal}
          sub={`${stats.loginFailed} ${bi("failed", "失败")}`}
        />
      </div>

      <SectionCard
        title="Devices 7d"
        titleZh="设备类型（近7天·按访客）"
        action={
          <span className="text-[11px] text-stone">
            {stats.deviceTotal} {bi("visitors with device detected", "位可识别设备的访客")}
            {stats.deviceCounts.unknown > 0
              ? ` · ${stats.deviceCounts.unknown} ${bi("unknown", "未知")}`
              : ""}
          </span>
        }
      >
        {stats.deviceTotal === 0 ? (
          <p className="text-sm text-stone">{bi("No device data yet.", "暂无设备数据。")}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {DEVICE_ORDER.filter((device) => device !== "unknown").map((device) => {
              const count = stats.deviceCounts[device]
              const percent = Math.round((count / stats.deviceTotal) * 100)
              const { en, zh, Icon } = DEVICE_LABELS[device]
              return (
                <div key={device} className="border border-mist/60 p-4">
                  <p className="flex items-center gap-2 text-xs text-stone">
                    <Icon className="w-4 h-4" />
                    {bi(en, zh)}
                  </p>
                  <p className="mt-2 text-3xl font-light tabular-nums">{count}</p>
                  <span className="block h-1 bg-mist/60 mt-3 rounded-sm overflow-hidden">
                    <span
                      className="block h-full bg-navy/70"
                      style={{ width: `${percent}%` }}
                    />
                  </span>
                  <p className="mt-1 text-[10px] uppercase tracking-wider text-stone">{percent}%</p>
                </div>
              )
            })}
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="Traffic Sources"
        titleZh="访客来源"
        action={
          <div className="flex items-center gap-1">
            {[
              { value: "7", label: bi("7d", "近7天") },
              { value: "30", label: bi("30d", "近30天") },
              { value: "all", label: bi("All", "全部") },
            ].map((option) => (
              <Link
                key={option.value}
                href={`/admin/analytics?sourceRange=${option.value}${stepsNewestFirst ? "" : "&steps=asc"}`}
                scroll={false}
                className={
                  sourceRangeParam === option.value
                    ? "px-2 py-1 bg-charcoal text-white text-[10px] uppercase tracking-wider"
                    : "px-2 py-1 border border-mist text-stone text-[10px] uppercase tracking-wider hover:border-charcoal"
                }
              >
                {option.label}
              </Link>
            ))}
          </div>
        }
      >
        {!stats.sourceAvailable ? (
          <p className="text-sm text-stone">
            {bi(
              'Source column is missing; run "npm run db:migrate" to enable traffic-source tracking.',
              "来源字段缺失，请执行 \"npm run db:migrate\" 以启用访客来源统计。"
            )}
          </p>
        ) : stats.sourceStats.length === 0 ? (
          <p className="text-sm text-stone">{bi("No source data yet.", "暂无来源数据。")}</p>
        ) : (
          <>
            <p className="text-[11px] text-stone mb-4">
              {sourceTotalVisitors}{" "}
              {bi(
                "visitor-source pairs (each visitor counted once per source). Email = arrivals through a UTM-tagged link in a marketing email.",
                "访客-来源记录（同一访客按来源分别去重）。邮件 = 通过推广邮件内带 UTM 参数的链接进入。"
              )}
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              {SOURCE_GROUPS.map((group) => (
                <div key={group.en}>
                  <h4 className="text-[10px] uppercase tracking-wider text-stone mb-3 border-b border-mist pb-2">
                    {bi(group.en, group.zh)}
                  </h4>
                  <div className="space-y-3">
                    {group.sources.map((source) => {
                      const stat = sourceTotals.get(source)
                      const visitors = stat?.visitors ?? 0
                      const meta = SOURCE_META[source]
                      return (
                        <div key={source}>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-charcoal">
                              {meta.en}
                              {meta.zh !== meta.en && (
                                <span className="text-stone"> / {meta.zh}</span>
                              )}
                            </span>
                            <span className="tabular-nums">{visitors}</span>
                          </div>
                          <span className="block h-1 bg-mist/60 mt-1.5 rounded-sm overflow-hidden">
                            <span
                              className="block h-full bg-navy/70"
                              style={{ width: `${(visitors / maxSourceVisitors) * 100}%` }}
                            />
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </SectionCard>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <SectionCard title="Visited Pages 7d" titleZh="访问页面（近7天）">
          <div className="flex items-end gap-1 h-24 mb-6">
            {weekCounts.map((count, i) => (
              <div key={i} className="flex-1 flex flex-col justify-end">
                <div
                  className="bg-sage/70 hover:bg-sage transition-colors"
                  style={{ height: `${Math.max(3, (count / maxWeekViews) * 100)}%` }}
                  title={`${count}`}
                />
              </div>
            ))}
          </div>
          <div className="flex gap-1 mb-5">
            {weekLabels.map((label, i) => (
              <div key={i} className="flex-1 text-[9px] uppercase tracking-wider text-stone text-center">
                {label}
              </div>
            ))}
          </div>

          {stats.pageStats.length === 0 ? (
            <p className="text-sm text-stone">{bi("No page views recorded yet.", "暂无页面访问记录。")}</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-mist text-left">
                  <th className="py-2 pr-3 text-[10px] uppercase tracking-wider text-stone font-medium">{bi("Page", "页面")}</th>
                  <th className="py-2 pl-3 text-[10px] uppercase tracking-wider text-stone font-medium text-right">{bi("Views", "访问量")}</th>
                </tr>
              </thead>
              <tbody>
                {stats.pageStats.slice(0, 15).map((row, idx) => {
                  const count = row._count._all
                  const path = row.path
                  const url = (row as any).url as string | null
                  const normalizedPath = path ? (path.startsWith("/") ? path : `/${path}`) : "/"
                  const fullUrl = url || (path?.startsWith("http") ? path : `${SITE_URL}${normalizedPath}`)
                  const display = fullUrl
                  return (
                    <tr key={idx} className="border-b border-mist/50">
                      <td className="py-2.5 pr-3 font-medium break-all">
                        <a
                          href={fullUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-xs text-blue-600 hover:underline"
                          title={display}
                        >
                          {display}
                        </a>
                        <span className="block h-1 bg-mist/60 mt-1 rounded-sm overflow-hidden">
                          <span
                            className="block h-full bg-gold/70"
                            style={{ width: `${maxPathViews ? (count / maxPathViews) * 100 : 0}%` }}
                          />
                        </span>
                      </td>
                      <td className="py-2.5 pl-3 text-right tabular-nums">{count}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </SectionCard>

        <SectionCard title="Countries" titleZh="访客国家分布">
          {stats.countryStats.length === 0 ? (
            <p className="text-sm text-stone">{bi("No country data yet.", "暂无国家数据。")}</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-mist text-left">
                  <th className="py-2 pr-3 text-[10px] uppercase tracking-wider text-stone font-medium">{bi("Country", "国家")}</th>
                  <th className="py-2 pl-3 text-[10px] uppercase tracking-wider text-stone font-medium text-right">{bi("Views", "访问量")}</th>
                </tr>
              </thead>
              <tbody>
                {stats.countryStats.map((row) => {
                  const count = row._count._all
                  const iso = row.country
                  return (
                    <tr key={iso ?? "unknown"} className="border-b border-mist/50">
                      <td className="py-2.5 pr-3">
                        <span className="flex items-center gap-2">
                          <span className="text-base leading-none">{countryFlag(iso)}</span>
                          <span className="font-medium">{countryName(iso)}</span>
                          {iso && <span className="text-[10px] uppercase tracking-wider text-stone">{iso}</span>}
                        </span>
                        <span className="block h-1 bg-mist/60 mt-1 rounded-sm overflow-hidden">
                          <span
                            className="block h-full bg-sage"
                            style={{ width: `${maxCountryViews ? (count / maxCountryViews) * 100 : 0}%` }}
                          />
                        </span>
                      </td>
                      <td className="py-2.5 pl-3 text-right tabular-nums">{count}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </SectionCard>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <SectionCard
          title="Visitor Trails"
          titleZh="访客轨迹"
          action={
            <Link
              href={stepsNewestFirst ? "/admin/analytics?steps=asc" : "/admin/analytics"}
              scroll={false}
              className="text-xs text-blue-600 hover:underline whitespace-nowrap"
            >
              {stepsNewestFirst ? bi("Oldest step first", "按最早一步在前") : bi("Newest step first", "按最近一步在前")}
            </Link>
          }
        >
          {trails.length === 0 ? (
            <p className="text-sm text-stone">{bi("No visitor trails recorded yet.", "暂无访客轨迹。")}</p>
          ) : (
            <div className="space-y-5">
              {trails.map(({ session, events }) => {
                // 事件已按所选顺序排好：倒序时第一行是最近一步，正序时是第一步
                const latest = events[0]
                const displayCountry = session.country || latest?.country
                const displayIp = session.ip || latest?.ip
                // 无 IP / 无国家通常来自服务器本机或内网访问（curl 自测、本机调试），
                // 直接显示「未知」会让人以为是国家识别失败，这里明确区分开。
                const unknownSource = !displayCountry && (!displayIp || isPrivateIp(displayIp))
                const displayDevice = resolveDevice(session.deviceType, session.userAgent)
                const displaySource = isTrafficSource(session.source)
                  ? session.source
                  : latest
                    ? classifyEventSource(latest)
                    : "direct"

                return (
                <div key={session.id} className="border border-mist/60 p-4">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone mb-2">
                    <span className="text-base">{countryFlag(displayCountry)}</span>
                    <span className="font-medium text-charcoal">
                      {unknownSource ? bi("Local / unknown source", "本机或内网访问") : countryName(displayCountry)}
                    </span>
                    <DeviceBadge device={displayDevice} />
                    <SourceBadge source={displaySource} />
                    {displaySource === "email" && session.utmCampaign && (
                      <span className="text-[10px] text-stone break-all" title={session.utmCampaign}>
                        · {session.utmCampaign}
                      </span>
                    )}
                    {displayIp && (
                      <span className="font-mono inline-flex items-center gap-1">
                        {displayIp}
                        {/* 访客走 IPv6 上网时会记录 IPv6 地址（国内宽带/移动很常见），标出来避免被当成脏数据 */}
                        <span className="text-[9px] uppercase tracking-wider text-stone/70 border border-mist px-1 py-px">
                          {displayIp.includes(":") ? "IPv6" : "IPv4"}
                        </span>
                      </span>
                    )}
                    <span className="ml-auto text-right">
                      {events.length} {bi("steps", "步")} ·{" "}
                      {stepsNewestFirst
                        ? bi("latest", "最近") + " " + timeLabel(session.lastSeen)
                        : bi("first", "首次") + " " + formatDateShort(session.firstSeen)}
                    </span>
                  </div>
                  <ol className="space-y-1.5">
                    {events.map((event, i) => {
                      const path = event.path || "/"
                      const normalizedPath = path.startsWith("/") ? path : `/${path}`
                      const fullUrl = path.startsWith("http") ? path : `${SITE_URL}${normalizedPath}`

                      return (
                        <li key={event.id} className="flex items-start gap-2 text-xs">
                          <span className="text-stone tabular-nums shrink-0">{timeLabel(event.createdAt)}</span>
                          <span className="text-stone/70 shrink-0">{i + 1}.</span>
                          <div className="min-w-0 flex-1">
                            <a
                              href={fullUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block font-mono text-[11px] text-blue-600 hover:underline break-all"
                              title={fullUrl}
                            >
                              {normalizedPath}
                            </a>
                            <a
                              href={fullUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block font-mono text-[10px] text-stone hover:text-blue-600 truncate"
                              title={fullUrl}
                            >
                              {fullUrl}
                            </a>
                            {event.title && (
                              <span className="block text-stone/70 text-[11px] truncate">— {event.title}</span>
                            )}
                          </div>
                        </li>
                      )
                    })}
                  </ol>
                </div>
                )
              })}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Recent Logins" titleZh="登录记录">
          {recentLogins.length === 0 ? (
            <p className="text-sm text-stone">{bi("No login records yet.", "暂无登录记录。")}</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-mist text-left">
                  <th className="px-4 py-2 text-[10px] uppercase tracking-wider text-stone font-medium">{bi("Email", "邮箱")}</th>
                  <th className="px-4 py-2 text-[10px] uppercase tracking-wider text-stone font-medium">{bi("Provider", "登录方式")}</th>
                  <th className="px-4 py-2 text-[10px] uppercase tracking-wider text-stone font-medium">{bi("Status", "状态")}</th>
                  <th className="px-4 py-2 text-[10px] uppercase tracking-wider text-stone font-medium">{bi("Country", "国家")}</th>
                  <th className="px-4 py-2 text-[10px] uppercase tracking-wider text-stone font-medium">{bi("Time", "时间")}</th>
                </tr>
              </thead>
              <tbody>
                {recentLogins.map((login) => (
                  <tr key={login.id} className="border-b border-mist/50 hover:bg-ivory/50 transition-colors">
                    <td className="px-4 py-2.5 break-all">{login.email}</td>
                    <td className="px-4 py-2.5 text-xs text-stone capitalize">{login.provider}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-[10px] uppercase tracking-wider px-2 py-1 ${
                        login.success ? "bg-sage/10 text-sage" : "bg-rosegold/10 text-rosegold"
                      }`}>
                        {login.success ? bi("Success", "成功") : bi("Failed", "失败")}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-stone">
                      {countryFlag(login.country)} {countryName(login.country)}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-stone whitespace-nowrap">
                      {timeLabel(login.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </SectionCard>
      </div>
    </div>
  )
}
