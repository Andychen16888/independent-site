import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { requireAdmin } from "@/lib/auth/admin-guard"
import { invalidateStorefront } from "@/lib/settings/invalidate-storefront"
import { upsertPageTranslations } from "@/lib/i18n/content"

function generateSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
}

export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req)
  if (authError) return authError

  try {
    const pages = await prisma.page.findMany({ orderBy: { createdAt: "desc" } })
    return NextResponse.json({ pages })
  } catch (error) {
    console.error("Admin pages fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch pages" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const authError = await requireAdmin(req)
  if (authError) return authError

  try {
    const body = await req.json()
    const { title, slug, excerpt, content, coverImage, isPublished, seoTitle, seoDescription, seoKeywords, translations } = body

    if (!title || content === undefined) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 })
    }

    let slugValue = slug
    if (!slugValue) slugValue = generateSlug(title)
    const existing = await prisma.page.findUnique({ where: { slug: slugValue } })
    if (existing) slugValue = `${slugValue}-${Date.now().toString().slice(-4)}`

    const page = await prisma.page.create({
      data: {
        title,
        slug: slugValue,
        excerpt: excerpt || null,
        content,
        coverImage: coverImage || null,
        isPublished: isPublished !== undefined ? isPublished : false,
        seoTitle: seoTitle || null,
        seoDescription: seoDescription || null,
        seoKeywords: seoKeywords || null,
      },
    })

    if (Array.isArray(translations)) {
      await upsertPageTranslations(page.id, translations)
    }

    invalidateStorefront()
    return NextResponse.json({ page }, { status: 201 })
  } catch (error) {
    console.error("Admin page create error:", error)
    return NextResponse.json({ error: "Failed to create page" }, { status: 500 })
  }
}