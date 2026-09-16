import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { requireAdmin } from "@/lib/auth/admin-guard"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAdmin(req)
  if (authError) return authError

  const { id } = await params
  const page = await prisma.page.findUnique({ where: { id } })
  if (!page) return NextResponse.json({ error: "Page not found" }, { status: 404 })
  return NextResponse.json({ page })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAdmin(req)
  if (authError) return authError

  try {
    const { id } = await params
    const body = await req.json()
    const { title, slug, excerpt, content, coverImage, isPublished, seoTitle, seoDescription, seoKeywords } = body

    const data: any = {
      ...(title !== undefined ? { title } : {}),
      ...(slug !== undefined && slug !== "" ? { slug } : {}),
      ...(excerpt !== undefined ? { excerpt } : {}),
      ...(content !== undefined ? { content } : {}),
      ...(coverImage !== undefined ? { coverImage } : {}),
      ...(isPublished !== undefined ? { isPublished } : {}),
      ...(seoTitle !== undefined ? { seoTitle } : {}),
      ...(seoDescription !== undefined ? { seoDescription } : {}),
      ...(seoKeywords !== undefined ? { seoKeywords } : {}),
    }

    const page = await prisma.page.update({ where: { id }, data })
    return NextResponse.json({ page })
  } catch (error) {
    console.error("Admin page update error:", error)
    return NextResponse.json({ error: "Failed to update page" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAdmin(req)
  if (authError) return authError

  try {
    const { id } = await params
    await prisma.page.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Admin page delete error:", error)
    return NextResponse.json({ error: "Failed to delete page" }, { status: 500 })
  }
}