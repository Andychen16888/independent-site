import BlogForm from "@/components/admin/BlogForm"
import { bi } from "@/components/admin/bilingual"

export const metadata = {
  title: "New Blog Post",
}

export default function NewBlogPostPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="heading-md">{bi("New Blog Post", "新建博客文章")}</h1>
        <p className="text-body text-sm mt-1">{bi("Create a new journal entry — visible at /blog/{slug}.", "创建新的博客条目，发布后路径为 /blog/{slug}。")}</p>
      </div>
      <BlogForm mode="new" />
    </div>
  )
}
