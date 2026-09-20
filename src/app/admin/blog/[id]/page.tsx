"use client"

import { useParams } from "next/navigation"
import BlogForm from "@/components/admin/BlogForm"
import { bi } from "@/components/admin/bilingual"

export default function EditBlogPostPage() {
  const { id } = useParams<{ id: string }>()
  return (
    <div>
      <div className="mb-8">
        <h1 className="heading-md">{bi("Edit Blog Post", "编辑博客文章")}</h1>
        <p className="text-body text-sm mt-1">{bi("Update post content, publishing state, and SEO.", "更新文章内容、发布状态和 SEO。")}</p>
      </div>
      <BlogForm mode="edit" postId={id} />
    </div>
  )
}
