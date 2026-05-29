"use client"

import { useState } from "react"
import Link from "next/link"
import { useCartStore } from "@/stores/cart-store"
import { Button } from "@/components/ui/Button"
import { StripePayment } from "./StripePayment"
import { PayPalPayment } from "./PayPalPayment"
import { formatPrice } from "@/lib/utils/format"
import { toast } from "react-hot-toast"
import { HiOutlineCreditCard, HiOutlineLockClosed } from "react-icons/hi2"

const stripeEnabled = !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

type PaymentMethod = "card" | "paypal"

export function CheckoutForm() {
  const { items, getSubtotal, clearCart } = useCartStore()
  const [isProcessing, setIsProcessing] = useState(false)
  const [step, setStep] = useState<"shipping" | "payment">("shipping")
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(stripeEnabled ? "card" : "paypal")
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    street: "",
    street2: "",
    city: "",
    state: "",
    zipCode: "",
    country: "US",
  })

  const subtotal = getSubtotal()
  const shipping = subtotal >= 100 ? 0 : 12
  const tax = subtotal * 0.08
  const total = subtotal + shipping + tax

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setStep("payment")
  }

  const createOrder = async (paymentMethod: string, paymentId: string) => {
    setIsProcessing(true)
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          shippingAddress: formData,
          subtotal,
          shippingCost: shipping,
          taxAmount: tax,
          total,
          paymentMethod,
          paymentId,
        }),
      })

      if (!res.ok) throw new Error("Order creation failed")

      const data = await res.json()
      toast.success("Order placed successfully!")
      clearCart()
      window.location.href = `/account/orders/${data.orderId}`
    } catch {
      toast.error("Failed to create order")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleStripeSuccess = (paymentIntentId: string) => {
    createOrder("stripe", paymentIntentId)
  }

  const handlePayPalSuccess = (orderId: string, captureId: string) => {
    createOrder("paypal", captureId)
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-body mb-4">Your cart is empty</p>
        <Link href="/products" className="btn-primary">Shop Now</Link>
      </div>
    )
  }

  return (
    <div className="grid lg:grid-cols-[1fr_380px] gap-12">
      <div className="space-y-8">
        {step === "shipping" ? (
          <form onSubmit={handleShippingSubmit}>
            <div className="mb-8">
              <h2 className="font-serif text-xl mb-6">Contact</h2>
              <div className="space-y-4">
                <input
                  type="email"
                  placeholder="Email"
                  required
                  value={formData.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  className="w-full px-4 py-3 bg-transparent border border-charcoal/20 focus:border-charcoal outline-none text-sm transition-colors"
                />
                <input
                  type="tel"
                  placeholder="Phone (optional)"
                  value={formData.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  className="w-full px-4 py-3 bg-transparent border border-charcoal/20 focus:border-charcoal outline-none text-sm transition-colors"
                />
              </div>
            </div>

            <div className="mb-8">
              <h2 className="font-serif text-xl mb-6">Shipping Address</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="First name"
                    required
                    value={formData.firstName}
                    onChange={(e) => updateField("firstName", e.target.value)}
                    className="w-full px-4 py-3 bg-transparent border border-charcoal/20 focus:border-charcoal outline-none text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Last name"
                    required
                    value={formData.lastName}
                    onChange={(e) => updateField("lastName", e.target.value)}
                    className="w-full px-4 py-3 bg-transparent border border-charcoal/20 focus:border-charcoal outline-none text-sm"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Address"
                  required
                  value={formData.street}
                  onChange={(e) => updateField("street", e.target.value)}
                  className="w-full px-4 py-3 bg-transparent border border-charcoal/20 focus:border-charcoal outline-none text-sm"
                />
                <input
                  type="text"
                  placeholder="Apartment, suite, etc. (optional)"
                  value={formData.street2}
                  onChange={(e) => updateField("street2", e.target.value)}
                  className="w-full px-4 py-3 bg-transparent border border-charcoal/20 focus:border-charcoal outline-none text-sm"
                />
                <div className="grid grid-cols-3 gap-4">
                  <input
                    type="text"
                    placeholder="City"
                    required
                    value={formData.city}
                    onChange={(e) => updateField("city", e.target.value)}
                    className="w-full px-4 py-3 bg-transparent border border-charcoal/20 focus:border-charcoal outline-none text-sm"
                  />
                  <input
                    type="text"
                    placeholder="State"
                    required
                    value={formData.state}
                    onChange={(e) => updateField("state", e.target.value)}
                    className="w-full px-4 py-3 bg-transparent border border-charcoal/20 focus:border-charcoal outline-none text-sm"
                  />
                  <input
                    type="text"
                    placeholder="ZIP code"
                    required
                    value={formData.zipCode}
                    onChange={(e) => updateField("zipCode", e.target.value)}
                    className="w-full px-4 py-3 bg-transparent border border-charcoal/20 focus:border-charcoal outline-none text-sm"
                  />
                </div>
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full">
              Continue to Payment
            </Button>
          </form>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-xl">Payment</h2>
              <button
                onClick={() => setStep("shipping")}
                className="text-xs text-stone hover:text-charcoal underline underline-offset-4"
              >
                Edit Shipping
              </button>
            </div>

            <div className="bg-cream p-4 mb-6 text-sm space-y-1">
              <p>{formData.firstName} {formData.lastName}</p>
              <p className="text-stone">{formData.street}</p>
              <p className="text-stone">{formData.city}, {formData.state} {formData.zipCode}</p>
            </div>

            {/* Payment Method Toggle */}
            <div className={`grid gap-3 mb-6 ${stripeEnabled ? "grid-cols-2" : "grid-cols-1"}`}>
              {stripeEnabled && (
                <button
                  onClick={() => setPaymentMethod("card")}
                  className={`p-4 border text-left transition-colors ${
                    paymentMethod === "card"
                      ? "border-charcoal bg-charcoal/5"
                      : "border-mist hover:border-charcoal/30"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <HiOutlineCreditCard className="w-5 h-5 text-stone" />
                    <div>
                      <p className="text-sm font-medium">Credit Card</p>
                      <p className="text-xs text-stone">Visa, Mastercard, Amex</p>
                    </div>
                  </div>
                </button>
              )}

              <button
                onClick={() => setPaymentMethod("paypal")}
                className={`p-4 border text-left transition-colors ${
                  paymentMethod === "paypal"
                    ? "border-charcoal bg-charcoal/5"
                    : "border-mist hover:border-charcoal/30"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl font-bold text-[#003087] tracking-tight" style={{ fontFamily: "system-ui" }}>P</span>
                  <div>
                    <p className="text-sm font-medium">PayPal</p>
                    <p className="text-xs text-stone">Pay with your account</p>
                  </div>
                </div>
              </button>
            </div>

            {/* Payment Method Content */}
            <div className="min-h-[200px]">
              {paymentMethod === "card" ? (
                <div>
                  <div className="flex items-center gap-2 text-xs text-stone mb-4">
                    <HiOutlineLockClosed className="w-3 h-3" />
                    <span>Secured by Stripe</span>
                  </div>
                  <StripePayment
                    amount={total}
                    onSuccess={handleStripeSuccess}
                    onError={(error) => toast.error(error)}
                  />
                </div>
              ) : (
                <PayPalPayment
                  amount={total}
                  currency="USD"
                  onSuccess={handlePayPalSuccess}
                  onError={(error) => toast.error(error)}
                />
              )}
            </div>
          </div>
        )}
      </div>

      <div className="lg:sticky lg:top-28 h-fit">
        <div className="bg-cream p-8">
          <h3 className="font-serif text-lg mb-6">Order Summary</h3>

          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex gap-4">
                <div className="w-16 h-16 bg-mist flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{item.name}</p>
                  <p className="text-xs text-stone mt-1">Qty: {item.quantity}</p>
                  <p className="text-sm mt-1">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-charcoal/10 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-stone">Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone">Shipping</span>
              <span>{shipping === 0 ? "Free" : formatPrice(shipping)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone">Tax (8%)</span>
              <span>{formatPrice(tax)}</span>
            </div>
            <div className="border-t border-charcoal/10 pt-3 flex justify-between font-medium">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>

          <div className="mt-4 text-xs text-stone text-center space-y-1">
            <p>Secure checkout via {stripeEnabled ? "Stripe & " : ""}PayPal</p>
            <p>Your payment info is encrypted</p>
          </div>
        </div>
      </div>
    </div>
  )
}
