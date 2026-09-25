import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { requireAdmin } from "@/lib/auth/admin-guard"
import { invalidateStorefront } from "@/lib/settings/invalidate-storefront"

export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req)
  if (authError) return authError

  try {
    const menus = await prisma.menu.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: { children: { orderBy: { sortOrder: "asc" } } },
    })
    return NextResponse.json({ menus })
  } catch (error) {
    console.error("Admin menus fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch menus" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const authError = await requireAdmin(req)
  if (authError) return authError

  try {
    const body = await req.json()
    const { label, url, parentId, sortOrder, isActive } = body

    if (!label || !url) {
      return NextResponse.json({ error: "Label and URL are required" }, { status: 400 })
    }

    const menu = await prisma.menu.create({
      data: {
        label,
        url,
        parentId: parentId || null,
        sortOrder: sortOrder !== undefined && sortOrder !== "" ? parseInt(sortOrder, 10) : 0,
        isActive: isActive !== undefined ? isActive : true,
      },
    })

    invalidateStorefront()
    return NextResponse.json({ menu }, { status: 201 })
  } catch (error) {
    console.error("Admin menu create error:", error)
    return NextResponse.json({ error: "Failed to create menu" }, { status: 500 })
  }
}