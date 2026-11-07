"use client"

import { useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import { Button } from "@/components/ui/Button"
import { formatPrice } from "@/lib/utils/format"
import { toast } from "react-hot-toast"
import { fetchJsonResponse, responseErrorMessage } from "@/lib/json-response"

interface CouponInputProps {
  subtotal: number
  onApplyDiscount: (discount: number) => void
}

export function CouponInput({ subtotal, onApplyDiscount }: CouponInputProps) {
  const [code, setCode] = useState("")
  const [applying, setApplying] = useState(false)
  const [applied, setApplied] = useState<{
    code: string
    discount: number
    discountValue: number
    discountType: string
  } | null>(null)
  const t = useTranslations("coupon")
  const locale = useLocale()

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) return

    setApplying(true)
    try {
      const { parsed, data } = await fetchJsonResponse<any>("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim(), subtotal }),
      })

      const payload = (data || {}) as any
      if (!parsed.ok) {
        toast.error(responseErrorMessage(parsed, t("failed")))
        return
      }
      if (payload.valid) {
        setApplied(payload.coupon)
        onApplyDiscount(payload.coupon.discount)
        toast.success(t("applied", { amount: formatPrice(payload.coupon.discount, undefined, locale) }))
      } else {
        toast.error(payload.error || t("invalid"))
      }
    } catch {
      toast.error(t("failed"))
    } finally {
      setApplying(false)
    }
  }

  const handleRemove = () => {
    setApplied(null)
    setCode("")
    onApplyDiscount(0)
  }

  return (
    <div className="border-t border-charcoal/10 pt-4">
      {applied ? (
        <div className="flex items-center justify-between text-sm">
          <div>
            <span className="text-sage font-medium">{applied.code}</span>
            <span className="text-stone ml-2">
              (-{applied.discountType === "PERCENTAGE" ? `${applied.discountValue}%` : formatPrice(applied.discount, undefined, locale)})
            </span>
          </div>
          <button
            onClick={handleRemove}
            className="text-xs text-stone hover:text-charcoal underline underline-offset-4"
          >
            {t("remove")}
          </button>
        </div>
      ) : (
        <form onSubmit={handleApply} className="flex gap-2">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={t("placeholder")}
            className="flex-1 px-4 py-2 bg-transparent border border-charcoal/20 focus:border-charcoal outline-none text-sm"
          />
          <Button type="submit" loading={applying} size="sm" variant="outline">
            {t("apply")}
          </Button>
        </form>
      )}
    </div>
  )
}
