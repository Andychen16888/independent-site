import { stripe } from "./stripe"

export async function createPaymentIntent(amount: number, currency: string = "usd") {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency,
    automatic_payment_methods: {
      enabled: true,
    },
  })

  return paymentIntent
}

export async function retrievePaymentIntent(id: string) {
  return stripe.paymentIntents.retrieve(id)
}
