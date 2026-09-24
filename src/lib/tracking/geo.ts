import geoip from "geoip-lite"

const MAX_CACHE = 20000
const cache = new Map<string, string | null>()

export function countryFromIp(ip: string | null | undefined): string | null {
  if (!ip || ip.length < 7 || ip.length > 45) return null
  const key = ip
  if (cache.has(key)) return cache.get(key) ?? null

  try {
    const result = geoip.lookup(ip)
    const country = result?.country ?? null
    cache.set(key, country)
  } catch {
    cache.set(key, null)
  }

  if (cache.size > MAX_CACHE) {
    const oldest = cache.keys().next().value
    if (oldest !== undefined) cache.delete(oldest)
  }

  return cache.get(key) ?? null
}

export function countryName(iso: string | null | undefined): string {
  if (!iso) return "Unknown"
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(iso) ?? iso
  } catch {
    return iso
  }
}

export function countryFlag(iso: string | null | undefined): string {
  if (!iso || iso.length !== 2) return ""
  return String.fromCodePoint(...[...iso.toUpperCase()].map((c) => 127397 + c.charCodeAt(0)))
}