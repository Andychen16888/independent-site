import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { requireAdmin } from "@/lib/auth/admin-guard"
import { autoTranslateProduct, isAutoTranslateConfigured } from "@/lib/ai/translate-product"

export const runtime = "nodejs"
export const maxDuration = 300

/**
 * Translate a single product into every language immediately.
 * Useful for products that existed before auto-translate on save was added.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAdmin(req)
  if (authError) return authError

  try {
    const { id } = await params
    const body = await req.json().catch(() => ({}))
    const overwrite = body.overwrite === true

    const product = await prisma.product.findUnique({ where: { id } })
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 })

    if (!isAutoTranslateConfigured()) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not configured on the server" },
        { status: 400 }
      )
    }

    const translation = await autoTranslateProduct(
      id,
      {
        name: product.name,
        shortDescription: product.shortDescription,
        description: product.description,
        seoTitle: product.seoTitle,
        seoDescription: product.seoDescription,
      },
      { overwrite }
    )

    const translations = await prisma.productTranslation.findMany({
      where: { productId: id },
      orderBy: { locale: "asc" },
    })

    return NextResponse.json({ product, translation, translations })
  } catch (error) {
    console.error("Admin product translate error:", error)
    return NextResponse.json({ error: (error as Error).message || "Failed to translate product" }, { status: 500 })
  }
}