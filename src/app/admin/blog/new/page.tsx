import BlogForm from "@/components/admin/BlogForm"

export const metadata = {
  title: "New Blog Post",
}

export default function NewBlogPostPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="heading-md">New Blog Post</h1>
        <p className="text-body text-sm mt-1">Create a new journal entry — visible at /blog/{`{slug}`}.</p>
      </div>
      <BlogForm mode="new" />
    </div>
  )
}