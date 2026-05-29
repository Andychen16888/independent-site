import { NextResponse } from "next/server"
import { getStripe, isStripeConfigured } from "@/lib/stripe/stripe"
import { prisma } from "@/lib/db/prisma"

export async function POST(req: Request) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: "Stripe is not configured" },
        { status: 503 }
      )
    }

    const body = await req.text()
    const signature = req.headers.get("stripe-signature") || ""

    const event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )

    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as any
      await prisma.order.updateMany({
        where: { payments: { some: { transactionId: paymentIntent.id } } },
        data: { paymentStatus: "PAID", paidAt: new Date() },
      })
    }

    if (event.type === "payment_intent.payment_failed") {
      const paymentIntent = event.data.object as any
      await prisma.order.updateMany({
        where: { payments: { some: { transactionId: paymentIntent.id } } },
        data: { paymentStatus: "FAILED" },
      })
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ error: "Webhook error" }, { status: 400 })
  }
}
