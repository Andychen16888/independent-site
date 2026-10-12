import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { requireAdmin } from "@/lib/auth/admin-guard"
import { invalidateStorefront } from "@/lib/settings/invalidate-storefront"
import { upsertBannerTranslations } from "@/lib/i18n/banner"

export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req)
  if (authError) return authError

  try {
    const banners = await prisma.banner.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    })
    return NextResponse.json({ banners })
  } catch (error) {
    console.error("Admin banners fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch banners" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const authError = await requireAdmin(req)
  if (authError) return authError

  try {
    const body = await req.json()
    const { title, subtitle, eyebrow, description, ctaText, alignment, image, link, sortOrder, isActive, translations } = body

    if (!title || !image) {
      return NextResponse.json({ error: "Title and image are required" }, { status: 400 })
    }

    const banner = await prisma.banner.create({
      data: {
        title,
        subtitle: subtitle || null,
        eyebrow: eyebrow || null,
        description: description || null,
        ctaText: ctaText || null,
        alignment: alignment || "left",
        image,
        link: link || null,
        sortOrder: sortOrder !== undefined && sortOrder !== "" ? parseInt(sortOrder, 10) : 0,
        isActive: isActive !== undefined ? isActive : true,
      },
    })

    if (Array.isArray(translations)) {
      await upsertBannerTranslations(banner.id, translations)
    }

    invalidateStorefront()
    return NextResponse.json({ banner }, { status: 201 })
  } catch (error) {
    console.error("Admin banner create error:", error)
    return NextResponse.json({ error: "Failed to create banner" }, { status: 500 })
  }
}
