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
    const { title, subtitle, image, link, sortOrder, isActive } = body

    if (!title || !image) {
      return NextResponse.json({ error: "Title and image are required" }, { status: 400 })
    }

    const banner = await prisma.banner.create({
      data: {
        title,
        subtitle: subtitle || null,
        image,
        link: link || null,
        sortOrder: sortOrder ? parseInt(sortOrder, 10) : 0,
        isActive: isActive !== undefined ? isActive : true,
      },
    })

    return NextResponse.json({ banner }, { status: 201 })
  } catch (error) {
    console.error("Admin banner create error:", error)
    return NextResponse.json({ error: "Failed to create banner" }, { status: 500 })
  }
}
