"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { bi } from "@/components/admin/bilingual"
import { fetchJsonOrThrow, fetchJsonResponse, responseErrorMessage } from "@/lib/json-response"

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
        const { res, parsed, data } = await fetchJsonResponse<any>(`/api/admin/coupons/${id}`)
        if (res.status === 404) {
          setNotFound(true)
          return
        }
        if (!parsed.ok) throw new Error(responseErrorMessage(parsed, bi("Failed to load coupon", "加载优惠券失败")))
        const payload = (data || {}) as any
        const c: Coupon = payload.coupon
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
      await fetchJsonOrThrow(
        `/api/admin/coupons/${id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        },
        bi("Failed to update coupon", "更新优惠券失败")
      )

      router.push("/admin/coupons")
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-sm text-stone py-8">{bi("Loading...", "加载中...")}</div>
  }

  if (notFound) {
    return <div className="text-sm text-rosegold py-8">{bi("Coupon not found.", "未找到优惠券。")}</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="heading-md">{bi("Edit Coupon", "编辑优惠券")}</h1>
          <p className="text-body text-sm mt-1">{bi("Update coupon details.", "更新优惠券详情。")}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        {error && (
          <div className="bg-rosegold/10 border border-rosegold/20 text-sm p-3">{error}</div>
        )}

        <div>
          <label className="block text-xs uppercase tracking-wider text-stone font-medium mb-1.5">{bi("Coupon Code *", "优惠码 *")}</label>
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
            <label className="block text-xs uppercase tracking-wider text-stone font-medium mb-1.5">{bi("Coupon Type", "优惠券类型")}</label>
            <select
              name="type"
              value={form.type}
              onChange={handleChange}
              className="w-full border border-mist bg-white px-3 py-2 text-sm outline-none focus:border-charcoal transition-colors"
            >
              <option value="PUBLIC">{bi("Public", "公开")}</option>
              <option value="PRIVATE">{bi("Private", "私有")}</option>
              <option value="WELCOME">{bi("Welcome", "欢迎")}</option>
              <option value="REFERRAL">{bi("Referral", "推荐")}</option>
              <option value="ABANDONED_CART">{bi("Abandoned Cart", "弃单挽回")}</option>
            </select>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-stone font-medium mb-1.5">{bi("Discount Type", "折扣类型")}</label>
            <select
              name="discountType"
              value={form.discountType}
              onChange={handleChange}
              className="w-full border border-mist bg-white px-3 py-2 text-sm outline-none focus:border-charcoal transition-colors"
            >
              <option value="PERCENTAGE">{bi("Percentage", "百分比")}</option>
              <option value="FIXED_AMOUNT">{bi("Fixed Amount", "固定金额")}</option>
              <option value="FREE_SHIPPING">{bi("Free Shipping", "包邮")}</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-stone font-medium mb-1.5">
              {form.discountType === "PERCENTAGE" ? bi("Discount (%) *", "折扣 (%) *") : form.discountType === "FIXED_AMOUNT" ? bi("Discount ($) *", "折扣金额 ($) *") : bi("Discount Value", "折扣值")}
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
            <label className="block text-xs uppercase tracking-wider text-stone font-medium mb-1.5">{bi("Min. Order Amount", "最低订单金额")}</label>
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
            <label className="block text-xs uppercase tracking-wider text-stone font-medium mb-1.5">{bi("Max Discount ($)", "最大折扣 ($)")}</label>
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
            <label className="block text-xs uppercase tracking-wider text-stone font-medium mb-1.5">{bi("Max Uses", "最大使用次数")}</label>
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
          <label className="block text-xs uppercase tracking-wider text-stone font-medium mb-1.5">{bi("Max Uses Per User", "每位用户最大使用次数")}</label>
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
            <label className="block text-xs uppercase tracking-wider text-stone font-medium mb-1.5">{bi("Start Date", "开始时间")}</label>
            <input
              name="startsAt"
              type="datetime-local"
              value={form.startsAt}
              onChange={handleChange}
              className="w-full border border-mist bg-white px-3 py-2 text-sm outline-none focus:border-charcoal transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-stone font-medium mb-1.5">{bi("Expiry Date", "结束时间")}</label>
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
          <label className="text-sm text-stone">{bi("Active", "启用")}</label>
        </div>

        <div className="flex items-center gap-3 pt-4 border-t border-mist">
          <button type="submit" disabled={saving} className="btn-primary text-xs">
            {saving ? bi("Saving...", "保存中...") : bi("Save Changes", "保存更改")}
          </button>
          <button type="button" onClick={() => router.push("/admin/coupons")} className="text-xs text-stone hover:text-charcoal transition-colors">
            {bi("Cancel", "取消")}
          </button>
        </div>
      </form>
    </div>
  )
}
