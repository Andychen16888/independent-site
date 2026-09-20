"use client"

import { useRouter } from "next/navigation"
import { toast } from "react-hot-toast"
import { bi } from "@/components/admin/bilingual"

export default function DeleteBlogButton({ id, title }: { id: string; title: string }) {
  const router = useRouter()
  return (
    <button
      onClick={async () => {
        if (!confirm(`${bi("Delete post", "删除文章")} "${title}"?`)) return
        const res = await fetch(`/api/admin/blog/${id}`, { method: "DELETE" })
        if (!res.ok) { toast.error(bi("Delete failed", "删除失败")); return }
        toast.success(bi("Post deleted", "文章已删除"))
        router.refresh()
      }}
      className="text-rosegold hover:underline"
    >
      {bi("Delete", "删除")}
    </button>
  )
}
