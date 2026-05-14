"use client"

import { useState } from "react"
import { Button } from "@/components/ui/Button"
import { formatPrice } from "@/lib/utils/format"
import { toast } from "react-hot-toast"

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
    discountType: string
  } | null>(null)

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) return

    setApplying(true)
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim(), subtotal }),
      })

      const data = await res.json()
      if (data.valid) {
        setApplied(data.coupon)
        onApplyDiscount(data.coupon.discount)
        toast.success(`Coupon applied! You saved ${formatPrice(data.coupon.discount)}`)
      } else {
        toast.error(data.error || "Invalid coupon")
      }
    } catch {
      toast.error("Failed to validate coupon")
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
              (-{applied.discountType === "PERCENTAGE" ? `${applied.discount}%` : formatPrice(applied.discount)})
            </span>
          </div>
          <button
            onClick={handleRemove}
            className="text-xs text-stone hover:text-charcoal underline underline-offset-4"
          >
            Remove
          </button>
        </div>
      ) : (
        <form onSubmit={handleApply} className="flex gap-2">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Coupon code"
            className="flex-1 px-4 py-2 bg-transparent border border-charcoal/20 focus:border-charcoal outline-none text-sm"
          />
          <Button type="submit" loading={applying} size="sm" variant="outline">
            Apply
          </Button>
        </form>
      )}
    </div>
  )
}
