"use client"

import { useParams } from "next/navigation"
import ProductForm from "@/components/admin/ProductForm"

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>()

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="heading-md">Edit Product</h1>
          <p className="text-body text-sm mt-1">Update product details, attributes, images, and SEO.</p>
        </div>
      </div>
      <ProductForm mode="edit" productId={id} />
    </div>
  )
}