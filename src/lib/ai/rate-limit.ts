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
 * 站点在 Cloudflare 后面，nginx 收到的 `$remote_addr` 是 Cloudflare 边缘节点 IP。
 * 若直接把它当成访客 IP，后台数据分析里每个访客显示的都是 Cloudflare 的 IP。
 *
 * 取值顺序（第一个「公网」地址胜出）：
 *   1. `x-real-ip`      —— nginx 设置；配了 real_ip 模块时它就是真实访客 IP
 *   2. `cf-connecting-ip` —— Cloudflare 保证写入真实访客 IP
 *   3. `x-forwarded-for` 最右侧一跳（可信代理追加的那一跳）
 *
 * 内网 / 回环 / 链路本地地址一律丢弃，避免 `127.0.0.1`、Docker 网段之类被当成访客，
 * 也避免 `x-forwarded-for` 左端可伪造的值抬高 Map 的基数（原注释里的 OOM 问题）。
 */
export function clientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for")
  const candidates = [
    req.headers.get("x-real-ip"),
    req.headers.get("cf-connecting-ip"),
    ...(forwarded ? forwarded.split(",").reverse() : []),
  ]

  for (const candidate of candidates) {
    const value = candidate?.trim()
    if (value && isPublicIp(value)) return normalizeIp(value)
  }

  for (const candidate of candidates) {
    const value = candidate?.trim()
    if (value) return normalizeIp(value)
  }

  return "unknown"
}

function normalizeIp(value: string): string {
  return value.startsWith("::ffff:") ? value.slice(7) : value
}

function isPublicIp(value: string): boolean {
  return !isPrivateIp(value)
}

/**
 * 内网 / 回环 / 链路本地 / CGNAT(100.64/10) / 保留地址判定。
 * 同时覆盖 IPv4 与 IPv6（`::1`、`fc00::/7`、`fe80::/10`、IPv4 映射地址）。
 */
export function isPrivateIp(value: string | null | undefined): boolean {
  if (!value) return true
  const ip = value.trim().toLowerCase().replace(/^\[|]$/g, "")
  const mapped = ip.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/)
  const target = mapped ? mapped[1] : ip

  const version = target.includes(":") ? 6 : 4
  if (version === 4) {
    const parts = target.split(".")
    if (parts.length !== 4) return true
    const octets = parts.map((part) => Number(part))
    if (octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) return true
    const [a, b] = octets
    if (a === 0 || a === 10 || a === 127) return true
    if (a === 169 && b === 254) return true
    if (a === 172 && b >= 16 && b <= 31) return true
    if (a === 192 && b === 168) return true
    if (a === 100 && b >= 64 && b <= 127) return true
    if (a === 192 && b === 0) return true
    if (a >= 224) return true
    return false
  }

  if (!/^[0-9a-f:]+$/.test(target)) return true
  if (target === "::" || target === "::1") return true
  const head = target.split(":")[0].padStart(4, "0")
  if (Number.parseInt(head, 16) >= 0xfc00 && Number.parseInt(head, 16) <= 0xfdff) return true
  if (Number.parseInt(head, 16) >= 0xfe80 && Number.parseInt(head, 16) <= 0xfebf) return true
  return false
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
