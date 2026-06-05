import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getToken } from "next-auth/jwt"
import { cookies } from "next/headers"

export async function GET() {
  try {
    const token = await getToken({ req: { cookies: await cookies() } as any })
    if (!token || token.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    })

    return NextResponse.json({ categories })
  } catch (error) {
    console.error("Admin categories fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 })
  }
}
