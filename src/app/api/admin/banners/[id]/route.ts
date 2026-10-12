import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { requireAdmin } from "@/lib/auth/admin-guard"
import { invalidateStorefront } from "@/lib/settings/invalidate-storefront"
import { upsertBannerTranslations } from "@/lib/i18n/banner"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAdmin(req)
  if (authError) return authError

  const { id } = await params
  const banner = await prisma.banner.findUnique({ where: { id }, include: { translations: true } })
  if (!banner) return NextResponse.json({ error: "Banner not found" }, { status: 404 })
  return NextResponse.json({ banner })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAdmin(req)
  if (authError) return authError

  try {
    const { id } = await params
    const body = await req.json()
    const { title, subtitle, eyebrow, description, ctaText, alignment, image, link, sortOrder, isActive, translations } = body

    const banner = await prisma.banner.update({
      where: { id },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(subtitle !== undefined ? { subtitle } : {}),
        ...(eyebrow !== undefined ? { eyebrow } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(ctaText !== undefined ? { ctaText } : {}),
        ...(alignment !== undefined ? { alignment } : {}),
        ...(image !== undefined ? { image } : {}),
        ...(link !== undefined ? { link } : {}),
        ...(sortOrder !== undefined ? { sortOrder: parseInt(sortOrder, 10) } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
      },
    })

    if (Array.isArray(translations)) {
      await upsertBannerTranslations(banner.id, translations)
    }

    invalidateStorefront()
    return NextResponse.json({ banner })
  } catch (error) {
    console.error("Admin banner update error:", error)
    return NextResponse.json({ error: "Failed to update banner" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAdmin(req)
  if (authError) return authError

  try {
    const { id } = await params
    await prisma.banner.delete({ where: { id } })
    invalidateStorefront()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Admin banner delete error:", error)
    return NextResponse.json({ error: "Failed to delete banner" }, { status: 500 })
  }
}