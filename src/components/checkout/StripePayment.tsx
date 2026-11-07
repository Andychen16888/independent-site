"use client"

import { useState, useEffect, useMemo } from "react"
import { useLocale, useTranslations } from "next-intl"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { Button } from "@/components/ui/Button"
import { getStripePublishableKey } from "@/lib/stripe/stripe"
import { formatPrice } from "@/lib/utils/format"
import { toast } from "react-hot-toast"
import { fetchJsonOrThrow } from "@/lib/json-response"

interface StripePaymentProps {
  amount: number
  onSuccess: (paymentIntentId: string) => void
  onError: (error: string) => void
}

function PaymentForm({ amount, onSuccess, onError }: StripePaymentProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isLoading, setIsLoading] = useState(false)
  const t = useTranslations("checkout")
  const locale = useLocale()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setIsLoading(true)

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/${locale}/checkout/complete`,
      },
      redirect: "if_required",
    })

    if (error) {
      onError(error.message || t("paymentFailed"))
      toast.error(error.message || t("paymentFailed"))
    } else if (paymentIntent?.status === "succeeded") {
      onSuccess(paymentIntent.id)
      toast.success(t("paymentSuccessful"))
    }

    setIsLoading(false)
  }

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      <Button
        type="submit"
        disabled={!stripe || isLoading}
        loading={isLoading}
        className="w-full mt-6"
        size="lg"
      >
        {t("pay", { amount: formatPrice(amount, undefined, locale) })}
      </Button>
    </form>
  )
}

export function StripePayment(props: StripePaymentProps) {
  const t = useTranslations("checkout")
  const stripePromise = useMemo(() => {
    const key = getStripePublishableKey()
    return key ? loadStripe(key) : null
  }, [])
  const [clientSecret, setClientSecret] = useState<string | null>(null)

  useEffect(() => {
    if (!stripePromise) return

    fetchJsonOrThrow<any>(
      "/api/checkout/create-payment-intent",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: props.amount, currency: "usd" }),
      },
      t("initFailed")
    )
      .then(({ data }) => (data || {}) as any)
      .then((data) => {
        if (data.clientSecret) setClientSecret(data.clientSecret)
      })
      .catch(() => toast.error(t("initFailed")))
  }, [props.amount, stripePromise, t])

  if (!stripePromise) {
    return (
      <div className="border border-mist p-6 text-center">
        <p className="text-sm text-stone">{t("cardUnavailable")}</p>
      </div>
    )
  }

  if (!clientSecret) {
    return (
      <div className="border border-mist p-6 text-center">
        <div className="animate-pulse h-8 bg-mist rounded w-3/4 mx-auto mb-4" />
        <div className="animate-pulse h-8 bg-mist rounded w-1/2 mx-auto" />
        <p className="text-sm text-stone mt-4">{t("initializingPayment")}</p>
      </div>
    )
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: "stripe",
          variables: {
            colorPrimary: "#2C2C2C",
            colorText: "#2C2C2C",
            fontFamily: "Inter, Helvetica Neue, Arial, sans-serif",
            borderRadius: "0px",
          },
        },
      }}
    >
      <PaymentForm {...props} />
    </Elements>
  )
}
