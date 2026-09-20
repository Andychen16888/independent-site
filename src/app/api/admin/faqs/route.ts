import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { requireAdmin } from "@/lib/auth/admin-guard"

export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req)
  if (authError) return authError

  try {
    const faqs = await prisma.siteFaq.findMany({
      orderBy: { sortOrder: "asc" },
      include: { translations: true },
    })
    return NextResponse.json({ faqs })
  } catch (error) {
    console.error("Admin faqs fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch FAQs" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const authError = await requireAdmin(req)
  if (authError) return authError

  try {
    const body = await req.json()
    const { sortOrder, isActive, translations } = body

    if (!Array.isArray(translations) || translations.length === 0) {
      return NextResponse.json({ error: "At least one translation is required" }, { status: 400 })
    }

    const faq = await prisma.siteFaq.create({
      data: {
        sortOrder: typeof sortOrder === "number" ? sortOrder : 0,
        isActive: isActive !== undefined ? isActive : true,
      },
    })

    for (const t of translations) {
      if (!t?.locale) continue
      await prisma.siteFaqTranslation.create({
        data: {
          siteFaqId: faq.id,
          locale: t.locale,
          question: t.question || "",
          answer: t.answer || "",
        },
      })
    }

    const created = await prisma.siteFaq.findUnique({
      where: { id: faq.id },
      include: { translations: true },
    })

    return NextResponse.json({ faq: created }, { status: 201 })
  } catch (error) {
    console.error("Admin faqs create error:", error)
    return NextResponse.json({ error: "Failed to create FAQ" }, { status: 500 })
  }
}