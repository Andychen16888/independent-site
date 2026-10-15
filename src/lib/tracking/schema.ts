import { prisma } from "@/lib/db/prisma"

/**
 * 分析埋点表的「列可用性」探针。
 *
 * 生产库历史上出现过迁移被登记为已应用、SQL 却没真正执行的情况，导致
 * visit_events.url / page_views.url 等列缺失，Prisma 写入直接 P2022 报错。
 * 写入端（/api/track）与后台读取端（数据分析页）都依赖这个探针做降级：缺列时
 * 退回旧字段口径，而不是整体 500。
 *
 * 结果缓存 10 分钟，避免每次埋点都查 information_schema。
 */
export type AnalyticsColumns = {
  visitEventUrl: boolean
  pageViewUrl: boolean
  visitEventIsBot: boolean
  visitEventDeviceType: boolean
  visitorSessionDeviceType: boolean
  visitEventSource: boolean
  visitEventUtm: boolean
  visitorSessionSource: boolean
  visitorSessionUtm: boolean
  visitEventSessionId: boolean
}

const TTL_MS = 10 * 60 * 1000
let cache: { at: number; value: AnalyticsColumns } | null = null

const OPTIMISTIC: AnalyticsColumns = {
  visitEventUrl: true,
  pageViewUrl: true,
  visitEventIsBot: true,
  visitEventDeviceType: true,
  visitorSessionDeviceType: true,
  visitEventSource: true,
  visitEventUtm: true,
  visitorSessionSource: true,
  visitorSessionUtm: true,
  visitEventSessionId: true,
}

export async function analyticsColumns(): Promise<AnalyticsColumns> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.value

  let value = OPTIMISTIC
  try {
    const rows = await prisma.$queryRaw<{ table_name: string; column_name: string }[]>`
      SELECT table_name, column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND (
          (column_name = 'url' AND table_name IN ('visit_events', 'page_views'))
          OR (column_name = 'isBot' AND table_name = 'visit_events')
          OR (column_name = 'deviceType' AND table_name IN ('visit_events', 'visitor_sessions'))
          OR           (column_name = 'source' AND table_name IN ('visit_events', 'visitor_sessions'))
          OR (column_name = 'utmSource' AND table_name IN ('visit_events', 'visitor_sessions'))
          OR (column_name = 'sessionId' AND table_name = 'visit_events')
        )
    `
    const visitEvents = new Set<string>()
    const pageViews = new Set<string>()
    const visitorSessions = new Set<string>()
    for (const row of rows) {
      if (row.table_name === "visit_events") visitEvents.add(row.column_name)
      if (row.table_name === "page_views") pageViews.add(row.column_name)
      if (row.table_name === "visitor_sessions") visitorSessions.add(row.column_name)
    }
    value = {
      visitEventUrl: visitEvents.has("url"),
      pageViewUrl: pageViews.has("url"),
      visitEventIsBot: visitEvents.has("isBot"),
      visitEventDeviceType: visitEvents.has("deviceType"),
      visitorSessionDeviceType: visitorSessions.has("deviceType"),
      visitEventSource: visitEvents.has("source"),
      visitEventUtm: visitEvents.has("utmSource"),
      visitorSessionSource: visitorSessions.has("source"),
      visitorSessionUtm: visitorSessions.has("utmSource"),
      visitEventSessionId: visitEvents.has("sessionId"),
    }
  } catch (error) {
    console.error("[track] analytics schema probe failed; assuming current schema.", error)
    return (cache = { at: Date.now(), value: OPTIMISTIC }).value
  }

  if (
    !value.visitEventUrl ||
    !value.pageViewUrl ||
    !value.visitEventIsBot ||
    !value.visitEventDeviceType ||
    !value.visitorSessionDeviceType ||
    !value.visitEventSource ||
    !value.visitEventUtm ||
    !value.visitorSessionSource ||
    !value.visitorSessionUtm ||
    !value.visitEventSessionId
  ) {
    console.warn(
      '[track] analytics schema is behind; run "npm run db:migrate". Falling back where possible.',
      value
    )
  }

  cache = { at: Date.now(), value }
  return value
}
