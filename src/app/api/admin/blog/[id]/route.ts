import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { requireAdmin } from "@/lib/auth/admin-guard"
import { upsertBlogPostTranslations } from "@/lib/i18n/content"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAdmin(req)
  if (authError) return authError

  const { id } = await params
  const post = await prisma.blogPost.findUnique({ where: { id }, include: { translations: true } })
  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 })
  return NextResponse.json({ post })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAdmin(req)
  if (authError) return authError

  try {
    const { id } = await params
    const body = await req.json()
    const { title, slug, excerpt, content, coverImage, author, tags, isPublished, seoTitle, seoDescription, seoKeywords, translations } = body

    const existing = await prisma.blogPost.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: "Post not found" }, { status: 404 })

    const data: any = {
      ...(title !== undefined ? { title } : {}),
      ...(slug !== undefined && slug !== "" ? { slug } : {}),
      ...(excerpt !== undefined ? { excerpt } : {}),
      ...(content !== undefined ? { content } : {}),
      ...(coverImage !== undefined ? { coverImage } : {}),
      ...(author !== undefined ? { author } : {}),
      ...(tags !== undefined ? { tags } : {}),
      ...(isPublished !== undefined ? { isPublished } : {}),
      ...(seoTitle !== undefined ? { seoTitle } : {}),
      ...(seoDescription !== undefined ? { seoDescription } : {}),
      ...(seoKeywords !== undefined ? { seoKeywords } : {}),
    }

    if (isPublished !== undefined) {
      data.publishedAt = isPublished
        ? existing.publishedAt || new Date()
        : existing.publishedAt
    }

    const post = await prisma.blogPost.update({ where: { id }, data })

    if (Array.isArray(translations)) {
      await upsertBlogPostTranslations(id, translations)
    }

    return NextResponse.json({ post })
  } catch (error) {
    console.error("Admin blog update error:", error)
    return NextResponse.json({ error: "Failed to update post" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAdmin(req)
  if (authError) return authError

  try {
    const { id } = await params
    await prisma.blogPost.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Admin blog delete error:", error)
    return NextResponse.json({ error: "Failed to delete post" }, { status: 500 })
  }
}