"use client"

import { useParams } from "next/navigation"
import BannerForm from "@/components/admin/BannerForm"

export default function EditBannerPage() {
  const { id } = useParams<{ id: string }>()
  return (
    <div>
      <div className="mb-8">
        <h1 className="heading-md">Edit Banner</h1>
        <p className="text-body text-sm mt-1">Update banner content, image, alignment, and link.</p>
      </div>
      <BannerForm mode="edit" bannerId={id} />
    </div>
  )
}