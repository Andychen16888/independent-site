"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { formatDateShort, formatPrice } from "@/lib/utils/format"
import { bi } from "@/components/admin/bilingual"

interface Referral {
  id: string
  status: string
  commission: number | null
  createdAt: string
      referredUser: { firstName: string | null; lastName: string | null; email: string } | null
  order: { orderNumber: string; total: number; createdAt: string } | null
}

interface Affiliate {
  id: string
  code: string
  status: string
  commissionRate: number
  totalEarned: number
  totalWithdrawn: number
  paypalEmail: string | null
  createdAt: string
  user: { id: string; firstName: string | null; lastName: string | null; email: string }
  referrals: Referral[]
}

export default function EditAffiliatePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [notFound, setNotFound] = useState(false)
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null)
  const [status, setStatus] = useState("PENDING")
  const [commissionRate, setCommissionRate] = useState("5.00")
  const [paypalEmail, setPaypalEmail] = useState("")

  useEffect(() => {
    async function loadAffiliate() {
      try {
        const res = await fetch(`/api/admin/affiliates/${id}`)
        if (res.status === 404) {
          setNotFound(true)
          return
        }
        if (!res.ok) throw new Error(bi("Failed to load affiliate", "加载联盟成员失败"))
        const data = await res.json()
        const a: Affiliate = data.affiliate
        setAffiliate(a)
        setStatus(a.status)
        setCommissionRate(a.commissionRate.toString())
        setPaypalEmail(a.paypalEmail || "")
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    loadAffiliate()
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError("")

    try {
      const res = await fetch(`/api/admin/affiliates/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, commissionRate, paypalEmail }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || bi("Failed to update affiliate", "更新联盟成员失败"))
      }

      router.refresh()
      setError("")
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
    return <div className="text-sm text-rosegold py-8">{bi("Affiliate not found.", "未找到联盟成员。")}</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="heading-md">{bi("Affiliate Details", "联盟成员详情")}</h1>
          <p className="text-body text-sm mt-1">
             {[affiliate?.user.firstName, affiliate?.user.lastName].filter(Boolean).join(" ") || affiliate?.user.email} &middot; {bi("Code", "代码")}: {affiliate?.code}
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push("/admin/affiliates")}
          className="text-xs text-stone hover:text-charcoal transition-colors"
        >
          &larr; {bi("Back", "返回")}
        </button>
      </div>

      {error && (
        <div className="bg-rosegold/10 border border-rosegold/20 text-sm p-3 mb-6">{error}</div>
      )}

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white border border-mist p-6">
          <p className="text-[10px] uppercase tracking-wider text-stone font-medium mb-1">{bi("Total Earned", "累计收入")}</p>
          <p className="text-xl font-serif">
            {affiliate ? formatPrice(Number(affiliate.totalEarned)) : "$0.00"}
          </p>
        </div>
        <div className="bg-white border border-mist p-6">
          <p className="text-[10px] uppercase tracking-wider text-stone font-medium mb-1">{bi("Withdrawn", "已提现")}</p>
          <p className="text-xl font-serif">
            {affiliate ? formatPrice(Number(affiliate.totalWithdrawn)) : "$0.00"}
          </p>
        </div>
        <div className="bg-white border border-mist p-6">
          <p className="text-[10px] uppercase tracking-wider text-stone font-medium mb-1">{bi("Referrals", "推荐数")}</p>
          <p className="text-xl font-serif">{affiliate?.referrals.length || 0}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white border border-mist p-6">
          <h3 className="font-serif text-base mb-4">{bi("Edit Affiliate", "编辑联盟成员")}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-stone font-medium mb-1.5">{bi("Status", "状态")}</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full border border-mist bg-white px-3 py-2 text-sm outline-none focus:border-charcoal transition-colors"
              >
                <option value="PENDING">{bi("Pending", "待审核")}</option>
                <option value="APPROVED">{bi("Approved", "已批准")}</option>
                <option value="REJECTED">{bi("Rejected", "已拒绝")}</option>
                <option value="SUSPENDED">{bi("Suspended", "已暂停")}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-stone font-medium mb-1.5">{bi("Commission Rate (%)", "佣金比例 (%)")}</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={commissionRate}
                onChange={(e) => setCommissionRate(e.target.value)}
                className="w-full border border-mist bg-white px-3 py-2 text-sm outline-none focus:border-charcoal transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-stone font-medium mb-1.5">{bi("PayPal Email", "PayPal 邮箱")}</label>
              <input
                type="email"
                value={paypalEmail}
                onChange={(e) => setPaypalEmail(e.target.value)}
                className="w-full border border-mist bg-white px-3 py-2 text-sm outline-none focus:border-charcoal transition-colors"
              />
            </div>
            <button type="submit" disabled={saving} className="btn-primary text-xs">
              {saving ? bi("Saving...", "保存中...") : bi("Save Changes", "保存更改")}
            </button>
          </form>
        </div>

        <div className="bg-white border border-mist p-6">
          <h3 className="font-serif text-base mb-4">{bi("Referrals", "推荐记录")}</h3>
          {affiliate && affiliate.referrals.length === 0 ? (
            <p className="text-sm text-stone py-4 text-center">{bi("No referrals yet.", "暂无推荐记录。")}</p>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {affiliate?.referrals.map((ref) => (
                <div key={ref.id} className="border border-mist p-3 text-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-xs">
                      {[ref.referredUser?.firstName, ref.referredUser?.lastName].filter(Boolean).join(" ") || ref.referredUser?.email || bi("Guest", "访客")}
                    </span>
                    <span className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 ${
                      ref.status === "CONVERTED" ? "bg-sage/10 text-sage" : "bg-stone/10 text-stone"
                    }`}>
                      {ref.status === "CONVERTED" ? bi("Converted", "已转化") : ref.status === "PENDING" ? bi("Pending", "待处理") : ref.status}
                    </span>
                  </div>
                  {ref.order && (
                    <p className="text-[10px] text-stone">
                      {bi("Order", "订单")} {ref.order.orderNumber} &middot; {formatPrice(Number(ref.order.total))}
                    </p>
                  )}
                  {ref.commission && (
                    <p className="text-[10px] text-stone">
                      {bi("Commission", "佣金")}: {formatPrice(Number(ref.commission))}
                    </p>
                  )}
                  <p className="text-[10px] text-stone mt-1">{formatDateShort(ref.createdAt)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
