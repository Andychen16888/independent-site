"use client"

import { useTranslations } from "next-intl"
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js"
import { toast } from "react-hot-toast"
import { HiOutlineLockClosed } from "react-icons/hi2"
import { fetchJsonOrThrow } from "@/lib/json-response"

interface PayPalPaymentProps {
  amount: number
  currency?: string
  onSuccess: (paypalOrderId: string, captureId: string) => void
  onError: (error: string) => void
}

const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || ""

export function PayPalPayment({ amount, currency = "USD", onSuccess, onError }: PayPalPaymentProps) {
  const t = useTranslations("checkout")

  if (!paypalClientId) {
    return (
      <div className="border border-mist p-6 text-center">
        <p className="text-sm text-stone">{t("paypalNotConfigured")}</p>
      </div>
    )
  }

  return (
    <PayPalScriptProvider
      options={{
        clientId: paypalClientId,
        currency: currency,
        intent: "capture",
      }}
    >
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-xs text-stone mb-2">
          <HiOutlineLockClosed className="w-3 h-3" />
          <span>{t("securedByPaypal")}</span>
        </div>

        <PayPalButtons
          style={{
            layout: "vertical",
            color: "black",
            shape: "rect",
            label: "pay",
            tagline: false,
          }}
          createOrder={async () => {
            try {
              const { data } = await fetchJsonOrThrow<any>(
                "/api/paypal/create-order",
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ amount, currency }),
                },
                t("paypalInitFailed")
              )
              return data?.id
            } catch (error: any) {
              toast.error(error.message || t("paypalInitFailed"))
              throw error
            }
          }}
          onApprove={async (data) => {
            try {
              const { data: capture } = await fetchJsonOrThrow<any>(
                "/api/paypal/capture-order",
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ orderId: data.orderID }),
                },
                t("paypalCaptureFailed")
              )

              if (capture.status === "COMPLETED") {
                onSuccess(data.orderID, capture.captureId)
                toast.success(t("paypalSuccess"))
              } else {
                onError(t("paypalNotCompleted"))
              }
            } catch (error: any) {
              onError(error.message || t("paypalCaptureFailed"))
              toast.error(error.message || t("paymentFailed"))
            }
          }}
          onError={(err) => {
            console.error("PayPal error:", err)
            onError("PayPal payment failed. Please try again.")
            toast.error(t("paymentFailed"))
          }}
          onCancel={() => {
            toast(t("paypalCancelled"), { icon: "✋" })
          }}
        />
      </div>
    </PayPalScriptProvider>
  )
}
