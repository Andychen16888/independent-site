import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { requireAdmin } from "@/lib/auth/admin-guard"
import { invalidateStorefront } from "@/lib/settings/invalidate-storefront"
import { upsertProductTranslations } from "@/lib/i18n/product"
import { autoTranslateProduct, isAutoTranslateConfigured } from "@/lib/ai/translate-product"
import { buildProductSlug, ensureUniqueProductSlug } from "@/lib/products/slug"

export const runtime = "nodejs"
export const maxDuration = 300

export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req)
  if (authError) return authError

  try {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get("q")?.trim()
    const categoryId = searchParams.get("categoryId")?.trim()
    const status = searchParams.get("status")?.trim()
    const featured = searchParams.get("isFeatured")
    const homeFeatured = searchParams.get("isHomeFeatured")
    const includeDeleted = searchParams.get("includeDeleted") === "true"
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)))
    const sort = searchParams.get("sort") || "newest"

    const where: any = {}

    if (!includeDeleted) {
      where.deletedAt = null
    }

    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { sku: { contains: q, mode: "insensitive" } },
        { brand: { contains: q, mode: "insensitive" } },
        { model: { contains: q, mode: "insensitive" } },
        { tags: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ]
    }

    if (categoryId) {
      where.categories = { some: { categoryId } }
    }

    if (status) {
      where.status = status
    }

    if (featured === "true") where.isFeatured = true
    if (homeFeatured === "true") where.isHomeFeatured = true

    const orderBy: any =
      sort === "oldest"
        ? { createdAt: "asc" }
        : sort === "price-asc"
        ? { unitPrice: "asc" }
        : sort === "price-desc"
        ? { unitPrice: "desc" }
        : sort === "stock"
        ? { stock: "asc" }
        : sort === "updated"
        ? { updatedAt: "desc" }
        : { createdAt: "desc" }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          categories: { include: { category: true }, orderBy: { sortOrder: "asc" } },
          _count: { select: { orderItems: true } },
        },
      }),
      prisma.product.count({ where }),
    ])

    return NextResponse.json({
      products,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error("Admin products fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const authError = await requireAdmin(req)
  if (authError) return authError

  try {
    const body = await req.json()
    const {
      name, description, shortDescription,
      unitPrice, originalPrice, costPrice, stock, status, weight,
      sku, slug, brand, model, tags,
      isFeatured, isBestSeller, isNew, isHomeFeatured, sortOrder,
      seoTitle, seoDescription, seoKeywords,
      images, categoryIds, parameters, translations,
      autoTranslate, overwriteTranslations,
    } = body

    if (!name || !description) {
      return NextResponse.json({ error: "Name and description are required" }, { status: 400 })
    }

    const parseOptionalDecimal = (value: unknown): number | null => {
      if (value === undefined || value === null || value === "") return null
      const parsed = parseFloat(String(value))
      return Number.isFinite(parsed) ? parsed : null
    }

    const parseOptionalText = (value: unknown): string | null => {
      if (value === undefined || value === null) return null
      const text = String(value).trim()
      return text === "" ? null : text
    }

    // The slug field is free text, so never trust it verbatim: a stored slug with
    // spaces or capitals produces URLs that 404 and pollutes the sitemap.
    const slugValue = await ensureUniqueProductSlug(buildProductSlug(slug, name))

    let skuValue = sku
    if (!skuValue) skuValue = `SKU-${Date.now()}`

    const product = await prisma.product.create({
      data: {
        name,
        slug: slugValue,
        sku: skuValue,
        description,
        ...(brand !== undefined && brand !== null ? { brand } : {}),
        ...(model !== undefined && model !== null ? { model } : {}),
        ...(tags !== undefined && tags !== null ? { tags } : {}),
        ...(shortDescription !== undefined ? { shortDescription } : {}),
        unitPrice: parseOptionalDecimal(unitPrice),
        originalPrice: parseOptionalDecimal(originalPrice),
        costPrice: parseOptionalDecimal(costPrice),
        weight: parseOptionalDecimal(weight),
        stock: stock !== undefined && stock !== "" ? parseInt(stock, 10) : 0,
        status: status || "ACTIVE",
        ...(isFeatured !== undefined ? { isFeatured } : {}),
        ...(isBestSeller !== undefined ? { isBestSeller } : {}),
        ...(isNew !== undefined ? { isNew } : {}),
        ...(isHomeFeatured !== undefined ? { isHomeFeatured } : {}),
        ...(sortOrder !== undefined && sortOrder !== "" ? { sortOrder: parseInt(sortOrder, 10) } : {}),
        seoTitle: parseOptionalText(seoTitle),
        seoDescription: parseOptionalText(seoDescription),
        seoKeywords: parseOptionalText(seoKeywords),
        ...(images && images.length > 0 && {
          images: {
            create: images.map((img: any, i: number) => ({
              url: img.url,
              alt: img.alt || "",
              sortOrder: i,
              isPrimary: i === 0,
            })),
          },
        }),
        ...(categoryIds && categoryIds.length > 0 && {
          categories: {
            create: categoryIds.map((categoryId: string) => ({
              categoryId,
            })),
          },
        }),
        ...(parameters && parameters.length > 0 && {
          parameters: {
            create: parameters.map((p: any, i: number) => ({
              name: p.name,
              value: p.value,
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
      await upsertProductTranslations(product.id, translations)
    }

    let translation = null
    let translationError: string | null = null
    if (autoTranslate !== false) {
      if (isAutoTranslateConfigured()) {
        try {
          translation = await autoTranslateProduct(
            product.id,
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
          console.error("Auto-translate (create) failed:", err)
        }
      } else {
        translationError = "OPENAI_API_KEY is not configured"
      }
    }

    const savedTranslations = await prisma.productTranslation.findMany({
      where: { productId: product.id },
      orderBy: { locale: "asc" },
    })

    invalidateStorefront()
    return NextResponse.json(
      { product, translations: savedTranslations, translation, translationError },
      { status: 201 }
    )
  } catch (error) {
    console.error("Admin product create error:", error)
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 })
  }
}