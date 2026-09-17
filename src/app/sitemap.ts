import { MetadataRoute } from "next"
import { prisma } from "@/lib/db/prisma"
import { staticRoutes } from "@/lib/seo/sitemap-data"

type SitemapEntry = {
  url: string
  lastModified?: Date
  changeFrequency?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never"
  priority?: number
  images?: string[]
}

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://commoditychina.com"

function absUrl(u: string): string {
  return u.startsWith("http") ? u : `${baseUrl}${u.startsWith("/") ? u : `/${u}`}`
}

export const dynamic = "force-dynamic"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: SitemapEntry[] = staticRoutes.map((entry) => ({
    url: entry.url,
    lastModified: entry.lastModified || new Date(),
    changeFrequency: entry.changeFrequency || "monthly",
    priority: entry.priority || 0.5,
  }))

  const [products, categories, posts, pages] = await Promise.all([
    prisma.product.findMany({
      where: { status: "ACTIVE", deletedAt: null },
      select: { slug: true, updatedAt: true, images: { select: { url: true }, take: 1 } },
    }),
    prisma.category.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    }),
    prisma.blogPost.findMany({
      where: { isPublished: true, publishedAt: { not: null } },
      select: { slug: true, updatedAt: true, coverImage: true },
    }),
    prisma.page.findMany({
      where: { isPublished: true },
      select: { slug: true, updatedAt: true },
    }),
  ])

  for (const p of products) {
    entries.push({
      url: `${baseUrl}/products/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly",
      priority: 0.8,
      images: p.images[0] ? [absUrl(p.images[0].url)] : undefined,
    })
  }

  for (const c of categories) {
    entries.push({
      url: `${baseUrl}/categories/${c.slug}`,
      lastModified: c.updatedAt,
      changeFrequency: "weekly",
      priority: 0.7,
    })
  }

  for (const post of posts) {
    entries.push({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: post.updatedAt,
      changeFrequency: "monthly",
      priority: 0.6,
      images: post.coverImage ? [absUrl(post.coverImage)] : undefined,
    })
  }

  for (const page of pages) {
    entries.push({
      url: `${baseUrl}/pages/${page.slug}`,
      lastModified: page.updatedAt,
      changeFrequency: "monthly",
      priority: 0.5,
    })
  }

  return entries
}