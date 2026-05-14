import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { generateOrderNumber } from "@/lib/utils/format"
import { getServerAuthSession } from "@/lib/auth/get-server-session"

export async function POST(req: Request) {
  try {
    const session = await getServerAuthSession()
    const body = await req.json()

    const { items, shippingAddress, subtotal, shippingCost, taxAmount, total, paymentMethod, paymentId } = body

    const orderNumber = generateOrderNumber()

    const userId = (session?.user as any)?.id

    const address = await prisma.address.create({
      data: {
        userId: userId || "guest",
        firstName: shippingAddress.firstName,
        lastName: shippingAddress.lastName,
        street: shippingAddress.street,
        street2: shippingAddress.street2 || "",
        city: shippingAddress.city,
        state: shippingAddress.state,
        zipCode: shippingAddress.zipCode,
        country: shippingAddress.country || "US",
        phone: shippingAddress.phone || "",
      },
    })

    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId,
        email: shippingAddress.email,
        status: "CONFIRMED",
        paymentStatus: "PAID",
        subtotal,
        shippingCost,
        taxAmount,
        total,
        shippingAddressId: address.id,
        paidAt: new Date(),
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            productName: item.name,
            productSku: item.sku,
            unitPrice: item.price,
            quantity: item.quantity,
            totalPrice: item.price * item.quantity,
            productImage: item.image,
          })),
        },
        payments: {
          create: {
            method: paymentMethod || "card",
            transactionId: paymentId,
            amount: total,
            currency: "USD",
            status: "PAID",
          },
        },
      },
      include: { items: true, payments: true },
    })

    // Update stock
    for (const item of items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      })
    }

    return NextResponse.json({ orderId: order.id, orderNumber: order.orderNumber })
  } catch (error) {
    console.error("Checkout error:", error)
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 })
  }
}
