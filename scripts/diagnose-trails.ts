/**
 * Read-only diagnostic for the "visitor trail has only 1 step" report.
 *
 * Prints:
 *   1. the visit_events column list (confirm "sessionId" exists),
 *   2. a per-visitor summary for the last 7 days (events vs distinct sessions),
 *   3. the raw rows for the busiest recent visitor.
 *
 * It only runs SELECTs — no writes, no deletes, no schema changes.
 *
 *   npm run db:diagnose-trails
 */

import { prisma } from "@/lib/db/prisma"

async function main() {
  const columns = await prisma.$queryRaw<
    { column_name: string; data_type: string; is_nullable: string }[]
  >`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'visit_events'
    ORDER BY ordinal_position
  `
  console.log("=== visit_events columns ===")
  for (const c of columns) {
    console.log(`  ${c.column_name}\t${c.data_type}\tnullable=${c.is_nullable}`)
  }

  const summary = await prisma.$queryRaw<
    {
      visitorId: string
      events: bigint
      distinct_sessions: bigint
      null_session_rows: bigint
      distinct_paths: bigint
      first_at: Date
      last_at: Date
    }[]
  >`
    SELECT
      "visitorId",
      count(*)                                    AS events,
      count(DISTINCT "sessionId")                 AS distinct_sessions,
      count(*) FILTER (WHERE "sessionId" IS NULL) AS null_session_rows,
      count(DISTINCT path)                        AS distinct_paths,
      min("createdAt")                            AS first_at,
      max("createdAt")                            AS last_at
    FROM "public"."visit_events"
    WHERE "createdAt" >= now() - interval '7 days'
    GROUP BY "visitorId"
    ORDER BY max("createdAt") DESC
    LIMIT 20
  `
  console.log("\n=== per-visitor summary (last 7 days) ===")
  for (const r of summary) {
    console.log(
      `  ${r.visitorId}  events=${Number(r.events)}  distinctSessions=${Number(
        r.distinct_sessions
      )}  nullSessionRows=${Number(r.null_session_rows)}  paths=${Number(r.distinct_paths)}  ${r.first_at.toISOString()} -> ${r.last_at.toISOString()}`
    )
  }

  const rows = await prisma.$queryRaw<
    { visitorId: string; path: string; sessionId: string | null; isBot: boolean; createdAt: Date }[]
  >`
    SELECT "visitorId", path, "sessionId", "isBot", "createdAt"
    FROM "public"."visit_events"
    WHERE "visitorId" = (
      SELECT "visitorId" FROM "public"."visit_events"
      WHERE "createdAt" >= now() - interval '7 days'
      GROUP BY "visitorId"
      ORDER BY count(*) DESC, max("createdAt") DESC
      LIMIT 1
    )
    ORDER BY "createdAt" ASC
  `
  console.log("\n=== raw rows for the busiest recent visitor ===")
  for (const r of rows) {
    console.log(
      `  ${r.createdAt.toISOString()}  session=${r.sessionId ?? "NULL"}  isBot=${r.isBot}  ${r.path}`
    )
  }
}

main()
  .catch((error) => {
    console.error("[diagnose-trails] failed:", error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
