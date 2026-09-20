"use client"

import { useParams } from "next/navigation"
import BannerForm from "@/components/admin/BannerForm"
import { bi } from "@/components/admin/bilingual"

export default function EditBannerPage() {
  const { id } = useParams<{ id: string }>()
  return (
    <div>
      <div className="mb-8">
        <h1 className="heading-md">{bi("Edit Banner", "编辑横幅")}</h1>
        <p className="text-body text-sm mt-1">{bi("Update banner content, image, alignment, and link.", "更新横幅内容、图片、对齐方式与链接。")}</p>
      </div>
      <BannerForm mode="edit" bannerId={id} />
    </div>
  )
}
