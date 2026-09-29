import { prisma } from "@/lib/db/prisma"

/**
 * Human-readable document numbers: RFQ-202609270001, QT-20260927001.
 *
 * The counter lives in a row keyed by (scope, yyyyMMdd) and is bumped with
 * `INSERT ... ON CONFLICT DO UPDATE ... RETURNING`, which PostgreSQL executes as
 * a single atomic statement. That matters: both `inquiryNo` and `quotationNo`
 * are unique columns, so two concurrent submissions that read the same counter
 * value would collide and fail the whole request. Prisma's `upsert` is a
 * select-then-write pair and is not safe here.
 */

export type NumberScope = "RFQ" | "QT" | "EM"

/**
 * Business days are bucketed in the site's own timezone rather than UTC, so the
 * counter rolls over at the local midnight an operator expects instead of at
 * 08:00 or 16:00 depending on daylight-saving shifts.
 */
const BIZ_TZ = process.env.BUSINESS_TIMEZONE || "Asia/Shanghai"

const PADDING: Record<NumberScope, number> = {
  RFQ: 4, // RFQ-202609270001
  QT: 3, // QT-20260927001
  EM: 4, // EM-202609270001
}

export function businessDay(now: Date = new Date()): string {
  /*
   * Assembled from formatToParts rather than trusting a locale's output string.
   * `en-CA` is *usually* YYYY-MM-DD, but ICU is free to insert U+200F marks or
   * switch to a different order, and the value is persisted in a sequence key and
   * concatenated into a document number. A stray separator there would emit
   * `RFQ-2026-09-270001`, so the digits are collected explicitly instead.
   */
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BIZ_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now)

  const field = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((p) => p.type === type)?.value ?? ""

  return `${field("year")}${field("month")}${field("day")}`
}

/**
 * Reserves the next number for `scope` and returns the formatted value.
 *
 * Rows accumulate one per scope per day, so a busy day creates a single row that
 * simply keeps growing; the counter is never reset in place. Callers should treat
 * the returned value as consumed even if the surrounding transaction later fails
 * — gaps in document numbering are normal and expected in sales systems, while
 * duplicate numbers are not.
 */
export async function nextDocumentNumber(
  scope: NumberScope,
  now: Date = new Date()
): Promise<string> {
  const periodDay = businessDay(now)

  const rows = await prisma.$queryRaw<{ counter: number }[]>`
    INSERT INTO "number_sequences" ("id", "scope", "periodDay", "counter")
    VALUES (${`seq_${scope}_${periodDay}`}, ${scope}, ${periodDay}, 1)
    ON CONFLICT ("scope", "periodDay")
    DO UPDATE SET "counter" = "number_sequences"."counter" + 1
    RETURNING "counter"
  `

  const counter = rows[0]?.counter
  if (typeof counter !== "number") {
    throw new Error(`Failed to allocate ${scope} number for ${periodDay}`)
  }

  return `${scope}-${periodDay}${String(counter).padStart(PADDING[scope], "0")}`
}
