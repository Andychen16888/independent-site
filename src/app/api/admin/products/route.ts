import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { requireAdmin } from "@/lib/auth/admin-guard"

function generateSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
}

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
      unitPrice, originalPrice, costPrice, stock, status,
      sku, slug, brand, model, tags,
      isFeatured, isBestSeller, isNew, isHomeFeatured, sortOrder,
      images, categoryIds, parameters,
    } = body

    if (!name || !description || unitPrice === undefined) {
      return NextResponse.json({ error: "Name, description, and unitPrice are required" }, { status: 400 })
    }

    let slugValue = slug
    if (!slugValue) slugValue = generateSlug(name)
    const existingSlug = await prisma.product.findUnique({ where: { slug: slugValue } })
    if (existingSlug) slugValue = `${slugValue}-${Date.now().toString().slice(-4)}`

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
        unitPrice: parseFloat(unitPrice),
        originalPrice: originalPrice ? parseFloat(originalPrice) : null,
        costPrice: costPrice ? parseFloat(costPrice) : null,
        stock: stock !== undefined && stock !== "" ? parseInt(stock, 10) : 0,
        status: status || "ACTIVE",
        ...(isFeatured !== undefined ? { isFeatured } : {}),
        ...(isBestSeller !== undefined ? { isBestSeller } : {}),
        ...(isNew !== undefined ? { isNew } : {}),
        ...(isHomeFeatured !== undefined ? { isHomeFeatured } : {}),
        ...(sortOrder !== undefined && sortOrder !== "" ? { sortOrder: parseInt(sortOrder, 10) } : {}),
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

    return NextResponse.json({ product }, { status: 201 })
  } catch (error) {
    console.error("Admin product create error:", error)
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 })
  }
}