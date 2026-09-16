"use client"

import { useParams } from "next/navigation"
import CategoryForm from "@/components/admin/CategoryForm"

export default function EditCategoryPage() {
  const { id } = useParams<{ id: string }>()
  return (
    <div>
      <div className="mb-8">
        <h1 className="heading-md">Edit Category</h1>
        <p className="text-body text-sm mt-1">Update category details, hierarchy, flags, and SEO.</p>
      </div>
      <CategoryForm mode="edit" categoryId={id} />
    </div>
  )
}