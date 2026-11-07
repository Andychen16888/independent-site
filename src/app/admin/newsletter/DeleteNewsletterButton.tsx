"use client"

import { useRouter } from "next/navigation"
import { bi } from "@/components/admin/bilingual"
import { fetchJsonResponse, responseErrorMessage } from "@/lib/json-response"

export default function DeleteNewsletterButton({ subscriberId, email }: { subscriberId: string; email: string }) {
  const router = useRouter()

  const handleDelete = async () => {
    if (!confirm(`${bi("Remove subscriber", "移除订阅用户")} "${email}"?`)) return

    try {
      const { parsed } = await fetchJsonResponse(`/api/admin/newsletter/${subscriberId}`, { method: "DELETE" })
      if (!parsed.ok) {
        alert(responseErrorMessage(parsed, bi("Failed to remove subscriber", "移除订阅用户失败")))
        return
      }
      router.refresh()
    } catch {
      alert(bi("Failed to remove subscriber", "移除订阅用户失败"))
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      className="text-[10px] text-rosegold hover:underline"
    >
      {bi("Remove", "移除")}
    </button>
  )
}
