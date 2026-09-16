"use client"

import { useParams } from "next/navigation"
import BlogForm from "@/components/admin/BlogForm"

export default function EditBlogPostPage() {
  const { id } = useParams<{ id: string }>()
  return (
    <div>
      <div className="mb-8">
        <h1 className="heading-md">Edit Blog Post</h1>
        <p className="text-body text-sm mt-1">Update post content, publishing state, and SEO.</p>
      </div>
      <BlogForm mode="edit" postId={id} />
    </div>
  )
}