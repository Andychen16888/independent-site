/**
 * 访客埋点链路自检（只读，不修改任何数据）。
 *
 * 后台「数据分析」没有新数据时，先跑这个脚本确认到底是哪一环断了：
 *   1. visit_events / page_views 是否缺少 url 等字段（迁移只被记录、未真正执行）
 *   2. page_views 的 (url, date) 唯一约束是否存在
 *   3. 最近一条访客事件的时间，以及 12 秒突发去重是否吃掉了正常访问
 *
 * Usage:  npm run db:check-analytics
 * 退出码：0 = 一切正常；1 = 有问题（终端里会写明要执行什么命令）
 */
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { PrismaClient } from "@prisma/client"

const envFile = readFileSync(resolve(".env"), "utf-8")
for (const line of envFile.split("\n")) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith("#")) continue
  const sep = trimmed.indexOf("=")
  if (sep === -1) continue
  const key = trimmed.slice(0, sep).trim()
  const value = trimmed.slice(sep + 1).trim().replace(/^["']|["']$/g, "")
  if (!process.env[key]) process.env[key] = value
}

const prisma = new PrismaClient()

const REQUIRED_COLUMNS: Record<string, string[]> = {
  visit_events: ["visitorId", "path", "sessionId", "url", "title", "referrer", "ip", "country", "userAgent", "deviceType", "isBot", "source", "utmSource", "createdAt"],
  visitor_sessions: ["visitorId", "ip", "country", "userAgent", "deviceType", "source", "utmSource", "firstSeen", "lastSeen", "pageCount"],
  page_views: ["url", "path", "title", "views", "date", "country", "userAgent", "referrer", "createdAt", "updatedAt"],
}

async function main() {
  const problems: string[] = []

  for (const [table, required] of Object.entries(REQUIRED_COLUMNS)) {
    const rows = await prisma.$queryRaw<{ column_name: string }[]>`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = ${table}
    `
    const present = new Set(rows.map((row) => row.column_name))
    const missing = required.filter((column) => !present.has(column))
    if (missing.length === 0) {
      console.log(`[ok] ${table}: ${required.length} columns present`)
    } else {
      problems.push(`${table} 缺少字段: ${missing.join(", ")}`)
      console.log(`[FAIL] ${table}: 缺少字段 ${missing.join(", ")}`)
    }
  }

  const constraints = await prisma.$queryRaw<{ conname: string }[]>`
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.page_views'::regclass AND contype = 'u'
  `
  const constraintNames = constraints.map((row) => row.conname)
  if (constraintNames.includes("page_views_url_date_key")) {
    console.log("[ok] page_views 唯一约束: page_views_url_date_key")
  } else {
    problems.push("page_views 缺少唯一约束 page_views_url_date_key")
    console.log(`[FAIL] page_views 唯一约束缺失（当前: ${constraintNames.join(", ") || "无"}）`)
  }

  const latest = await prisma.visitEvent.findFirst({
    orderBy: { createdAt: "desc" },
    select: { visitorId: true, path: true, createdAt: true },
  })
  const total = await prisma.visitEvent.count()
  console.log(`[info] visit_events 总行数: ${total}`)
  if (latest) {
    const hours = (Date.now() - latest.createdAt.getTime()) / (60 * 60 * 1000)
    console.log(
      `[info] 最近一条访客事件: ${latest.createdAt.toISOString()} (${hours.toFixed(1)} 小时前) ` +
        `visitor=${latest.visitorId} path=${latest.path}`
    )
    if (hours > 24) problems.push(`最近一条访客事件已是 ${hours.toFixed(1)} 小时前，埋点写入链路可能仍然中断`)
  } else {
    problems.push("visit_events 一条记录都没有，埋点从未写入成功")
    console.log("[FAIL] visit_events 为空")
  }

  await prisma.$disconnect()

  if (problems.length > 0) {
    console.error("\n发现问题：")
    for (const problem of problems) console.error(`  - ${problem}`)
    console.error("\n修复步骤：npm run db:migrate && npm run db:check-analytics")
    process.exit(1)
  }

  console.log("\n访客埋点链路正常。")
}

main().catch(async (error) => {
  console.error("[check-analytics] failed:", error)
  await prisma.$disconnect()
  process.exit(1)
})