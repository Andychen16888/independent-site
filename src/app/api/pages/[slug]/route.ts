import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"

export const dynamic = "force-dynamic"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  try {
    const page = await prisma.page.findUnique({
      where: { slug },
    })
    if (!page || !page.isPublished) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 })
    }
    return NextResponse.json({ page })
  } catch (error) {
    console.error("Page fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch page" }, { status: 500 })
  }
}