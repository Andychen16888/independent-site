import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getToken } from "next-auth/jwt"

async function checkAdmin(req: NextRequest) {
  let token = await getToken({ req, secureCookie: false })
  if (!token) {
    token = await getToken({ req, secureCookie: true })
  }
  if (!token || token.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  return null
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await checkAdmin(req)
  if (authError) return authError

  try {
    const { id } = await params
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
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
  const authError = await checkAdmin(req)
  if (authError) return authError

  try {
    const { id } = await params
    const body = await req.json()
    const { name, slug, sku, brand, description, shortDescription, unitPrice, originalPrice, stock, status, isFeatured, isBestSeller, isNew } = body

    const { images, categoryIds } = body

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(slug !== undefined && { slug }),
        ...(sku !== undefined && { sku }),
        ...(brand !== undefined && { brand }),
        ...(description !== undefined && { description }),
        ...(shortDescription !== undefined && { shortDescription }),
        ...(unitPrice !== undefined && { unitPrice: parseFloat(unitPrice) }),
        ...(originalPrice !== undefined && { originalPrice: originalPrice ? parseFloat(originalPrice) : null }),
        ...(stock !== undefined && { stock: parseInt(stock, 10) }),
        ...(status !== undefined && { status }),
        ...(isFeatured !== undefined && { isFeatured }),
        ...(isBestSeller !== undefined && { isBestSeller }),
        ...(isNew !== undefined && { isNew }),
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
      },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
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
  const authError = await checkAdmin(req)
  if (authError) return authError

  try {
    const { id } = await params
    await prisma.product.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Admin product delete error:", error)
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 })
  }
}
