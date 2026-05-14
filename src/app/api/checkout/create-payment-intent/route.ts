import { NextResponse } from "next/server"
import { createPaymentIntent } from "@/lib/stripe/create-payment-intent"

export async function POST(req: Request) {
  try {
    const { amount, currency } = await req.json()

    const paymentIntent = await createPaymentIntent(amount, currency || "usd")

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    })
  } catch (error) {
    console.error("Payment intent error:", error)
    return NextResponse.json(
      { error: "Failed to create payment intent" },
      { status: 500 }
    )
  }
}
