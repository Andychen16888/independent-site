import { NextResponse } from "next/server"
import { createPaymentIntent } from "@/lib/stripe/create-payment-intent"
import { isStripeConfigured } from "@/lib/stripe/stripe"

export async function POST(req: Request) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: "Stripe is not configured" },
        { status: 503 }
      )
    }

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
