import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const banners = await prisma.banner.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    })
    return NextResponse.json({ banners })
  } catch (error) {
    console.error("Banners fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch banners" }, { status: 500 })
  }
}