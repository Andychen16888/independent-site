import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { requireAdmin } from "@/lib/auth/admin-guard"
import { invalidateStorefront } from "@/lib/settings/invalidate-storefront"
import { upsertCategoryTranslations } from "@/lib/i18n/category"
import { routing } from "@/i18n/routing"
import { canonicalCategorySlug } from "@/lib/categories/slug"
import { ensureUniqueCategorySlug } from "@/lib/categories/unique-slug"
import { Prisma } from "@prisma/client"
import { buildCategoryTranslations } from "@/lib/ai/translate-category"

function isCategoryTranslationsTableMissing(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return false
  if (error.code !== "P2021") return false
  const table = (error.meta as { table?: unknown } | undefined)?.table
  return typeof table === "string" && table.includes("category_translations")
}

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

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAdmin(req)
  if (authError) return authError

  try {
    const { id } = await params
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        children: { orderBy: { sortOrder: "asc" } },
        _count: { select: { products: true, children: true } },
      },
    })
    if (!category) return NextResponse.json({ error: "Category not found" }, { status: 404 })
    let translationRows: { locale: string; name: string }[] = []
    try {
      translationRows = await prisma.categoryTranslation.findMany({
        where: { categoryId: id },
        orderBy: { locale: "asc" },
        select: { locale: true, name: true },
      })
    } catch (error) {
      if (!isCategoryTranslationsTableMissing(error)) throw error
      console.warn(
        `[i18n] category_translations table missing while fetching category ${id}; returning category without translations.`
      )
    }
    return NextResponse.json({ category: { ...category, translations: translationRows } })
  } catch (error) {
    console.error("Admin category get error:", error)
    return NextResponse.json({ error: "Failed to fetch category" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAdmin(req)
  if (authError) return authError

  try {
    const { id } = await params
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

    if (name !== undefined && !name.trim()) {
      return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 })
    }

    // Prevent setting parentId to itself or to a descendant (cycle guard)
    if (parentId === id) {
      return NextResponse.json({ error: "A category cannot be its own parent" }, { status: 400 })
    }

    const currentCategory = await prisma.category.findUnique({
      where: { id },
      select: { id: true, name: true, slug: true },
    })
    if (!currentCategory) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 })
    }

    let nextSlug: string | undefined
    if (slug !== undefined && slug !== "") {
      // Stored slugs must stay URL-safe: "LED Lighting" becomes "led-lighting" so
      // the category keeps one canonical URL.
      const desired = canonicalCategorySlug(slug, name ?? "")
      if (currentCategory.slug !== desired) {
        nextSlug = await ensureUniqueCategorySlug(desired, id)
      }
    }

    const data: any = {
      ...(name !== undefined ? { name } : {}),
      ...(nextSlug ? { slug: nextSlug } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(image !== undefined ? { image } : {}),
      ...(parentId !== undefined ? { parentId: parentId || null } : {}),
      ...(sortOrder !== undefined ? { sortOrder: parseInt(sortOrder, 10) } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
      ...(isFeatured !== undefined ? { isFeatured } : {}),
      ...(seoTitle !== undefined ? { seoTitle } : {}),
      ...(seoDescription !== undefined ? { seoDescription } : {}),
      ...(seoKeywords !== undefined ? { seoKeywords } : {}),
    }

    const category = await prisma.category.update({ where: { id }, data })

    const manualRows = parseCategoryTranslations(translations)
    const shouldAutoTranslate = autoTranslate !== false
    const shouldOverwrite = overwriteTranslations !== false

    if (shouldAutoTranslate) {
      const existingRows = await prisma.categoryTranslation.findMany({
        where: { categoryId: category.id },
        select: { locale: true, name: true },
      })
      const existingMap = new Map(existingRows.map((row) => [row.locale, row.name]))

      const manualMap = new Map<string, string>()
      for (const row of manualRows) {
        const incoming = (row.name || "").trim()
        const previous = (existingMap.get(row.locale) || "").trim()
        if (shouldOverwrite && incoming === previous) {
          continue
        }
        manualMap.set(row.locale, row.name || "")
      }

      const generated = await buildCategoryTranslations({
        name: (name !== undefined ? name : currentCategory.name) || category.name,
        slug: nextSlug || category.slug || currentCategory.slug,
        existing: existingMap,
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
    return NextResponse.json({ category })
  } catch (error) {
    console.error("Admin category update error:", error)
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAdmin(req)
  if (authError) return authError

  try {
    const { id } = await params

    // Delete protection: never cascade-delete products.
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: { select: { products: true, children: true } },
      },
    })

    if (!category) return NextResponse.json({ error: "Category not found" }, { status: 404 })

    if (category._count.products > 0) {
      return NextResponse.json(
        {
          error:
            "This category still contains products. Move products to another category first, or confirm a cascade operation.",
          code: "CATEGORY_HAS_PRODUCTS",
          productCount: category._count.products,
        },
        { status: 409 }
      )
    }

    if (category._count.children > 0) {
      return NextResponse.json(
        {
          error:
            "This category has child categories. Delete or move the child categories first.",
          code: "CATEGORY_HAS_CHILDREN",
          childCount: category._count.children,
        },
        { status: 409 }
      )
    }

    await prisma.category.delete({ where: { id } })
    invalidateStorefront()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Admin category delete error:", error)
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 })
  }
}
