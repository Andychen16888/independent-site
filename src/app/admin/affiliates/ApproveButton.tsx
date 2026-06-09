"use client"

import { useRouter } from "next/navigation"

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
        alert(data.error || "Failed to approve affiliate")
        return
      }
      router.refresh()
    } catch {
      alert("Failed to approve affiliate")
    }
  }

  return (
    <button
      type="button"
      onClick={handleApprove}
      className="text-[10px] text-sage hover:underline font-medium"
    >
      Approve
    </button>
  )
}
