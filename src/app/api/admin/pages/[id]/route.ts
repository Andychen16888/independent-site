import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { requireAdmin } from "@/lib/auth/admin-guard"
import { upsertPageTranslations } from "@/lib/i18n/content"

/**
 * Looks up a page by its id first, then by slug.
 * Slug fallback lets stale cached 308 redirects (e.g. /admin/pages/about) open the editor
 * instead of showing "Page not found" after a previously cached /:locale/{slug} redirect rule.
 */
async function resolvePage(idOrSlug: string) {
  const byId = await prisma.page.findUnique({ where: { id: idOrSlug }, include: { translations: true } })
  if (byId) return byId
  return prisma.page.findUnique({ where: { slug: idOrSlug }, include: { translations: true } })
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAdmin(req)
  if (authError) return authError

  const { id } = await params
  const page = await resolvePage(id)
  if (!page) return NextResponse.json({ error: "Page not found" }, { status: 404 })
  return NextResponse.json({ page })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAdmin(req)
  if (authError) return authError

  try {
    const { id } = await params
    const body = await req.json()
    const { title, slug, excerpt, content, coverImage, isPublished, seoTitle, seoDescription, seoKeywords, translations } = body

    const page = await resolvePage(id)
    if (!page) return NextResponse.json({ error: "Page not found" }, { status: 404 })

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

    const updated = await prisma.page.update({ where: { id: page.id }, data })

    if (Array.isArray(translations)) {
      await upsertPageTranslations(page.id, translations)
    }

    return NextResponse.json({ page: updated })
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
    const page = await resolvePage(id)
    if (!page) return NextResponse.json({ error: "Page not found" }, { status: 404 })
    await prisma.page.delete({ where: { id: page.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Admin page delete error:", error)
    return NextResponse.json({ error: "Failed to delete page" }, { status: 500 })
  }
}