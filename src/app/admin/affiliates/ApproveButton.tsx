"use client"

import { useRouter } from "next/navigation"
import { bi } from "@/components/admin/bilingual"

export default function ApproveButton({ affiliateId }: { affiliateId: string }) {
  const router = useRouter()

  const handleApprove = async () => {
    try {
      const res = await fetch(`/api/admin/affiliates/${affiliateId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "APPROVED" }),
      })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error || bi("Failed to approve affiliate", "批准联盟成员失败"))
        return
      }
      router.refresh()
    } catch {
      alert(bi("Failed to approve affiliate", "批准联盟成员失败"))
    }
  }

  return (
    <button
      type="button"
      onClick={handleApprove}
      className="text-[10px] text-sage hover:underline font-medium"
    >
      {bi("Approve", "批准")}
    </button>
  )
}
