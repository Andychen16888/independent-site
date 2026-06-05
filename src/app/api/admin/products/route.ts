import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getToken } from "next-auth/jwt"
import { cookies } from "next/headers"

export async function POST(req: NextRequest) {
  try {
    let token = await getToken({ req, secureCookie: false })
    if (!token) {
      token = await getToken({ req, secureCookie: true })
    }
    if (!token || token.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { name, description, unitPrice, originalPrice, stock, status, sku, slug, images, categoryIds } = body

    if (!name || !description || unitPrice === undefined) {
      return NextResponse.json({ error: "Name, description, and unitPrice are required" }, { status: 400 })
    }

    const product = await prisma.product.create({
      data: {
        name,
        slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
        sku: sku || `SKU-${Date.now()}`,
        description,
        unitPrice: parseFloat(unitPrice),
        originalPrice: originalPrice ? parseFloat(originalPrice) : null,
        stock: stock ? parseInt(stock, 10) : 0,
        status: status || "ACTIVE",
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
      },
      include: {
        images: true,
        categories: { include: { category: true } },
      },
    })

    return NextResponse.json({ product }, { status: 201 })
  } catch (error) {
    console.error("Admin product create error:", error)
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 })
  }
}


