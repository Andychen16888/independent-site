"use client"

import { useParams } from "next/navigation"
import PageForm from "@/components/admin/PageForm"
import { bi } from "@/components/admin/bilingual"

export default function EditPagePage() {
  const { id } = useParams<{ id: string }>()
  return (
    <div>
      <div className="mb-8">
        <h1 className="heading-md">{bi("Edit Page", "编辑页面")}</h1>
        <p className="text-body text-sm mt-1">{bi("Update page content, publishing state, and SEO.", "更新页面内容、发布状态和 SEO。")}</p>
      </div>
      <PageForm mode="edit" pageId={id} />
    </div>
  )
}
