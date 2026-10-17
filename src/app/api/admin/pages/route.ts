import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { requireAdmin } from "@/lib/auth/admin-guard"
import { invalidateStorefront } from "@/lib/settings/invalidate-storefront"
import { upsertPageTranslations } from "@/lib/i18n/content"
import { autoTranslatePage, isAutoTranslateConfigured } from "@/lib/ai/translate-page"

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
    const {
      title,
      slug,
      excerpt,
      content,
      coverImage,
      isPublished,
      seoTitle,
      seoDescription,
      seoKeywords,
      translations,
      autoTranslate,
      overwriteTranslations,
    } = body

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

    let translation = null
    let translationError: string | null = null
    if (autoTranslate !== false) {
      if (isAutoTranslateConfigured()) {
        try {
          const forceOverwrite = page.slug === "about" || page.slug === "contact"
          translation = await autoTranslatePage(
            page.id,
            {
              title: page.title,
              excerpt: page.excerpt,
              content: page.content,
              seoTitle: page.seoTitle,
              seoDescription: page.seoDescription,
              seoKeywords: page.seoKeywords,
            },
            { overwrite: overwriteTranslations === true || (overwriteTranslations === undefined && forceOverwrite) }
          )
        } catch (error) {
          translationError = (error as Error).message
          console.error("Auto-translate page (create) failed:", error)
        }
      } else {
        translationError = "OPENAI_API_KEY is not configured"
      }
    }

    const freshTranslations = await prisma.pageTranslation.findMany({
      where: { pageId: page.id },
      orderBy: { locale: "asc" },
    })

    invalidateStorefront()
    return NextResponse.json({ page, translations: freshTranslations, translation, translationError }, { status: 201 })
  } catch (error) {
    console.error("Admin page create error:", error)
    return NextResponse.json({ error: "Failed to create page" }, { status: 500 })
  }
}
