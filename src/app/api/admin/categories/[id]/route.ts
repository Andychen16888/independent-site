import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { requireAdmin } from "@/lib/auth/admin-guard"

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
    return NextResponse.json({ category })
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
    const { name, slug, description, image, parentId, type, sortOrder, isActive, isFeatured, seoTitle, seoDescription, seoKeywords } = body

    if (name !== undefined && !name.trim()) {
      return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 })
    }

    // Prevent setting parentId to itself or to a descendant (cycle guard)
    if (parentId === id) {
      return NextResponse.json({ error: "A category cannot be its own parent" }, { status: 400 })
    }

    const data: any = {
      ...(name !== undefined ? { name } : {}),
      ...(slug !== undefined && slug !== "" ? { slug } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(image !== undefined ? { image } : {}),
      ...(parentId !== undefined ? { parentId: parentId || null } : {}),
      ...(type !== undefined ? { type } : {}),
      ...(sortOrder !== undefined ? { sortOrder: parseInt(sortOrder, 10) } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
      ...(isFeatured !== undefined ? { isFeatured } : {}),
      ...(seoTitle !== undefined ? { seoTitle } : {}),
      ...(seoDescription !== undefined ? { seoDescription } : {}),
      ...(seoKeywords !== undefined ? { seoKeywords } : {}),
    }

    const category = await prisma.category.update({ where: { id }, data })
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
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Admin category delete error:", error)
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 })
  }
}