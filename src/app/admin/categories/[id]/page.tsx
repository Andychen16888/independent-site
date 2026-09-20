"use client"

import { useParams } from "next/navigation"
import CategoryForm from "@/components/admin/CategoryForm"
import { bi } from "@/components/admin/bilingual"

export default function EditCategoryPage() {
  const { id } = useParams<{ id: string }>()
  return (
    <div>
      <div className="mb-8">
        <h1 className="heading-md">{bi("Edit Category", "编辑分类")}</h1>
        <p className="text-body text-sm mt-1">{bi("Update category details, hierarchy, flags, and SEO.", "更新分类详情、层级、标记和 SEO。")}</p>
      </div>
      <CategoryForm mode="edit" categoryId={id} />
    </div>
  )
}
