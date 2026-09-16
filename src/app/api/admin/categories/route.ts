import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { requireAdmin } from "@/lib/auth/admin-guard"

export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req)
  if (authError) return authError

  try {
    const categories = await prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: { _count: { select: { products: true, children: true } } },
    })

    return NextResponse.json({ categories })
  } catch (error) {
    console.error("Admin categories fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 })
  }
}

function generateSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
}

export async function POST(req: NextRequest) {
  const authError = await requireAdmin(req)
  if (authError) return authError

  try {
    const body = await req.json()
    const { name, slug, description, image, parentId, type, sortOrder, isActive, isFeatured, seoTitle, seoDescription, seoKeywords } = body

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    let slugValue = slug
    if (!slugValue) {
      slugValue = generateSlug(name)
    }

    const existingSlug = await prisma.category.findUnique({ where: { slug: slugValue } })
    if (existingSlug) {
      slugValue = `${slugValue}-${Date.now().toString().slice(-4)}`
    }

    const category = await prisma.category.create({
      data: {
        name,
        slug: slugValue,
        description: description || null,
        image: image || null,
        parentId: parentId || null,
        type: type || "GENERAL",
        sortOrder: sortOrder !== undefined && sortOrder !== "" ? parseInt(sortOrder, 10) : 0,
        isActive: isActive !== undefined ? isActive : true,
        isFeatured: isFeatured !== undefined ? isFeatured : false,
        seoTitle: seoTitle || null,
        seoDescription: seoDescription || null,
        seoKeywords: seoKeywords || null,
      },
    })

    return NextResponse.json({ category }, { status: 201 })
  } catch (error) {
    console.error("Admin category create error:", error)
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 })
  }
}