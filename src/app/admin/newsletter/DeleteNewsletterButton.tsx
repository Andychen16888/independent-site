"use client"

import { useRouter } from "next/navigation"

export default function DeleteNewsletterButton({ subscriberId, email }: { subscriberId: string; email: string }) {
  const router = useRouter()

  const handleDelete = async () => {
    if (!confirm(`Remove subscriber "${email}"?`)) return

    try {
      const res = await fetch(`/api/admin/newsletter/${subscriberId}`, { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error || "Failed to remove subscriber")
        return
      }
      router.refresh()
    } catch {
      alert("Failed to remove subscriber")
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      className="text-[10px] text-rosegold hover:underline"
    >
      Remove
    </button>
  )
}
