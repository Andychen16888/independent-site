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

    const review = await prisma.review.create({
      data: {
        productId,
        orderId,
        userId: (session.user as any).id,
        rating,
        title,
        content,
        isVerified: !!orderId,
      },
    })

    return NextResponse.json(review)
  } catch (error) {
    console.error("Review creation error:", error)
    return NextResponse.json({ error: "Failed to create review" }, { status: 500 })
  }
}
