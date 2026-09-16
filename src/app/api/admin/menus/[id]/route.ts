import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { requireAdmin } from "@/lib/auth/admin-guard"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAdmin(req)
  if (authError) return authError

  const { id } = await params
  const menu = await prisma.menu.findUnique({
    where: { id },
    include: { children: { orderBy: { sortOrder: "asc" } } },
  })
  if (!menu) return NextResponse.json({ error: "Menu not found" }, { status: 404 })
  return NextResponse.json({ menu })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAdmin(req)
  if (authError) return authError

  try {
    const { id } = await params
    const body = await req.json()
    const { label, url, parentId, sortOrder, isActive } = body

    if (parentId === id) {
      return NextResponse.json({ error: "A menu item cannot be its own parent" }, { status: 400 })
    }

    const data: any = {
      ...(label !== undefined ? { label } : {}),
      ...(url !== undefined ? { url } : {}),
      ...(parentId !== undefined ? { parentId: parentId || null } : {}),
      ...(sortOrder !== undefined ? { sortOrder: parseInt(sortOrder, 10) } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
    }

    const menu = await prisma.menu.update({ where: { id }, data })
    return NextResponse.json({ menu })
  } catch (error) {
    console.error("Admin menu update error:", error)
    return NextResponse.json({ error: "Failed to update menu" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAdmin(req)
  if (authError) return authError

  try {
    const { id } = await params
    const menu = await prisma.menu.findUnique({ where: { id }, include: { _count: { select: { children: true } } } })
    if (!menu) return NextResponse.json({ error: "Menu not found" }, { status: 404 })
    if (menu._count.children > 0) {
      return NextResponse.json(
        { error: "This menu item has child items. Delete or re-parent them first.", code: "MENU_HAS_CHILDREN" },
        { status: 409 }
      )
    }
    await prisma.menu.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Admin menu delete error:", error)
    return NextResponse.json({ error: "Failed to delete menu" }, { status: 500 })
  }
}