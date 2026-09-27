/** Subject line cap. Long subjects get truncated by most clients anyway. */
export const MAX_SUBJECT = 200

/** Plain-text body cap for a single campaign. */
export const MAX_BODY = 20_000

/**
 * Delivery pacing.
 *
 * Bulk mail sent back-to-back from one IP is the pattern that gets a sending
 * domain throttled or blacklisted, so campaigns are delivered serially with a
 * pause between messages. Two seconds keeps a small list moving without looking
 * like a burst; large lists are safer at the top of the range.
 */
export const DEFAULT_DELAY_MS = 2_000
export const MAX_DELAY_MS = 60_000

/** Guard against a campaign aimed at an implausibly large audience. */
export const MAX_CAMPAIGN_RECIPIENTS = 20_000

/**
 * Deliveries allowed per calendar day, 0 meaning no daily cap.
 *
 * Spreading a large campaign over days keeps any single day's volume low, which
 * matters more than raw speed once a list is big: providers judge a sender on
 * the pattern of a whole day, not on one message. Offered as fixed steps so the
 * dashboard cannot ask for an arbitrary number that would never finish.
 */
export const DAILY_QUOTA_CHOICES = [0, 50, 100, 200, 500, 1000] as const

/** Cap a requested quota so a typo cannot create a multi-year campaign. */
export const MAX_DAILY_QUOTA = 5_000

export function clampDailyQuota(value: unknown): number {
  const n = typeof value === "number" && Number.isFinite(value) ? Math.round(value) : 0
  if (n <= 0) return 0
  return Math.min(n, MAX_DAILY_QUOTA)
}

export const CAMPAIGN_STATUSES = ["SENDING", "PAUSED", "COMPLETED", "STOPPED", "FAILED"] as const
export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number]

export const SEND_STATUSES = ["PENDING", "SENT", "FAILED", "SKIPPED"] as const
export type SendStatus = (typeof SEND_STATUSES)[number]

export function clampDelay(value: unknown): number {
  const n = typeof value === "number" && Number.isFinite(value) ? Math.round(value) : DEFAULT_DELAY_MS
  return Math.min(Math.max(n, 0), MAX_DELAY_MS)
}
