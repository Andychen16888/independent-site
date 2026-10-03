import { prisma } from "@/lib/db/prisma"
import { bi } from "@/components/admin/bilingual"
import { formatDateShort } from "@/lib/utils/format"
import { countryName, countryFlag } from "@/lib/tracking/geo"

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

async function getStats() {
  const now = new Date()
  const today = startOfBusinessDay(now)
  const weekAgo = startOfBusinessDay(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000))

  // Get visitor IDs with events in last 7 days, ordered by most recent activity
  const activeVisitors = await prisma.visitEvent.groupBy({
    by: ["visitorId"],
    where: { createdAt: { gte: weekAgo } },
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
    loginTotal,
    loginFailed,
    recentSessionsForActive,
    activeVisitorEvents,
    weeklyPageViews,
  ] = await Promise.all([
    prisma.visitEvent.findMany({
      where: { createdAt: { gte: weekAgo } },
      select: { visitorId: true },
      distinct: ["visitorId"],
    }),
    prisma.visitEvent.count(),
    prisma.visitEvent.count({ where: { createdAt: { gte: today } } }),
    prisma.visitEvent.groupBy({
      by: ["country"],
      _count: { _all: true },
      orderBy: { _count: { country: "desc" } },
      take: 40,
    }),
    prisma.visitEvent.groupBy({
      by: ["path"],
      _count: { _all: true },
      orderBy: { _count: { path: "desc" } },
      take: 30,
    }),
    prisma.loginRecord.count(),
    prisma.loginRecord.count({ where: { success: false } }),
    activeVisitorIds.length > 0
      ? prisma.visitorSession.findMany({
          where: { visitorId: { in: activeVisitorIds } },
        })
      : Promise.resolve([]),
    activeVisitorIds.length > 0
      ? prisma.visitEvent.findMany({
          where: { visitorId: { in: activeVisitorIds } },
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
  ])

  return {
    visitorCount: visitorCountDistinct7d.length,
    pageViewCount,
    todayViews,
    countryStats,
    pageStats,
    loginTotal,
    loginFailed,
    recentSessions: recentSessionsForActive,
    recentEvents: activeVisitorEvents,
    weeklyPageViews,
    weekAgo,
    activeVisitorOrder: activeVisitorIds,
  }
}

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

function SectionCard({ title, titleZh, children }: { title: string; titleZh: string; children: React.ReactNode }) {
  return (
    <section className="bg-white border border-mist p-6">
      <h3 className="font-serif text-base mb-4">
        {title} <span className="text-sm text-stone">{titleZh}</span>
      </h3>
      {children}
    </section>
  )
}

export default async function AdminAnalyticsPage() {
  const stats = await getStats()

  const maxPathViews = stats.pageStats[0]?._count._all ?? 0
  const maxCountryViews = stats.countryStats[0]?._count._all ?? 0

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

  const trails = (stats.activeVisitorOrder ?? activeVisitorIdsFallback(stats.recentEvents))
    .map((visitorId) => {
      const session = sessionByVisitor.get(visitorId)
      const events = (eventsByVisitor.get(visitorId) ?? []).sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
      )
      if (!events.length) return null
      if (session) return { session, events }

      const first = events[0]
      const last = events[events.length - 1]
      return {
        session: {
          id: `fallback-${visitorId}`,
          visitorId,
          ip: last.ip ?? first.ip,
          country: last.country ?? first.country,
          userAgent: last.userAgent ?? first.userAgent,
          firstSeen: first.createdAt,
          lastSeen: last.createdAt,
          pageCount: events.length,
        },
        events,
      }
    })
    .filter((trail): trail is NonNullable<typeof trail> => trail !== null)
    .slice(0, 30)

  function activeVisitorIdsFallback(events: typeof stats.recentEvents) {
    const map = new Map<string, Date>()
    for (const e of events) {
      const prev = map.get(e.visitorId)
      if (!prev || e.createdAt > prev) {
        map.set(e.visitorId, e.createdAt)
      }
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1].getTime() - a[1].getTime())
      .map(([id]) => id)
  }

  const recentLogins = await prisma.loginRecord.findMany({
    orderBy: { createdAt: "desc" },
    take: 30,
  })

  return (
    <div>
      <div className="mb-8">
        <h1 className="heading-md">{bi("Analytics", "数据分析")}</h1>
        <p className="text-body text-sm mt-1">{DESCRIPTION}</p>
      </div>

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
        <SectionCard title="Visitor Trails" titleZh="访客轨迹">
          {trails.length === 0 ? (
            <p className="text-sm text-stone">{bi("No visitor trails recorded yet.", "暂无访客轨迹。")}</p>
          ) : (
            <div className="space-y-5">
              {trails.map(({ session, events }) => {
                const latest = events[events.length - 1]
                const displayCountry = session.country || latest?.country
                const displayIp = session.ip || latest?.ip

                return (
                <div key={session.id} className="border border-mist/60 p-4">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone mb-2">
                    <span className="text-base">{countryFlag(displayCountry)}</span>
                    <span className="font-medium text-charcoal">{countryName(displayCountry)}</span>
                    {displayIp && <span className="font-mono">{displayIp}</span>}
                    <span className="ml-auto">
                      {events.length} {bi("steps", "步")} · {formatDateShort(session.firstSeen)}
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
