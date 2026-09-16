import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const menus = await prisma.menu.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    })
    return NextResponse.json({ menus })
  } catch (error) {
    console.error("Menus fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch menus" }, { status: 500 })
  }
}