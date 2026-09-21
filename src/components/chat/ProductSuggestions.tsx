"use client"

import { useLocale, useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { useCartStore } from "@/stores/cart-store"
import { formatPrice } from "@/lib/utils/format"
import { toast } from "react-hot-toast"
import type { ChatProduct } from "./types"

export function ProductSuggestions({ products = [] }: { products?: ChatProduct[] }) {
  const addItem = useCartStore((s) => s.addItem)
  const t = useTranslations("chat")
  const tp = useTranslations("product")
  const locale = useLocale()

  if (products.length === 0) return null

  const handleQuickAdd = (product: ChatProduct) => {
    if (product.price == null) return
    addItem({
      id: product.id,
      productId: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      image: product.image || "",
      quantity: 1,
      stock: 99,
    })
    toast.success(t("addedToCart", { name: product.name }))
  }

  return (
    <div className="pt-4 border-t border-mist">
      <p className="text-xs text-stone tracking-wider uppercase mb-3">{t("popularProducts")}</p>
      <div className="space-y-2">
        {products.map((product) => (
          <div key={product.id} className="flex items-center gap-3 bg-cream p-2.5 group">
            {product.image ? (
              <img src={product.image} alt="" className="w-10 h-10 object-cover bg-mist flex-shrink-0" />
            ) : (
              <div className="w-10 h-10 bg-mist flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <Link href={`/products/${product.slug}`} className="text-xs font-medium hover:text-stone transition-colors block truncate">
                {product.name}
              </Link>
              <div className="flex items-center gap-2">
                <span className="text-xs text-stone">
                  {product.price == null ? tp("priceOnRequest") : formatPrice(product.price, undefined, locale)}
                </span>
                {product.tag && (
                  <span className="text-[10px] text-sage tracking-wider uppercase">{product.tag}</span>
                )}
              </div>
            </div>
            {product.price != null && (
              <button
                onClick={() => handleQuickAdd(product)}
                className="text-[10px] tracking-wider uppercase px-2.5 py-1.5 bg-charcoal text-ivory hover:bg-charcoal/90 transition-colors whitespace-nowrap opacity-0 group-hover:opacity-100"
              >
                {t("add")}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}