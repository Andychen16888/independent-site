import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"

export async function POST(req: Request) {
  try {
    const { code, subtotal } = await req.json()

    const coupon = await prisma.coupon.findUnique({ where: { code } })
    if (!coupon) {
      return NextResponse.json({ valid: false, error: "Invalid coupon code" })
    }

    if (!coupon.isActive) {
      return NextResponse.json({ valid: false, error: "Coupon is no longer active" })
    }

    if (coupon.expiresAt && new Date() > coupon.expiresAt) {
      return NextResponse.json({ valid: false, error: "Coupon has expired" })
    }

    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      return NextResponse.json({ valid: false, error: "Coupon usage limit reached" })
    }

    if (coupon.minOrderAmount && subtotal < Number(coupon.minOrderAmount)) {
      return NextResponse.json({
        valid: false,
        error: `Minimum order amount of $${coupon.minOrderAmount} required`,
      })
    }

    let discount = 0
    if (coupon.discountType === "PERCENTAGE") {
      discount = (subtotal * Number(coupon.discountValue)) / 100
      if (coupon.maxDiscount) {
        discount = Math.min(discount, Number(coupon.maxDiscount))
      }
    } else if (coupon.discountType === "FIXED_AMOUNT") {
      discount = Math.min(Number(coupon.discountValue), subtotal)
    }
    discount = Math.max(0, discount)

    return NextResponse.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: Number(coupon.discountValue),
        discount,
      },
    })
  } catch (error) {
    console.error("Coupon validation error:", error)
    return NextResponse.json({ error: "Failed to validate coupon" }, { status: 500 })
  }
}
