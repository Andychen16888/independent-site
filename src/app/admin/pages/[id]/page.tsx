"use client"

import { useParams } from "next/navigation"
import PageForm from "@/components/admin/PageForm"

export default function EditPagePage() {
  const { id } = useParams<{ id: string }>()
  return (
    <div>
      <div className="mb-8">
        <h1 className="heading-md">Edit Page</h1>
        <p className="text-body text-sm mt-1">Update page content, publishing state, and SEO.</p>
      </div>
      <PageForm mode="edit" pageId={id} />
    </div>
  )
}