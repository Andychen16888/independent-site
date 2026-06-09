import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getToken } from "next-auth/jwt"

async function checkAdmin(req: NextRequest) {
  let token = await getToken({ req, secureCookie: false })
  if (!token) {
    token = await getToken({ req, secureCookie: true })
  }
  if (!token || token.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  return null
}

export async function GET(req: NextRequest) {
  const authError = await checkAdmin(req)
  if (authError) return authError

  try {
    const subscribers = await prisma.newsletter.findMany({
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json({ subscribers })
  } catch (error) {
    console.error("Admin newsletter list error:", error)
    return NextResponse.json({ error: "Failed to fetch subscribers" }, { status: 500 })
  }
}
