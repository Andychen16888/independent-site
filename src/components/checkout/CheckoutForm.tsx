"use client"

import { useState } from "react"
import { Link, useRouter } from "@/i18n/navigation"
import { useLocale, useTranslations } from "next-intl"
import { useCartStore } from "@/stores/cart-store"
import { Button } from "@/components/ui/Button"
import { StripePayment } from "./StripePayment"
import { PayPalPayment } from "./PayPalPayment"
import { formatPrice } from "@/lib/utils/format"
import { toast } from "react-hot-toast"
import { HiOutlineCreditCard, HiOutlineLockClosed } from "react-icons/hi2"
import { fetchJsonOrThrow } from "@/lib/json-response"

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
  const t = useTranslations("checkout")
  const locale = useLocale()
  const router = useRouter()

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
    if (isProcessing) return
    setIsProcessing(true)
    try {
      const { data } = await fetchJsonOrThrow<any>(
        "/api/checkout",
        {
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
        },
        "Order creation failed"
      )
      const payload = (data || {}) as any
      toast.success(t("orderPlaced"))
      clearCart()
      router.push(`/account/orders/${payload.orderId}`)
    } catch {
      toast.error(t("failedToCreate"))
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
        <p className="text-body mb-4">{t("cartEmpty")}</p>
        <Link href="/products" className="btn-primary">{t("shopNow")}</Link>
      </div>
    )
  }

  return (
    <div className="grid lg:grid-cols-[1fr_380px] gap-12">
      <div className="space-y-8">
        {step === "shipping" ? (
          <form onSubmit={handleShippingSubmit}>
            <div className="mb-8">
              <h2 className="font-serif text-xl mb-6">{t("contact")}</h2>
              <div className="space-y-4">
                <input
                  type="email"
                  placeholder={t("emailPlaceholder")}
                  required
                  value={formData.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  className="w-full px-4 py-3 bg-transparent border border-charcoal/20 focus:border-charcoal outline-none text-sm transition-colors"
                />
                <input
                  type="tel"
                  placeholder={t("phonePlaceholder")}
                  value={formData.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  className="w-full px-4 py-3 bg-transparent border border-charcoal/20 focus:border-charcoal outline-none text-sm transition-colors"
                />
              </div>
            </div>

            <div className="mb-8">
              <h2 className="font-serif text-xl mb-6">{t("shippingAddress")}</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder={t("firstNamePlaceholder")}
                    required
                    value={formData.firstName}
                    onChange={(e) => updateField("firstName", e.target.value)}
                    className="w-full px-4 py-3 bg-transparent border border-charcoal/20 focus:border-charcoal outline-none text-sm"
                  />
                  <input
                    type="text"
                    placeholder={t("lastNamePlaceholder")}
                    required
                    value={formData.lastName}
                    onChange={(e) => updateField("lastName", e.target.value)}
                    className="w-full px-4 py-3 bg-transparent border border-charcoal/20 focus:border-charcoal outline-none text-sm"
                  />
                </div>
                <input
                  type="text"
                  placeholder={t("addressPlaceholder")}
                  required
                  value={formData.street}
                  onChange={(e) => updateField("street", e.target.value)}
                  className="w-full px-4 py-3 bg-transparent border border-charcoal/20 focus:border-charcoal outline-none text-sm"
                />
                <input
                  type="text"
                  placeholder={t("apartmentPlaceholder")}
                  value={formData.street2}
                  onChange={(e) => updateField("street2", e.target.value)}
                  className="w-full px-4 py-3 bg-transparent border border-charcoal/20 focus:border-charcoal outline-none text-sm"
                />
                <div className="grid grid-cols-3 gap-4">
                  <input
                    type="text"
                    placeholder={t("cityPlaceholder")}
                    required
                    value={formData.city}
                    onChange={(e) => updateField("city", e.target.value)}
                    className="w-full px-4 py-3 bg-transparent border border-charcoal/20 focus:border-charcoal outline-none text-sm"
                  />
                  <input
                    type="text"
                    placeholder={t("statePlaceholder")}
                    required
                    value={formData.state}
                    onChange={(e) => updateField("state", e.target.value)}
                    className="w-full px-4 py-3 bg-transparent border border-charcoal/20 focus:border-charcoal outline-none text-sm"
                  />
                  <input
                    type="text"
                    placeholder={t("zipPlaceholder")}
                    required
                    value={formData.zipCode}
                    onChange={(e) => updateField("zipCode", e.target.value)}
                    className="w-full px-4 py-3 bg-transparent border border-charcoal/20 focus:border-charcoal outline-none text-sm"
                  />
                </div>
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full">
              {t("continueToPayment")}
            </Button>
          </form>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-xl">{t("payment")}</h2>
              <button
                onClick={() => setStep("shipping")}
                className="text-xs text-stone hover:text-charcoal underline underline-offset-4"
              >
                {t("editShipping")}
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
                      <p className="text-sm font-medium">{t("creditCard")}</p>
                      <p className="text-xs text-stone">{t("cardHint")}</p>
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
                    <p className="text-sm font-medium">{t("paypal")}</p>
                    <p className="text-xs text-stone">{t("paypalTagline")}</p>
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
                    <span>{t("securedByStripe")}</span>
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
          <h3 className="font-serif text-lg mb-6">{t("orderSummary")}</h3>

          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex gap-4">
                <div className="w-16 h-16 bg-mist flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{item.name}</p>
                  <p className="text-xs text-stone mt-1">{t("qty", { qty: item.quantity })}</p>
                  <p className="text-sm mt-1">
                    {formatPrice(item.price * item.quantity, undefined, locale)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-charcoal/10 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-stone">{t("subtotal")}</span>
              <span>{formatPrice(subtotal, undefined, locale)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone">{t("shipping")}</span>
              <span>{shipping === 0 ? t("free") : formatPrice(shipping, undefined, locale)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone">{t("tax", { rate: 8 })}</span>
              <span>{formatPrice(tax, undefined, locale)}</span>
            </div>
            <div className="border-t border-charcoal/10 pt-3 flex justify-between font-medium">
              <span>{t("total")}</span>
              <span>{formatPrice(total, undefined, locale)}</span>
            </div>
          </div>

          <div className="mt-4 text-xs text-stone text-center space-y-1">
            <p>{t("secureCheckoutNote")}</p>
            <p>{t("encryptedNote")}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
