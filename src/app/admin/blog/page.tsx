import Link from "next/link"
import { prisma } from "@/lib/db/prisma"
import { formatDateShort, truncate } from "@/lib/utils/format"
import DeleteBlogButton from "@/components/admin/DeleteBlogButton"

export const dynamic = "force-dynamic"

async function getPosts() {
  try {
    return await prisma.blogPost.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { comments: true } } },
    })
  } catch (error) {
    console.error("Failed to fetch blog posts:", error)
    return []
  }
}

export default async function AdminBlogPage() {
  const posts = await getPosts()

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="heading-md">Blog Posts</h1>
          <p className="text-body text-sm mt-1">Manage your journal content. ({posts.length} total)</p>
        </div>
        <Link href="/admin/blog/new" className="btn-primary text-xs">New Post</Link>
      </div>

      {posts.length === 0 ? (
        <div className="bg-white border border-mist p-12 text-center text-sm text-stone">No posts yet.</div>
      ) : (
        <div className="bg-white border border-mist overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-mist text-left">
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">Title</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">Author</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">Comments</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">Status</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">Published</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id} className="border-b border-mist/50 hover:bg-ivory/50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium truncate max-w-[280px]">{truncate(post.title, 60)}</p>
                    <span className="text-[10px] text-stone">/{post.slug}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-stone">{post.author}</td>
                  <td className="px-4 py-3 text-xs text-stone">{post._count.comments}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] uppercase tracking-wider px-2 py-1 ${
                      post.isPublished ? "bg-sage/10 text-sage" : "bg-stone/10 text-stone"
                    }`}>
                      {post.isPublished ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-stone">
                    {post.publishedAt ? formatDateShort(post.publishedAt) : "-"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 text-[10px]">
                      <Link href={`/admin/blog/${post.id}`} className="btn-outline px-2 py-1.5 inline-flex items-center gap-1">Edit</Link>
                      <DeleteBlogButton id={post.id} title={post.title} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
