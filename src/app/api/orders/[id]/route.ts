import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getServerAuthSession } from "@/lib/auth/get-server-session"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerAuthSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const order = await prisma.order.findFirst({
      where: {
        id,
        userId: (session.user as any).id,
      },
      include: {
        items: true,
        tracking: { orderBy: { timestamp: "asc" } },
        shippingAddress: true,
      },
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error("Order fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 })
  }
}
