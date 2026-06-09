"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"

interface Coupon {
  id: string
  code: string
  type: string
  discountType: string
  discountValue: number
  minOrderAmount: number | null
  maxDiscount: number | null
  maxUses: number | null
  usedCount: number
  maxUsesPerUser: number | null
  isActive: boolean
  startsAt: string | null
  expiresAt: string | null
}

export default function EditCouponPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [notFound, setNotFound] = useState(false)
  const [form, setForm] = useState({
    code: "",
    type: "PUBLIC",
    discountType: "PERCENTAGE",
    discountValue: "",
    minOrderAmount: "",
    maxDiscount: "",
    maxUses: "",
    maxUsesPerUser: "",
    isActive: true,
    startsAt: "",
    expiresAt: "",
  })

  useEffect(() => {
    async function loadCoupon() {
      try {
        const res = await fetch(`/api/admin/coupons/${id}`)
        if (res.status === 404) {
          setNotFound(true)
          return
        }
        if (!res.ok) throw new Error("Failed to load coupon")
        const data = await res.json()
        const c: Coupon = data.coupon
        setForm({
          code: c.code,
          type: c.type,
          discountType: c.discountType,
          discountValue: c.discountValue.toString(),
          minOrderAmount: c.minOrderAmount ? c.minOrderAmount.toString() : "",
          maxDiscount: c.maxDiscount ? c.maxDiscount.toString() : "",
          maxUses: c.maxUses ? c.maxUses.toString() : "",
          maxUsesPerUser: c.maxUsesPerUser ? c.maxUsesPerUser.toString() : "",
          isActive: c.isActive,
          startsAt: c.startsAt ? c.startsAt.slice(0, 16) : "",
          expiresAt: c.expiresAt ? c.expiresAt.slice(0, 16) : "",
        })
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    loadCoupon()
  }, [id])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const val = type === "checkbox" ? (e.target as HTMLInputElement).checked : value
    setForm((prev) => ({ ...prev, [name]: val }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError("")

    try {
      const res = await fetch(`/api/admin/coupons/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to update coupon")
      }

      router.push("/admin/coupons")
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-sm text-stone py-8">Loading...</div>
  }

  if (notFound) {
    return <div className="text-sm text-rosegold py-8">Coupon not found.</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="heading-md">Edit Coupon</h1>
          <p className="text-body text-sm mt-1">Update coupon details.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        {error && (
          <div className="bg-rosegold/10 border border-rosegold/20 text-sm p-3">{error}</div>
        )}

        <div>
          <label className="block text-xs uppercase tracking-wider text-stone font-medium mb-1.5">Coupon Code *</label>
          <input
            name="code"
            value={form.code}
            onChange={handleChange}
            required
            className="w-full border border-mist bg-white px-3 py-2 text-sm outline-none focus:border-charcoal transition-colors uppercase"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-stone font-medium mb-1.5">Coupon Type</label>
            <select
              name="type"
              value={form.type}
              onChange={handleChange}
              className="w-full border border-mist bg-white px-3 py-2 text-sm outline-none focus:border-charcoal transition-colors"
            >
              <option value="PUBLIC">Public</option>
              <option value="PRIVATE">Private</option>
              <option value="WELCOME">Welcome</option>
              <option value="REFERRAL">Referral</option>
              <option value="ABANDONED_CART">Abandoned Cart</option>
            </select>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-stone font-medium mb-1.5">Discount Type</label>
            <select
              name="discountType"
              value={form.discountType}
              onChange={handleChange}
              className="w-full border border-mist bg-white px-3 py-2 text-sm outline-none focus:border-charcoal transition-colors"
            >
              <option value="PERCENTAGE">Percentage</option>
              <option value="FIXED_AMOUNT">Fixed Amount</option>
              <option value="FREE_SHIPPING">Free Shipping</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-stone font-medium mb-1.5">
              {form.discountType === "PERCENTAGE" ? "Discount (%) *" : form.discountType === "FIXED_AMOUNT" ? "Discount ($) *" : "Discount Value"}
            </label>
            <input
              name="discountValue"
              type="number"
              step="0.01"
              min="0"
              value={form.discountValue}
              onChange={handleChange}
              required={form.discountType !== "FREE_SHIPPING"}
              disabled={form.discountType === "FREE_SHIPPING"}
              className="w-full border border-mist bg-white px-3 py-2 text-sm outline-none focus:border-charcoal transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-stone font-medium mb-1.5">Min. Order Amount</label>
            <input
              name="minOrderAmount"
              type="number"
              step="0.01"
              min="0"
              value={form.minOrderAmount}
              onChange={handleChange}
              className="w-full border border-mist bg-white px-3 py-2 text-sm outline-none focus:border-charcoal transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-stone font-medium mb-1.5">Max Discount ($)</label>
            <input
              name="maxDiscount"
              type="number"
              step="0.01"
              min="0"
              value={form.maxDiscount}
              onChange={handleChange}
              className="w-full border border-mist bg-white px-3 py-2 text-sm outline-none focus:border-charcoal transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-stone font-medium mb-1.5">Max Uses</label>
            <input
              name="maxUses"
              type="number"
              min="0"
              value={form.maxUses}
              onChange={handleChange}
              className="w-full border border-mist bg-white px-3 py-2 text-sm outline-none focus:border-charcoal transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wider text-stone font-medium mb-1.5">Max Uses Per User</label>
          <input
            name="maxUsesPerUser"
            type="number"
            min="0"
            value={form.maxUsesPerUser}
            onChange={handleChange}
            className="w-full border border-mist bg-white px-3 py-2 text-sm outline-none focus:border-charcoal transition-colors"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-stone font-medium mb-1.5">Start Date</label>
            <input
              name="startsAt"
              type="datetime-local"
              value={form.startsAt}
              onChange={handleChange}
              className="w-full border border-mist bg-white px-3 py-2 text-sm outline-none focus:border-charcoal transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-stone font-medium mb-1.5">Expiry Date</label>
            <input
              name="expiresAt"
              type="datetime-local"
              value={form.expiresAt}
              onChange={handleChange}
              className="w-full border border-mist bg-white px-3 py-2 text-sm outline-none focus:border-charcoal transition-colors"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            name="isActive"
            type="checkbox"
            checked={form.isActive}
            onChange={handleChange}
            className="w-4 h-4 border-mist"
          />
          <label className="text-sm text-stone">Active</label>
        </div>

        <div className="flex items-center gap-3 pt-4 border-t border-mist">
          <button type="submit" disabled={saving} className="btn-primary text-xs">
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <button type="button" onClick={() => router.push("/admin/coupons")} className="text-xs text-stone hover:text-charcoal transition-colors">
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
