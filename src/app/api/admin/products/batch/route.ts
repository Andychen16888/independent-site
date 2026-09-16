import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { requireAdmin } from "@/lib/auth/admin-guard"

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
      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }

    return NextResponse.json({ success: true, count: ids.length })
  } catch (error) {
    console.error("Admin product batch error:", error)
    return NextResponse.json({ error: "Failed to run batch operation" }, { status: 500 })
  }
}