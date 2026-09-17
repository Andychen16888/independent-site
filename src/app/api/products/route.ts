import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get("category")
    const sort = searchParams.get("sort")
    const q = searchParams.get("q")
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10) || 20))

    const where: any = { status: "ACTIVE" }

    if (category) {
      where.categories = { some: { category: { slug: category } } }
    }

    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ]
    }

    const orderBy: any = {}
    if (sort === "price-asc") orderBy.unitPrice = "asc"
    else if (sort === "price-desc") orderBy.unitPrice = "desc"
    else if (sort === "newest") orderBy.createdAt = "desc"
    else if (sort === "bestseller") orderBy.isBestSeller = "desc"
    else orderBy.createdAt = "desc"

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          categories: { include: { category: true } },
        },
      }),
      prisma.product.count({ where }),
    ])

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Products fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 })
  }
}
