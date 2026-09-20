"use client"

import { useRouter } from "next/navigation"
import { bi } from "@/components/admin/bilingual"

export default function DeleteCouponButton({ couponId, couponCode }: { couponId: string; couponCode: string }) {
  const router = useRouter()

  const handleDelete = async () => {
    if (!confirm(`${bi("Are you sure you want to delete coupon", "确认要删除优惠券") } "${couponCode}"? ${bi("This cannot be undone.", "此操作不可撤销。")}`)) return

    try {
      const res = await fetch(`/api/admin/coupons/${couponId}`, { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error || bi("Failed to delete coupon", "删除优惠券失败"))
        return
      }
      router.refresh()
    } catch {
      alert(bi("Failed to delete coupon", "删除优惠券失败"))
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      className="text-[10px] text-rosegold hover:underline ml-2"
    >
      {bi("Delete", "删除")}
    </button>
  )
}
