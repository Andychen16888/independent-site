"use client"

import { useState } from "react"
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js"
import { toast } from "react-hot-toast"
import { HiOutlineLockClosed } from "react-icons/hi2"

interface PayPalPaymentProps {
  amount: number
  currency?: string
  onSuccess: (paypalOrderId: string, captureId: string) => void
  onError: (error: string) => void
}

const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || ""

export function PayPalPayment({ amount, currency = "USD", onSuccess, onError }: PayPalPaymentProps) {
  const [isLoading, setIsLoading] = useState(false)

  if (!paypalClientId) {
    return (
      <div className="border border-mist p-6 text-center">
        <p className="text-sm text-stone">PayPal is not configured. Please set NEXT_PUBLIC_PAYPAL_CLIENT_ID in your environment.</p>
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
          <span>Secured by PayPal</span>
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
            setIsLoading(true)
            try {
              const res = await fetch("/api/paypal/create-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount, currency }),
              })
              const data = await res.json()
              if (!res.ok) throw new Error(data.error || "Failed to create order")
              return data.id
            } catch (error: any) {
              toast.error(error.message || "Failed to initialize PayPal")
              throw error
            } finally {
              setIsLoading(false)
            }
          }}
          onApprove={async (data) => {
            try {
              const res = await fetch("/api/paypal/capture-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId: data.orderID }),
              })
              const capture = await res.json()
              if (!res.ok) throw new Error(capture.error || "Payment capture failed")

              if (capture.status === "COMPLETED") {
                onSuccess(data.orderID, capture.captureId)
                toast.success("Payment successful via PayPal!")
              } else {
                onError("Payment was not completed")
              }
            } catch (error: any) {
              onError(error.message || "Payment capture failed")
              toast.error(error.message || "Payment failed")
            }
          }}
          onError={(err) => {
            console.error("PayPal error:", err)
            onError("PayPal payment failed. Please try again.")
            toast.error("PayPal payment failed")
          }}
          onCancel={() => {
            toast("Payment cancelled", { icon: "✋" })
          }}
        />
      </div>
    </PayPalScriptProvider>
  )
}
