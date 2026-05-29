import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getServerAuthSession } from "@/lib/auth/get-server-session"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerAuthSession()
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { name, description, unitPrice, originalPrice, stock, status, sku, slug } = body

    if (!name || !description || unitPrice === undefined) {
      return NextResponse.json({ error: "Name, description, and unitPrice are required" }, { status: 400 })
    }

    const product = await prisma.product.create({
      data: {
        name,
        slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
        sku: sku || `SKU-${Date.now()}`,
        description,
        unitPrice: parseFloat(unitPrice),
        originalPrice: originalPrice ? parseFloat(originalPrice) : null,
        stock: stock ? parseInt(stock, 10) : 0,
        status: status || "ACTIVE",
      },
    })

    return NextResponse.json({ product }, { status: 201 })
  } catch (error) {
    console.error("Admin product create error:", error)
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 })
  }
}
