export default function AdminBlogPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="heading-md">Blog Posts</h1>
          <p className="text-body text-sm mt-1">Manage your journal content.</p>
        </div>
        <button className="btn-primary text-xs">New Post</button>
      </div>
      <div className="bg-white border border-mist p-12 text-center text-sm text-stone">
        No posts yet.
      </div>
    </div>
  )
}
