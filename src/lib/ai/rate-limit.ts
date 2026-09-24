import type { NextRequest } from "next/server"

const WINDOW_MS = 60_000
const MAX_BUCKETS = 10_000
const RATE_LIMIT_ENV = Number(process.env.CHAT_RATE_LIMIT) || 20

interface Bucket {
  count: number
  resetAt: number
}

/**
 * Sliding-window rate limiter that stays memory-bounded.
 *
 * Previously this used an unbounded Map that was never evicted: every unique
 * client IP added a permanent entry, so on a long-running process with real
 * traffic (and crawlers / spoofable X-Forwarded-For headers) the map grew
 * without limit 24/7. Over ~a day that crossed the 2G pm2 heap cap → OOM
 * restart → the whole site (client AND admin, since everything is dynamic SSR)
 * returned 504 until the process came back.
 *
 * Now the map is bounded: expired buckets are dropped on access, and a periodic
 * sweep prunes stale entries once the table grows large, so memory usage is fixed.
 */
const buckets = new Map<string, Bucket>()

function pruneBuckets(now: number): void {
  for (const [ip, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(ip)
  }
}

/**
 * Extract the client IP the safest way possible.
 *
 * `x-forwarded-for` left-most element is trivially client-spoofable, which the
 * old unbounded limiter used to key its never-evicted Map — so every spoofed
 * value (and crawlers) added a permanent bucket. Prefer `x-real-ip` (set by the
 * reverse proxy, not the client), falling back to the RIGHT-most
 * already-trusted proxy hop of `x-forwarded-for`, then "unknown", so spoofing
 * can no longer drive key cardinality (and thus memory) either.
 */
export function clientIp(req: NextRequest): string {
  const realIp = req.headers.get("x-real-ip")
  if (realIp) return realIp.trim()
  const forwarded = req.headers.get("x-forwarded-for")
  if (forwarded) {
    const parts = forwarded.split(",").map((p) => p.trim())
    const last = parts[parts.length - 1]
    if (last) return last
  }
  return "unknown"
}

export function isRateLimited(ip: string): boolean {
  const now = Date.now()

  if (buckets.size >= MAX_BUCKETS) {
    pruneBuckets(now)
    // Still at capacity with only live buckets: drop the oldest to make room
    // rather than growing without bound.
    if (buckets.size >= MAX_BUCKETS) {
      let oldestKey: string | null = null
      let oldest = Infinity
      for (const [key, bucket] of buckets) {
        if (bucket.resetAt < oldest) {
          oldest = bucket.resetAt
          oldestKey = key
        }
      }
      if (oldestKey) buckets.delete(oldestKey)
    }
  }

  const bucket = buckets.get(ip)
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return false
  }
  bucket.count += 1
  return bucket.count > RATE_LIMIT_ENV
}
