import { routing } from "@/i18n/routing"
import { GENERIC_SITE_URL } from "@/lib/settings/brand"

export const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || GENERIC_SITE_URL

export interface SitemapEntry {
  url: string
  lastModified?: Date
  changeFrequency?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never"
  priority?: number
  images?: { url: string; caption?: string; title?: string }[]
  videos?: { url: string; title?: string; description?: string }[]
}

type StaticRoute = {
  path: string
  changeFrequency?: SitemapEntry["changeFrequency"]
  priority?: number
}

const defaultRoutes: StaticRoute[] = [
  { path: "/", changeFrequency: "weekly", priority: 1.0 },
  { path: "/products", changeFrequency: "daily", priority: 0.9 },
  { path: "/blog", changeFrequency: "weekly", priority: 0.8 },
  { path: "/faq", changeFrequency: "monthly", priority: 0.5 },
  { path: "/affiliate", changeFrequency: "monthly", priority: 0.5 },
]

export function staticRoutesFor(locale: string, origin: string): SitemapEntry[] {
  const prefix = `/${locale}`
  return defaultRoutes.map((r) => ({
    url: `${origin}${prefix}${r.path === "/" ? "" : r.path}`,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }))
}

export const staticRoutes: SitemapEntry[] = routing.locales.flatMap((locale) =>
  staticRoutesFor(locale, baseUrl)
)

export const allRoutes: SitemapEntry[] = [...staticRoutes]