"use client"

import { ProductCard } from "./ProductCard"
import { useTranslations } from "next-intl"

interface ProductGridProps {
  products: any[]
}

export function ProductGrid({ products }: ProductGridProps) {
  const tc = useTranslations("common")
  if (products.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-body">{tc("noProductsFound")}</p>
      </div>
    )
  }

  return (
    <div className="product-grid">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
