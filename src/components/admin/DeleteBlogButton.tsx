"use client"

import { useRouter } from "next/navigation"
import { toast } from "react-hot-toast"

export default function DeleteBlogButton({ id, title }: { id: string; title: string }) {
  const router = useRouter()
  return (
    <button
      onClick={async () => {
        if (!confirm(`Delete post "${title}"?`)) return
        const res = await fetch(`/api/admin/blog/${id}`, { method: "DELETE" })
        if (!res.ok) { toast.error("Delete failed"); return }
        toast.success("Post deleted")
        router.refresh()
      }}
      className="text-rosegold hover:underline"
    >
      Delete
    </button>
  )
}