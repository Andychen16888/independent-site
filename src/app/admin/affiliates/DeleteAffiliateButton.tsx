"use client"

import { useRouter } from "next/navigation"
import { bi } from "@/components/admin/bilingual"
import { fetchJsonResponse, responseErrorMessage } from "@/lib/json-response"

export default function DeleteAffiliateButton({ affiliateId, name }: { affiliateId: string; name: string }) {
  const router = useRouter()

  const handleDelete = async () => {
    if (!confirm(`${bi("Delete affiliate", "删除联盟成员")} "${name}"? ${bi("This cannot be undone.", "此操作不可撤销。")}`)) return

    try {
      const { parsed } = await fetchJsonResponse(`/api/admin/affiliates/${affiliateId}`, { method: "DELETE" })
      if (!parsed.ok) {
        alert(responseErrorMessage(parsed, bi("Failed to delete affiliate", "删除联盟成员失败")))
        return
      }
      router.refresh()
    } catch {
      alert(bi("Failed to delete affiliate", "删除联盟成员失败"))
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
