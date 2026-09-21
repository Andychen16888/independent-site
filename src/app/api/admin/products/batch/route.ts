import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { requireAdmin } from "@/lib/auth/admin-guard"
import { autoTranslateProduct, isAutoTranslateConfigured } from "@/lib/ai/translate-product"

export const runtime = "nodejs"
export const maxDuration = 300

export async function POST(req: NextRequest) {
  const authError = await requireAdmin(req)
  if (authError) return authError

  try {
    const body = await req.json()
    const { ids, action } = body

    if (!Array.isArray(ids) || ids.length === 0 || !action) {
      return NextResponse.json({ error: "ids[] and action are required" }, { status: 400 })
    }

    const now = new Date()

    switch (action) {
      case "delete": {
        await prisma.product.updateMany({
          where: { id: { in: ids } },
          data: { deletedAt: now, status: "ARCHIVED" },
        })
        break
      }
      case "restore": {
        await prisma.product.updateMany({
          where: { id: { in: ids } },
          data: { deletedAt: null, status: "ACTIVE" },
        })
        break
      }
      case "activate": {
        await prisma.product.updateMany({
          where: { id: { in: ids } },
          data: { status: "ACTIVE" },
        })
        break
      }
      case "deactivate": {
        await prisma.product.updateMany({
          where: { id: { in: ids } },
          data: { status: "INACTIVE" },
        })
        break
      }
      case "feature": {
        await prisma.product.updateMany({ where: { id: { in: ids } }, data: { isFeatured: true } })
        break
      }
      case "unfeature": {
        await prisma.product.updateMany({ where: { id: { in: ids } }, data: { isFeatured: false } })
        break
      }
      case "translate": {
        if (!isAutoTranslateConfigured()) {
          return NextResponse.json(
            { error: "OPENAI_API_KEY is not configured on the server" },
            { status: 400 }
          )
        }
        const targetProducts = await prisma.product.findMany({
          where: { id: { in: ids } },
          select: { id: true, name: true, shortDescription: true, description: true, seoTitle: true, seoDescription: true },
        })
        let translatedCount = 0
        let failedCount = 0
        for (const p of targetProducts) {
          if (!p.name || !p.description) continue
          try {
            const result = await autoTranslateProduct(
              p.id,
              { name: p.name, shortDescription: p.shortDescription, description: p.description, seoTitle: p.seoTitle, seoDescription: p.seoDescription },
              { overwrite: false }
            )
            translatedCount += result.translated.length
            failedCount += result.failed.length
          } catch (err) {
            failedCount += 1
            console.error(`Batch translate failed for ${p.id}:`, err)
          }
        }
        return NextResponse.json({ success: true, count: ids.length, translatedCount, failedCount })
      }
      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }

    return NextResponse.json({ success: true, count: ids.length })
  } catch (error) {
    console.error("Admin product batch error:", error)
    return NextResponse.json({ error: "Failed to run batch operation" }, { status: 500 })
  }
}