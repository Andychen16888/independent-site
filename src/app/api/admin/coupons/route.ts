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
    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json({ coupons })
  } catch (error) {
    console.error("Admin coupons list error:", error)
    return NextResponse.json({ error: "Failed to fetch coupons" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const authError = await checkAdmin(req)
  if (authError) return authError

  try {
    const body = await req.json()
    const { code, type, discountType, discountValue, minOrderAmount, maxDiscount, maxUses, maxUsesPerUser, isActive, startsAt, expiresAt } = body

    if (!code || discountValue === undefined) {
      return NextResponse.json({ error: "Code and discount value are required" }, { status: 400 })
    }

    const existing = await prisma.coupon.findUnique({ where: { code } })
    if (existing) {
      return NextResponse.json({ error: "A coupon with this code already exists" }, { status: 409 })
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase(),
        type: type || "PUBLIC",
        discountType: discountType || "PERCENTAGE",
        discountValue: parseFloat(discountValue),
        minOrderAmount: minOrderAmount ? parseFloat(minOrderAmount) : null,
        maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
        maxUses: maxUses ? parseInt(maxUses, 10) : null,
        maxUsesPerUser: maxUsesPerUser ? parseInt(maxUsesPerUser, 10) : null,
        isActive: isActive !== undefined ? isActive : true,
        startsAt: startsAt ? new Date(startsAt) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    })

    return NextResponse.json({ coupon }, { status: 201 })
  } catch (error) {
    console.error("Admin coupon create error:", error)
    return NextResponse.json({ error: "Failed to create coupon" }, { status: 500 })
  }
}
