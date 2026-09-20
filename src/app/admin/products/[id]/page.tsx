"use client"

import { useParams } from "next/navigation"
import ProductForm from "@/components/admin/ProductForm"
import { bi } from "@/components/admin/bilingual"

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>()

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="heading-md">{bi("Edit Product", "编辑产品")}</h1>
          <p className="text-body text-sm mt-1">{bi("Update product details, attributes, images, and SEO.", "更新产品详情、属性、图片和 SEO。")}</p>
        </div>
      </div>
      <ProductForm mode="edit" productId={id} />
    </div>
  )
}
