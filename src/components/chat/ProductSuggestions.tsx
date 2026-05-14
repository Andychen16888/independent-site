"use client"

import Link from "next/link"
import { useCartStore } from "@/stores/cart-store"
import { formatPrice } from "@/lib/utils/format"
import { toast } from "react-hot-toast"

const featuredProducts = [
  {
    id: "p1", name: "Peptide Hydration Serum", slug: "peptide-hydration-serum",
    price: 78, image: null, tag: "Best Seller",
  },
  {
    id: "p2", name: "Artisan Tea Ceremony Set", slug: "artisan-tea-ceremony-set",
    price: 120, image: null, tag: "Handmade",
  },
  {
    id: "p3", name: "Overnight Recovery Mask", slug: "overnight-recovery-mask",
    price: 85, image: null, tag: "Popular",
  },
]

export function ProductSuggestions() {
  const addItem = useCartStore((s) => s.addItem)

  const handleQuickAdd = (product: typeof featuredProducts[0]) => {
    addItem({
      id: `${product.id}-quick`,
      productId: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      image: "",
      quantity: 1,
      stock: 99,
    })
    toast.success(`${product.name} added to cart!`)
  }

  return (
    <div className="pt-4 border-t border-mist">
      <p className="text-xs text-stone tracking-wider uppercase mb-3">Popular Products</p>
      <div className="space-y-2">
        {featuredProducts.map((product) => (
          <div key={product.id} className="flex items-center gap-3 bg-cream p-2.5 group">
            <div className="w-10 h-10 bg-mist flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <Link href={`/products/${product.slug}`} className="text-xs font-medium hover:text-stone transition-colors block truncate">
                {product.name}
              </Link>
              <div className="flex items-center gap-2">
                <span className="text-xs text-stone">{formatPrice(product.price)}</span>
                {product.tag && (
                  <span className="text-[9px] text-sage tracking-wider uppercase">{product.tag}</span>
                )}
              </div>
            </div>
            <button
              onClick={() => handleQuickAdd(product)}
              className="text-[10px] tracking-wider uppercase px-2.5 py-1.5 bg-charcoal text-ivory hover:bg-charcoal/90 transition-colors whitespace-nowrap opacity-0 group-hover:opacity-100"
            >
              Add
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
