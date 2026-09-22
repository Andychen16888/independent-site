import Link from "next/link"
import { prisma } from "@/lib/db/prisma"
import { bi } from "@/components/admin/bilingual"
import PageForm from "@/components/admin/PageForm"

export default async function SlugPageEditor({ slug }: { slug: string }) {
  const page = await prisma.page.findUnique({ where: { slug } })

  if (!page) {
    return (
      <div className="bg-white border border-mist p-12 text-center">
        <p className="text-sm text-stone mb-4">
          {bi(
            `No page with slug "/${slug}" found. It may have been deleted from the Pages screen.`,
            `未找到 slug 为 "/${slug}" 的页面，可能已在“页面”中被删除。`
          )}
        </p>
        <Link href="/admin/pages" className="btn-primary text-xs">
          {bi("Go to Pages", "前往页面管理")}
        </Link>
      </div>
    )
  }

  return <PageForm mode="edit" pageId={page.id} redirectTo={`/admin/${slug}`} cancelTo="/admin/pages" />
}