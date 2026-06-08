"use client"

import { useRouter } from "next/navigation"

export default function DeleteProductButton({ productId, productName }: { productId: string; productName: string }) {
  const router = useRouter()

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${productName}"? This cannot be undone.`)) return

    try {
      const res = await fetch(`/api/admin/products/${productId}`, { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error || "Failed to delete product")
        return
      }
      router.refresh()
    } catch {
      alert("Failed to delete product")
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
