import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { generateOrderNumber } from "@/lib/utils/format"
import { getServerAuthSession } from "@/lib/auth/get-server-session"

const SHIPPING_THRESHOLD = 100
const FLAT_SHIPPING = 12

export async function POST(req: Request) {
  try {
    const session = await getServerAuthSession()
    const body = await req.json()

    const { items, shippingAddress, taxAmount, paymentMethod, paymentId } = body

    if (!Array.isArray(items) || items.length === 0 || !shippingAddress?.email) {
      return NextResponse.json({ error: "Missing checkout data" }, { status: 400 })
    }

    // Validate quantity is a positive integer before any database work.
    for (const item of items) {
      if (!item?.productId || !Number.isInteger(item.quantity) || item.quantity <= 0) {
        return NextResponse.json(
          { error: `Invalid quantity for ${item?.name || item?.productId || "item"}` },
          { status: 422 }
        )
      }
    }

    const orderNumber = generateOrderNumber()

    const userId = (session?.user as any)?.id || null

    // Recompute prices from the database (never trust the client total).
    const productIds = items.map((item: any) => item.productId)
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, unitPrice: true, stock: true, name: true },
    })
    const productMap = new Map(dbProducts.map((p) => [p.id, p]))

    let subtotal = 0
    const orderItems: {
      productId: string
      productName: string
      productSku: string
      unitPrice: number
      quantity: number
      totalPrice: number
      productImage: string
    }[] = []
    for (const item of items) {
      const db = productMap.get(item.productId)
      if (!db) {
        return NextResponse.json({ error: `Product not found: ${item.name || item.productId}` }, { status: 400 })
      }
      if (db.stock < item.quantity) {
        return NextResponse.json({ error: `Insufficient stock for ${db.name}` }, { status: 400 })
      }
      if (db.unitPrice == null) {
        return NextResponse.json(
          { error: `Price unavailable for ${db.name}. Please request a quote.` },
          { status: 400 }
        )
      }
      const price = Number(db.unitPrice)
      subtotal += price * item.quantity
      orderItems.push({
        productId: item.productId,
        productName: item.name || db.name,
        productSku: item.sku || "",
        unitPrice: price,
        quantity: item.quantity,
        totalPrice: price * item.quantity,
        productImage: item.image || "",
      })
    }

    // Recompute shipping server-side; only use client values for anything we
    // genuinely cannot derive (e.g. tax) and clamp them to sane bounds.
    const shipping = subtotal >= SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING
    const tax = Math.max(0, Number(taxAmount) || 0)
    const total = subtotal + shipping + tax

    const address = await prisma.address.create({
      data: {
        userId,
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

    const order = await prisma.$transaction(async (tx) => {
      // Atomically decrement stock, guarding against negative stock.
      for (const item of orderItems) {
        const update = await tx.product.updateMany({
          where: { id: item.productId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        })
        if (update.count === 0) {
          throw new Error(`Insufficient stock for ${item.productName}`)
        }
      }

      return tx.order.create({
        data: {
          orderNumber,
          userId,
          email: shippingAddress.email,
          status: "CONFIRMED",
          paymentStatus: "PAID",
          subtotal,
          shippingCost: shipping,
          taxAmount: tax,
          total,
          shippingAddressId: address.id,
          paidAt: new Date(),
          items: {
            create: orderItems,
          },
          payments: {
            create: {
              method: paymentMethod || "card",
              transactionId: paymentId || "",
              amount: total,
              currency: "USD",
              status: "PAID",
            },
          },
        },
        include: { items: true, payments: true },
      })
    })

    return NextResponse.json({ orderId: order.id, orderNumber: order.orderNumber })
  } catch (error: any) {
    if (error?.message?.startsWith("Insufficient stock")) {
      return NextResponse.json({ error: error.message }, { status: 409 })
    }
    console.error("Checkout error:", error)
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 })
  }
}
