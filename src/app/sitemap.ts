import { MetadataRoute } from "next"
import { prisma } from "@/lib/db/prisma"
import { baseUrl, staticRoutes } from "@/lib/seo/sitemap-data"
import { routing } from "@/i18n/routing"

type SitemapEntry = {
  url: string
  lastModified?: Date
  changeFrequency?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never"
  priority?: number
  images?: string[]
  alternates?: {
    languages: Record<string, string>
  }
}

function absUrl(u: string): string {
  return u.startsWith("http") ? u : `${baseUrl}${u.startsWith("/") ? u : `/${u}`}`
}

function alternatesFor(path: string, locales: readonly string[]): Record<string, string> {
  const clean = path.startsWith("/") ? path : `/${path}`
  const out: Record<string, string> = {}
  for (const locale of locales) {
    out[locale] = `${baseUrl}/${locale}${clean === "/" ? "" : clean}`
  }
  out["x-default"] = `${baseUrl}/en${clean === "/" ? "" : clean}`
  return out
}

function extractLocalePath(url: string, locales: readonly string[]): string | null {
  let pathname = ""
  try {
    pathname = new URL(url).pathname
  } catch {
    return null
  }
  for (const locale of locales) {
    if (pathname === `/${locale}`) return "/"
    const prefix = `/${locale}/`
    if (pathname.startsWith(prefix)) {
      const remainder = pathname.slice(prefix.length - 1)
      return remainder || "/"
    }
  }
  return null
}

// 保持运行时动态生成（构建期无需数据库）。重复的爬虫请求会被 nginx 微缓存
// (location / 的 b2b_core) 在 5 分钟内直接命中, 不会反复回到 Node 渲染。
export const dynamic = "force-dynamic"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const locales = routing.locales
  const entries: SitemapEntry[] = staticRoutes.map((entry) => {
    const localePath = extractLocalePath(entry.url, locales)
    return {
      url: entry.url,
      lastModified: entry.lastModified || new Date(),
      changeFrequency: entry.changeFrequency || "monthly",
      priority: entry.priority || 0.5,
      ...(localePath ? { alternates: { languages: alternatesFor(localePath, locales) } } : {}),
    }
  })

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

  for (const locale of locales) {
    const prefix = `/${locale}`

    for (const p of products) {
      const path = `/products/${p.slug}`
      entries.push({
        url: `${baseUrl}${prefix}/products/${p.slug}`,
        lastModified: p.updatedAt,
        changeFrequency: "weekly",
        priority: 0.8,
        images: p.images[0] ? [absUrl(p.images[0].url)] : undefined,
        alternates: { languages: alternatesFor(path, locales) },
      })
    }

    for (const c of categories) {
      const path = `/categories/${c.slug}`
      entries.push({
        url: `${baseUrl}${prefix}/categories/${c.slug}`,
        lastModified: c.updatedAt,
        changeFrequency: "weekly",
        priority: 0.7,
        alternates: { languages: alternatesFor(path, locales) },
      })
    }

    for (const post of posts) {
      const path = `/blog/${post.slug}`
      entries.push({
        url: `${baseUrl}${prefix}/blog/${post.slug}`,
        lastModified: post.updatedAt,
        changeFrequency: "monthly",
        priority: 0.6,
        images: post.coverImage ? [absUrl(post.coverImage)] : undefined,
        alternates: { languages: alternatesFor(path, locales) },
      })
    }

    for (const page of pages) {
      const path = `/pages/${page.slug}`
      entries.push({
        url: `${baseUrl}${prefix}/pages/${page.slug}`,
        lastModified: page.updatedAt,
        changeFrequency: "monthly",
        priority: 0.5,
        alternates: { languages: alternatesFor(path, locales) },
      })
    }
  }

  return entries
}
