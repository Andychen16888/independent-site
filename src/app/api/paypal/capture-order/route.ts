import { NextResponse } from "next/server"
import { capturePayPalOrder } from "@/lib/paypal/paypal"

export async function POST(req: Request) {
  try {
    const { orderId } = await req.json()

    const capture = await capturePayPalOrder(orderId)

    if (capture.error) {
      console.error("PayPal capture error:", capture.error)
      return NextResponse.json({ error: "Failed to capture PayPal payment" }, { status: 500 })
    }

    return NextResponse.json({
      id: capture.id,
      status: capture.status,
      captureId: capture.purchase_units?.[0]?.payments?.captures?.[0]?.id,
    })
  } catch (error) {
    console.error("PayPal capture error:", error)
    return NextResponse.json({ error: "Failed to capture PayPal payment" }, { status: 500 })
  }
}
