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

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await checkAdmin(req)
  if (authError) return authError

  try {
    const { id } = await params
    const coupon = await prisma.coupon.findUnique({ where: { id } })
    if (!coupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 })
    }
    return NextResponse.json({ coupon })
  } catch (error) {
    console.error("Admin coupon get error:", error)
    return NextResponse.json({ error: "Failed to fetch coupon" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await checkAdmin(req)
  if (authError) return authError

  try {
    const { id } = await params
    const body = await req.json()
    const { code, type, discountType, discountValue, minOrderAmount, maxDiscount, maxUses, maxUsesPerUser, isActive, startsAt, expiresAt } = body

    if (code) {
      const existing = await prisma.coupon.findUnique({ where: { code } })
      if (existing && existing.id !== id) {
        return NextResponse.json({ error: "A coupon with this code already exists" }, { status: 409 })
      }
    }

    const coupon = await prisma.coupon.update({
      where: { id },
      data: {
        ...(code !== undefined && { code: code.toUpperCase() }),
        ...(type !== undefined && { type }),
        ...(discountType !== undefined && { discountType }),
        ...(discountValue !== undefined && { discountValue: parseFloat(discountValue) }),
        ...(minOrderAmount !== undefined && { minOrderAmount: minOrderAmount ? parseFloat(minOrderAmount) : null }),
        ...(maxDiscount !== undefined && { maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null }),
        ...(maxUses !== undefined && { maxUses: maxUses ? parseInt(maxUses, 10) : null }),
        ...(maxUsesPerUser !== undefined && { maxUsesPerUser: maxUsesPerUser ? parseInt(maxUsesPerUser, 10) : null }),
        ...(isActive !== undefined && { isActive }),
        ...(startsAt !== undefined && { startsAt: startsAt ? new Date(startsAt) : null }),
        ...(expiresAt !== undefined && { expiresAt: expiresAt ? new Date(expiresAt) : null }),
      },
    })

    return NextResponse.json({ coupon })
  } catch (error) {
    console.error("Admin coupon update error:", error)
    return NextResponse.json({ error: "Failed to update coupon" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await checkAdmin(req)
  if (authError) return authError

  try {
    const { id } = await params
    await prisma.coupon.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Admin coupon delete error:", error)
    return NextResponse.json({ error: "Failed to delete coupon" }, { status: 500 })
  }
}
