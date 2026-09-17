const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://commoditychina.com"

export interface SitemapEntry {
  url: string
  lastModified?: Date
  changeFrequency?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never"
  priority?: number
  images?: { url: string; caption?: string; title?: string }[]
  videos?: { url: string; title?: string; description?: string }[]
}

export const staticRoutes: SitemapEntry[] = [
  { url: baseUrl, changeFrequency: "weekly", priority: 1.0 },
  { url: `${baseUrl}/products`, changeFrequency: "daily", priority: 0.9 },
  { url: `${baseUrl}/blog`, changeFrequency: "weekly", priority: 0.8 },
  { url: `${baseUrl}/faq`, changeFrequency: "monthly", priority: 0.5 },
  { url: `${baseUrl}/affiliate`, changeFrequency: "monthly", priority: 0.5 },
]

export const allRoutes: SitemapEntry[] = [...staticRoutes]