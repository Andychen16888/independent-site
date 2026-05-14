import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const product = await prisma.product.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        videos: { orderBy: { sortOrder: "asc" } },
        parameters: true,
        faqs: { orderBy: { sortOrder: "asc" } },
        reviews: {
          include: { user: { select: { firstName: true, lastName: true } }, images: true },
          orderBy: { createdAt: "desc" },
        },
        categories: { include: { category: true } },
      },
    })

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error("Product fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 })
  }
}
