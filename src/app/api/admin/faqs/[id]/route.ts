import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { requireAdmin } from "@/lib/auth/admin-guard"
import { invalidateStorefront } from "@/lib/settings/invalidate-storefront"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAdmin(req)
  if (authError) return authError

  const { id } = await params
  const faq = await prisma.siteFaq.findUnique({ where: { id }, include: { translations: true } })
  if (!faq) return NextResponse.json({ error: "FAQ not found" }, { status: 404 })
  return NextResponse.json({ faq })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAdmin(req)
  if (authError) return authError

  try {
    const { id } = await params
    const body = await req.json()
    const { sortOrder, isActive, translations } = body

    const existing = await prisma.siteFaq.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: "FAQ not found" }, { status: 404 })

    const data: any = {
      ...(sortOrder !== undefined ? { sortOrder } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
    }

    await prisma.siteFaq.update({ where: { id }, data })

    if (Array.isArray(translations)) {
      const receivedLocales = new Set(translations.map((t) => t?.locale).filter(Boolean))
      const existingTranslations = await prisma.siteFaqTranslation.findMany({ where: { siteFaqId: id } })
      for (const row of existingTranslations) {
        if (!receivedLocales.has(row.locale)) {
          await prisma.siteFaqTranslation.delete({ where: { id: row.id } })
        }
      }

      for (const t of translations) {
        if (!t?.locale) continue
        await prisma.siteFaqTranslation.upsert({
          where: { siteFaqId_locale: { siteFaqId: id, locale: t.locale } },
          update: {
            question: t.question ?? "",
            answer: t.answer ?? "",
          },
          create: {
            siteFaqId: id,
            locale: t.locale,
            question: t.question || "",
            answer: t.answer || "",
          },
        })
      }
    }

    const updated = await prisma.siteFaq.findUnique({ where: { id }, include: { translations: true } })
    invalidateStorefront()
    return NextResponse.json({ faq: updated })
  } catch (error) {
    console.error("Admin faqs update error:", error)
    return NextResponse.json({ error: "Failed to update FAQ" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAdmin(req)
  if (authError) return authError

  try {
    const { id } = await params
    await prisma.siteFaq.delete({ where: { id } })
    invalidateStorefront()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Admin faqs delete error:", error)
    return NextResponse.json({ error: "Failed to delete FAQ" }, { status: 500 })
  }
}