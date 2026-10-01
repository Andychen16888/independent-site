import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { requireAdmin } from "@/lib/auth/admin-guard"
import { invalidateStorefront } from "@/lib/settings/invalidate-storefront"
import { upsertProductTranslations } from "@/lib/i18n/product"
import { autoTranslateProduct, isAutoTranslateConfigured } from "@/lib/ai/translate-product"
import { buildProductSlug, ensureUniqueProductSlug } from "@/lib/products/slug"

export const runtime = "nodejs"
export const maxDuration = 300

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAdmin(req)
  if (authError) return authError

  try {
    const { id } = await params
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        parameters: { orderBy: { sortOrder: "asc" } },
        faqs: { orderBy: { sortOrder: "asc" } },
        videos: { orderBy: { sortOrder: "asc" } },
        categories: { include: { category: true } },
        translations: true,
      },
    })

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    return NextResponse.json({ product })
  } catch (error) {
    console.error("Admin product get error:", error)
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAdmin(req)
  if (authError) return authError

  try {
    const { id } = await params
    const body = await req.json()
    const {
      name, slug, sku, brand, model, tags,
      description, shortDescription,
      unitPrice, originalPrice, costPrice, weight, stock, status,
      isFeatured, isBestSeller, isNew, isHomeFeatured, sortOrder,
      seoTitle, seoDescription, seoKeywords,
      images, categoryIds, parameters, translations,
      autoTranslate, overwriteTranslations,
    } = body

    const parseOptionalDecimal = (value: unknown): number | null => {
      if (value === undefined || value === null || value === "") return null
      const parsed = parseFloat(String(value))
      return Number.isFinite(parsed) ? parsed : null
    }

    const parseOptionalText = (value: unknown): string | null => {
      if (value === null || value === undefined) return null
      const text = String(value).trim()
      return text === "" ? null : text
    }

    const current = await prisma.product.findUnique({ where: { id }, select: { id: true, slug: true, name: true } })
    if (!current) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    // Keep the stored slug URL-safe. An unchanged slug is left alone so the
    // public URL never churns; anything with spaces/capitals is rewritten.
    let slugValue: string | undefined
    if (slug !== undefined) {
      const requested = buildProductSlug(slug, name ?? current.name)
      slugValue = requested === current.slug ? current.slug : await ensureUniqueProductSlug(requested, id)
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(name !== undefined && name !== "" && { name }),
        ...(slugValue !== undefined && { slug: slugValue }),
        ...(sku !== undefined && sku !== "" && { sku }),
        ...(brand !== undefined && { brand: brand || null }),
        ...(model !== undefined && { model: model || null }),
        ...(tags !== undefined && { tags: tags || null }),
        ...(description !== undefined && { description }),
        ...(shortDescription !== undefined && { shortDescription }),
        ...(unitPrice !== undefined && { unitPrice: parseOptionalDecimal(unitPrice) }),
        ...(originalPrice !== undefined && { originalPrice: parseOptionalDecimal(originalPrice) }),
        ...(costPrice !== undefined && { costPrice: parseOptionalDecimal(costPrice) }),
        ...(weight !== undefined && { weight: parseOptionalDecimal(weight) }),
        ...(stock !== undefined && { stock: Number.isFinite(parseInt(String(stock), 10)) ? parseInt(String(stock), 10) : 0 }),
        ...(status !== undefined && { status }),
        ...(isFeatured !== undefined && { isFeatured }),
        ...(isBestSeller !== undefined && { isBestSeller }),
        ...(isNew !== undefined && { isNew }),
        ...(isHomeFeatured !== undefined && { isHomeFeatured }),
        ...(sortOrder !== undefined && sortOrder !== "" && { sortOrder: parseInt(sortOrder, 10) }),
        ...(seoTitle !== undefined && { seoTitle: parseOptionalText(seoTitle) }),
        ...(seoDescription !== undefined && { seoDescription: parseOptionalText(seoDescription) }),
        ...(seoKeywords !== undefined && { seoKeywords: parseOptionalText(seoKeywords) }),
        ...(images !== undefined && {
          images: {
            deleteMany: {},
            create: images.map((img: any, i: number) => ({
              url: img.url,
              alt: img.alt || "",
              sortOrder: i,
              isPrimary: i === 0,
            })),
          },
        }),
        ...(categoryIds !== undefined && {
          categories: {
            deleteMany: {},
            create: categoryIds.map((categoryId: string) => ({
              categoryId,
            })),
          },
        }),
        ...(parameters !== undefined && {
          parameters: {
            deleteMany: {},
            create: parameters.map((p: any, i: number) => ({
              name: p.name,
              value: String(p.value),
              sortOrder: i,
            })),
          },
        }),
      },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        parameters: { orderBy: { sortOrder: "asc" } },
        categories: { include: { category: true } },
      },
    })

    if (Array.isArray(translations)) {
      await upsertProductTranslations(id, translations)
    }

    let translation = null
    let translationError: string | null = null
    if (autoTranslate !== false) {
      if (isAutoTranslateConfigured()) {
        try {
          translation = await autoTranslateProduct(
            id,
            {
              name: product.name,
              shortDescription: product.shortDescription,
              description: product.description,
              seoTitle: product.seoTitle,
              seoDescription: product.seoDescription,
            },
            { overwrite: overwriteTranslations === true }
          )
        } catch (err) {
          translationError = (err as Error).message
          console.error("Auto-translate (update) failed:", err)
        }
      } else {
        translationError = "OPENAI_API_KEY is not configured"
      }
    }

    const savedTranslations = await prisma.productTranslation.findMany({
      where: { productId: id },
      orderBy: { locale: "asc" },
    })

    invalidateStorefront()
    return NextResponse.json({ product, translations: savedTranslations, translation, translationError })
  } catch (error) {
    console.error("Admin product update error:", error)
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAdmin(req)
  if (authError) return authError

  try {
    const { id } = await params
    const { searchParams } = new URL(req.url)
    const force = searchParams.get("force") === "true"

    const product = await prisma.product.findUnique({ where: { id } })
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 })

    if (force) {
      // Hard delete requested explicitly by the admin.
      await prisma.product.delete({ where: { id } })
      invalidateStorefront()
    return NextResponse.json({ success: true, soft: false })
    }

    // Soft delete — order history, carts snapshot data, reviews remain intact.
    await prisma.product.update({
      where: { id },
      data: { deletedAt: new Date(), status: "ARCHIVED" },
    })

    invalidateStorefront()
    return NextResponse.json({ success: true, soft: true })
  } catch (error) {
    console.error("Admin product delete error:", error)
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 })
  }
}