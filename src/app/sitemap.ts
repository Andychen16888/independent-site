import { MetadataRoute } from "next"
import { allRoutes } from "@/lib/seo/sitemap-data"

type SitemapEntry = {
  url: string
  lastModified?: Date
  changeFrequency?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never"
  priority?: number
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return allRoutes.map((entry) => {
    const sitemapEntry: SitemapEntry = {
      url: entry.url,
      lastModified: entry.lastModified || new Date(),
      changeFrequency: entry.changeFrequency || "monthly",
      priority: entry.priority || 0.5,
    }
    return sitemapEntry
  })
}
