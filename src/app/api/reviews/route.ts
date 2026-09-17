import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getServerAuthSession } from "@/lib/auth/get-server-session"

export async function POST(req: Request) {
  try {
    const session = await getServerAuthSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { productId, orderId, rating, title, content } = await req.json()

    if (!productId) {
      return NextResponse.json({ error: "Product is required" }, { status: 400 })
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be an integer between 1 and 5" }, { status: 400 })
    }

    const productExists = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    })
    if (!productExists) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    const userId = (session.user as any).id

    let isVerified = false
    if (orderId) {
      const order = await prisma.order.findFirst({
        where: { id: orderId, userId },
        include: { items: { where: { productId }, take: 1 } },
      })
      isVerified = !!order?.items.length
    }

    const review = await prisma.review.create({
      data: {
        productId,
        orderId,
        userId,
        rating,
        title,
        content,
        isVerified,
      },
    })

    return NextResponse.json(review)
  } catch (error) {
    console.error("Review creation error:", error)
    return NextResponse.json({ error: "Failed to create review" }, { status: 500 })
  }
}
