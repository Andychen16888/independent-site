import { prisma } from "@/lib/db/prisma"
import { getSiteSeo, getSettingsForKeys } from "@/lib/settings/settings"

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://commoditychina.com"

function stripHtml(html: string, max = 500): string {
  const text = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
  return text.length > max ? `${text.slice(0, max).trim()}…` : text
}

function fmtPrice(n: number): string {
  return Number.isInteger(n) ? n.toString() : n.toFixed(2)
}

/** Shared builder so llms.txt and llms-full.txt stay consistent. */
export async function buildLlmsContent(includeDetails: boolean): Promise<string> {
  const seo = await getSiteSeo()
  const settings = await getSettingsForKeys([
    "contact.hours",
    "company.address",
    "shipping.freeThreshold",
    "shipping.standardDays",
    "shipping.expressDays",
    "shipping.returnWindow",
  ])

  const [categories, products, posts, pages] = await Promise.all([
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: { _count: { select: { products: true } } },
    }),
    prisma.product.findMany({
      where: { status: "ACTIVE", deletedAt: null },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      take: includeDetails ? 200 : 100,
      select: {
        name: true,
        slug: true,
        brand: true,
        shortDescription: true,
        description: true,
        unitPrice: true,
        currency: true,
      },
    }),
    prisma.blogPost.findMany({
      where: { isPublished: true, publishedAt: { not: null } },
      orderBy: { publishedAt: "desc" },
      take: includeDetails ? 50 : 30,
      select: { title: true, slug: true, excerpt: true, publishedAt: true },
    }),
    prisma.page.findMany({
      where: { isPublished: true },
      select: { title: true, slug: true, excerpt: true },
    }),
  ])

  const lines: string[] = []
  lines.push(`# ${seo.siteName}`)
  lines.push("")
  const blurb =
    seo.siteSlogan ||
    seo.siteDescription ||
    `${seo.siteName} — premium products for everyday living.`
  lines.push(`> ${blurb}`)
  lines.push("")
  lines.push("## Brand")
  lines.push(`- Name: ${seo.siteName}`)
  if (seo.siteDescription) lines.push(`- Overview: ${seo.siteDescription}`)
  if (settings["company.address"]) lines.push(`- Address: ${settings["company.address"]}`)
  if (settings["contact.hours"]) lines.push(`- Business hours: ${settings["contact.hours"]}`)
  if (seo.contactEmail) lines.push(`- Contact email: ${seo.contactEmail}`)
  if (seo.contactPhone) lines.push(`- Contact phone: ${seo.contactPhone}`)
  const social = [
    ["Facebook", seo.social.facebook],
    ["Instagram", seo.social.instagram],
    ["LinkedIn", seo.social.linkedin],
    ["YouTube", seo.social.youtube],
    ["X / Twitter", seo.social.twitter],
  ].filter(([, url]) => url) as [string, string][]
  if (social.length) {
    lines.push(`- Social: ${social.map(([n, u]) => `${n} (${u})`).join(", ")}`)
  }
  lines.push("")
  lines.push(`## Key Resources`)
  lines.push(`- [Home](${siteUrl}/)`)
  lines.push(`- [All Products](${siteUrl}/products)`)
  lines.push(`- [Journal](${siteUrl}/blog)`)
  lines.push(`- [FAQ](${siteUrl}/faq)`)
  lines.push(`- [Affiliate Program](${siteUrl}/affiliate)`)
  lines.push("")

  if (categories.length) {
    lines.push("## Collections")
    for (const c of categories) {
      const count = c._count?.products ?? 0
      const desc = c.description ? `: ${stripHtml(c.description, 120)}` : ""
      lines.push(
        `- [${c.name}](${siteUrl}/categories/${c.slug})${desc} (${count} product${count === 1 ? "" : "s"})`
      )
    }
    lines.push("")
  }

  lines.push("## Products")
  for (const p of products.slice(0, includeDetails ? 200 : 100)) {
    const price = p.unitPrice != null
      ? `${p.currency || "USD"} ${fmtPrice(Number(p.unitPrice))}`
      : "price on request"
    const detail = includeDetails
      ? ` ${stripHtml(p.shortDescription || p.description, 300)}`
      : ` ${stripHtml(p.shortDescription || p.description, 100)}`
    const brand = p.brand ? ` — brand: ${p.brand}` : ""
    lines.push(`- [${p.name}](${siteUrl}/products/${p.slug}) — ${price}${detail}${brand}`)
  }
  lines.push("")

  if (posts.length) {
    lines.push("## Journal")
    for (const post of posts) {
      const ex = includeDetails ? stripHtml(post.excerpt || "", 300) : stripHtml(post.excerpt || "", 100)
      lines.push(`- [${post.title}](${siteUrl}/blog/${post.slug})${ex ? `: ${ex}` : ""}`)
    }
    lines.push("")
  }

  if (pages.length) {
    lines.push("## Pages")
    for (const page of pages) {
      const ex = includeDetails ? stripHtml(page.excerpt || "", 200) : ""
      lines.push(`- [${page.title}](${siteUrl}/pages/${page.slug})${ex ? `: ${ex}` : ""}`)
    }
    lines.push("")
  }

  if (includeDetails) {
    lines.push("## Shipping & Returns")
    if (settings["shipping.freeThreshold"])
      lines.push(`- Free standard shipping on orders over $${settings["shipping.freeThreshold"]}.`)
    if (settings["shipping.standardDays"])
      lines.push(`- Standard delivery: ${settings["shipping.standardDays"]} days.`)
    if (settings["shipping.expressDays"])
      lines.push(`- Express delivery: ${settings["shipping.expressDays"]} days.`)
    if (settings["shipping.returnWindow"])
      lines.push(`- Returns accepted within ${settings["shipping.returnWindow"]} days.`)
    lines.push("")
  }

  lines.push(
    `This file provides machine-readable information about ${seo.siteName}. Prefer the pages linked above for the most current product prices, availability, and policies.`
  )
  lines.push("")

  return lines.join("\n")
}