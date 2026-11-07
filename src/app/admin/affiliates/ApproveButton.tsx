"use client"

import { useRouter } from "next/navigation"
import { bi } from "@/components/admin/bilingual"
import { fetchJsonResponse, responseErrorMessage } from "@/lib/json-response"

export default function ApproveButton({ affiliateId }: { affiliateId: string }) {
  const router = useRouter()

  const handleApprove = async () => {
    try {
      const { parsed } = await fetchJsonResponse(`/api/admin/affiliates/${affiliateId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "APPROVED" }),
      })
      if (!parsed.ok) {
        alert(responseErrorMessage(parsed, bi("Failed to approve affiliate", "批准联盟成员失败")))
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
