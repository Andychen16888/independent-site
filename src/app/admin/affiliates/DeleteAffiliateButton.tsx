"use client"

import { useRouter } from "next/navigation"

export default function DeleteAffiliateButton({ affiliateId, name }: { affiliateId: string; name: string }) {
  const router = useRouter()

  const handleDelete = async () => {
    if (!confirm(`Delete affiliate "${name}"? This cannot be undone.`)) return

    try {
      const res = await fetch(`/api/admin/affiliates/${affiliateId}`, { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error || "Failed to delete affiliate")
        return
      }
      router.refresh()
    } catch {
      alert("Failed to delete affiliate")
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
