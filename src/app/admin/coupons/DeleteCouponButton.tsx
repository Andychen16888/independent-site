"use client"

import { useRouter } from "next/navigation"
import { bi } from "@/components/admin/bilingual"
import { fetchJsonResponse, responseErrorMessage } from "@/lib/json-response"

export default function DeleteCouponButton({ couponId, couponCode }: { couponId: string; couponCode: string }) {
  const router = useRouter()

  const handleDelete = async () => {
    if (!confirm(`${bi("Are you sure you want to delete coupon", "确认要删除优惠券") } "${couponCode}"? ${bi("This cannot be undone.", "此操作不可撤销。")}`)) return

    try {
      const { parsed } = await fetchJsonResponse(`/api/admin/coupons/${couponId}`, { method: "DELETE" })
      if (!parsed.ok) {
        alert(responseErrorMessage(parsed, bi("Failed to delete coupon", "删除优惠券失败")))
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
