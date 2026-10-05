import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { requireAdmin } from "@/lib/auth/admin-guard"
import { invalidateStorefront } from "@/lib/settings/invalidate-storefront"
import { upsertCategoryTranslations } from "@/lib/i18n/category"
import { routing } from "@/i18n/routing"
import { canonicalCategorySlug } from "@/lib/categories/slug"
import { ensureUniqueCategorySlug } from "@/lib/categories/unique-slug"

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
    const translationRows = await prisma.categoryTranslation.findMany({
      where: { categoryId: id },
      orderBy: { locale: "asc" },
      select: { locale: true, name: true },
    })
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
    const { name, slug, description, image, parentId, sortOrder, isActive, isFeatured, seoTitle, seoDescription, seoKeywords, translations } = body

    if (name !== undefined && !name.trim()) {
      return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 })
    }

    // Prevent setting parentId to itself or to a descendant (cycle guard)
    if (parentId === id) {
      return NextResponse.json({ error: "A category cannot be its own parent" }, { status: 400 })
    }

    let nextSlug: string | undefined
    if (slug !== undefined && slug !== "") {
      // Stored slugs must stay URL-safe: "LED Lighting" becomes "led-lighting" so
      // the category keeps one canonical URL.
      const desired = canonicalCategorySlug(slug, name ?? "")
      const current = await prisma.category.findUnique({ where: { id }, select: { slug: true } })
      if (!current || current.slug !== desired) {
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
    await upsertCategoryTranslations(category.id, parseCategoryTranslations(translations))
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
