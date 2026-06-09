"use client"

import { useRouter } from "next/navigation"

export default function DeleteCouponButton({ couponId, couponCode }: { couponId: string; couponCode: string }) {
  const router = useRouter()

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete coupon "${couponCode}"? This cannot be undone.`)) return

    try {
      const res = await fetch(`/api/admin/coupons/${couponId}`, { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error || "Failed to delete coupon")
        return
      }
      router.refresh()
    } catch {
      alert("Failed to delete coupon")
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      className="text-[10px] text-rosegold hover:underline ml-2"
    >
      Delete
    </button>
  )
}
