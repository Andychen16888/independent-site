"use client"

import { useTranslations } from "next-intl"
import { useWishlistStore } from "@/stores/wishlist-store"

export function WishlistContent() {
  const { items } = useWishlistStore()
  const t = useTranslations("wishlist")

  if (items.length === 0) {
    return (
      <div className="bg-cream p-12 text-center">
        <p className="text-body text-sm">{t("empty")}</p>
      </div>
    )
  }

  return (
    <div className="product-grid">
      {items.map((id) => (
        <div key={id} className="aspect-[3/4] bg-mist flex items-center justify-center text-xs text-stone">
          {t("title")} {id.slice(0, 8)}
        </div>
      ))}
    </div>
  )
}