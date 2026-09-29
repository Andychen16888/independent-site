/**
 * Fixed-window rate limiter for unauthenticated endpoints.
 *
 * In-memory on purpose: it protects a single PM2 fork from casual form spam and
 * bot floods, and needs no Redis in the deployment this site runs. It is
 * per-process, so with more than one instance the effective limit is multiplied
 * by the instance count — acceptable for abuse damping, not for billing.
 */

interface Bucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

// Bounded so a flood of unique keys (one per spoofed IP) cannot grow the map
// without limit. Evicted lazily on write plus periodically below.
const MAX_BUCKETS = 10_000
let lastSweep = Date.now()

function sweep(now: number) {
  if (now - lastSweep < 60_000) return
  lastSweep = now
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key)
  }
  if (buckets.size <= MAX_BUCKETS) return
  // Still oversized: drop the oldest insertions first.
  const excess = buckets.size - MAX_BUCKETS
  let dropped = 0
  for (const key of buckets.keys()) {
    buckets.delete(key)
    if (++dropped >= excess) break
  }
}

export interface RateLimitResult {
  ok: boolean
  remaining: number
  retryAfterSeconds: number
}

export function rateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number }
): RateLimitResult {
  const now = Date.now()
  sweep(now)

  const existing = buckets.get(key)
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true, remaining: limit - 1, retryAfterSeconds: 0 }
  }

  existing.count += 1
  if (existing.count > limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    }
  }
  return {
    ok: true,
    remaining: limit - existing.count,
    retryAfterSeconds: 0,
  }
}

/**
 * Best-effort client IP from proxy headers.
 *
 * `x-forwarded-for` is client-controlled unless a proxy overwrites it, so this
 * only raises the cost of casual spam — never treat it as authentication.
 */
export function clientIp(req: Request): string {
  const headers = req.headers
  const forwarded = headers.get("x-forwarded-for")
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim()
    if (first) return first
  }
  return headers.get("x-real-ip")?.trim() || "unknown"
}
