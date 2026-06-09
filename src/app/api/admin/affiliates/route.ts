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
    const affiliates = await prisma.affiliate.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        _count: { select: { referrals: true } },
      },
    })
    return NextResponse.json({ affiliates })
  } catch (error) {
    console.error("Admin affiliates list error:", error)
    return NextResponse.json({ error: "Failed to fetch affiliates" }, { status: 500 })
  }
}
