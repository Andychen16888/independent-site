import Link from "next/link"
import { prisma } from "@/lib/db/prisma"
import { formatDateShort, truncate } from "@/lib/utils/format"
import { bi } from "@/components/admin/bilingual"
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
          <h1 className="heading-md">{bi("Blog Posts", "博客文章")}</h1>
          <p className="text-body text-sm mt-1">{bi("Manage your journal content.", "管理博客内容。")} ({posts.length} {bi("total", "总计")})</p>
        </div>
        <Link href="/admin/blog/new" className="btn-primary text-xs">{bi("New Post", "新建文章")}</Link>
      </div>

      {posts.length === 0 ? (
        <div className="bg-white border border-mist p-12 text-center text-sm text-stone">{bi("No posts yet.", "暂无文章。")}</div>
      ) : (
        <div className="bg-white border border-mist overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-mist text-left">
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">{bi("Title", "标题")}</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">{bi("Author", "作者")}</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">{bi("Comments", "评论")}</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">{bi("Status", "状态")}</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">{bi("Published", "发布时间")}</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">{bi("Actions", "操作")}</th>
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
                      {post.isPublished ? bi("Published", "已发布") : bi("Draft", "草稿")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-stone">
                    {post.publishedAt ? formatDateShort(post.publishedAt) : "-"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 text-[10px]">
                      <Link href={`/admin/blog/${post.id}`} className="btn-outline px-2 py-1.5 inline-flex items-center gap-1">{bi("Edit", "编辑")}</Link>
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
