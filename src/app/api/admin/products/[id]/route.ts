import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { requireAdmin } from "@/lib/auth/admin-guard"

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
      unitPrice, originalPrice, costPrice, stock, status,
      isFeatured, isBestSeller, isNew, isHomeFeatured, sortOrder,
      seoTitle, seoDescription, seoKeywords,
      images, categoryIds, parameters,
    } = body

    const parseOptionalPrice = (value: unknown): number | null => {
      if (value === undefined || value === null || value === "") return null
      const parsed = parseFloat(String(value))
      return Number.isFinite(parsed) ? parsed : null
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(name !== undefined && name !== "" && { name }),
        ...(slug !== undefined && slug !== "" && { slug }),
        ...(sku !== undefined && sku !== "" && { sku }),
        ...(brand !== undefined && { brand: brand || null }),
        ...(model !== undefined && { model: model || null }),
        ...(tags !== undefined && { tags: tags || null }),
        ...(description !== undefined && { description }),
        ...(shortDescription !== undefined && { shortDescription }),
        ...(unitPrice !== undefined && { unitPrice: parseOptionalPrice(unitPrice) }),
        ...(originalPrice !== undefined && { originalPrice: parseOptionalPrice(originalPrice) }),
        ...(costPrice !== undefined && { costPrice: parseOptionalPrice(costPrice) }),
        ...(stock !== undefined && { stock: parseInt(stock, 10) }),
        ...(status !== undefined && { status }),
        ...(isFeatured !== undefined && { isFeatured }),
        ...(isBestSeller !== undefined && { isBestSeller }),
        ...(isNew !== undefined && { isNew }),
        ...(isHomeFeatured !== undefined && { isHomeFeatured }),
        ...(sortOrder !== undefined && sortOrder !== "" && { sortOrder: parseInt(sortOrder, 10) }),
        ...(seoTitle !== undefined ? { seoTitle } : {}),
        ...(seoDescription !== undefined ? { seoDescription } : {}),
        ...(seoKeywords !== undefined ? { seoKeywords } : {}),
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

    return NextResponse.json({ product })
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
      return NextResponse.json({ success: true, soft: false })
    }

    // Soft delete — order history, carts snapshot data, reviews remain intact.
    await prisma.product.update({
      where: { id },
      data: { deletedAt: new Date(), status: "ARCHIVED" },
    })

    return NextResponse.json({ success: true, soft: true })
  } catch (error) {
    console.error("Admin product delete error:", error)
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 })
  }
}