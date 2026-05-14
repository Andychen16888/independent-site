import { NextResponse } from "next/server"
import { createPayPalOrder } from "@/lib/paypal/paypal"

export async function POST(req: Request) {
  try {
    const { amount, currency } = await req.json()

    const order = await createPayPalOrder(amount, currency || "USD")

    if (order.error) {
      console.error("PayPal create order error:", order.error)
      return NextResponse.json({ error: "Failed to create PayPal order" }, { status: 500 })
    }

    return NextResponse.json({
      id: order.id,
      status: order.status,
    })
  } catch (error) {
    console.error("PayPal create order error:", error)
    return NextResponse.json({ error: "Failed to create PayPal order" }, { status: 500 })
  }
}
