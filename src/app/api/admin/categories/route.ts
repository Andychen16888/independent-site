import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { requireAdmin } from "@/lib/auth/admin-guard"
import { invalidateStorefront } from "@/lib/settings/invalidate-storefront"
import { upsertCategoryTranslations } from "@/lib/i18n/category"
import { routing } from "@/i18n/routing"
import { canonicalCategorySlug } from "@/lib/categories/slug"
import { ensureUniqueCategorySlug } from "@/lib/categories/unique-slug"
import { buildCategoryTranslations } from "@/lib/ai/translate-category"

function parseCategoryTranslations(input: unknown): { locale: string; name?: string }[] {
  if (!input || typeof input !== "object") return []
  const allowed = new Set<string>(routing.locales.filter((loc) => loc !== "en"))
  const out: { locale: string; name?: string }[] = []
  for (const [locale, value] of Object.entries(input as Record<string, unknown>)) {
    if (!allowed.has(locale)) continue
    if (typeof value !== "string") continue
    out.push({ locale, name: value })
  }
  return out
}

export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req)
  if (authError) return authError

  try {
    const categories = await prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: { _count: { select: { products: true, children: true } } },
    })

    return NextResponse.json({ categories })
  } catch (error) {
    console.error("Admin categories fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const authError = await requireAdmin(req)
  if (authError) return authError

  try {
    const body = await req.json()
    const {
      name,
      slug,
      description,
      image,
      parentId,
      sortOrder,
      isActive,
      isFeatured,
      seoTitle,
      seoDescription,
      seoKeywords,
      translations,
      autoTranslate,
      overwriteTranslations,
    } = body

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    // The slug field is free text: "LED Lighting" must be stored as
    // "led-lighting", otherwise the category URL breaks and splits into several
    // indexed variants.
    const slugValue = await ensureUniqueCategorySlug(canonicalCategorySlug(slug, name))

    const category = await prisma.category.create({
      data: {
        name,
        slug: slugValue,
        description: description || null,
        image: image || null,
        parentId: parentId || null,
        sortOrder: sortOrder !== undefined && sortOrder !== "" ? parseInt(sortOrder, 10) : 0,
        isActive: isActive !== undefined ? isActive : true,
        isFeatured: isFeatured !== undefined ? isFeatured : false,
        seoTitle: seoTitle || null,
        seoDescription: seoDescription || null,
        seoKeywords: seoKeywords || null,
      },
    })

    const manualRows = parseCategoryTranslations(translations)
    const manualMap = new Map(manualRows.map((row) => [row.locale, row.name || ""]))
    const shouldAutoTranslate = autoTranslate !== false
    const shouldOverwrite = overwriteTranslations !== false

    if (shouldAutoTranslate) {
      const generated = await buildCategoryTranslations({
        name,
        slug: slugValue,
        manual: manualMap,
        overwrite: shouldOverwrite,
      })
      await upsertCategoryTranslations(category.id, generated.translations)
      if (generated.failed.length > 0) {
        console.warn("[i18n] Category auto-translate failed for locales:", generated.failed)
      }
    } else {
      await upsertCategoryTranslations(category.id, manualRows)
    }

    invalidateStorefront()
    return NextResponse.json({ category }, { status: 201 })
  } catch (error) {
    console.error("Admin category create error:", error)
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 })
  }
}
