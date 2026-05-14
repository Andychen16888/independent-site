import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe/stripe"
import { prisma } from "@/lib/db/prisma"

export async function POST(req: Request) {
  const body = await req.text()
  const signature = req.headers.get("stripe-signature") || ""

  try {
    const event = stripe.webhooks.constructEvent(
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
