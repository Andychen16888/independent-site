"use client"

import { useWishlistStore } from "@/stores/wishlist-store"

export function WishlistContent() {
  const { items } = useWishlistStore()

  if (items.length === 0) {
    return (
      <div className="bg-cream p-12 text-center">
        <p className="text-body text-sm">Your wishlist is empty</p>
      </div>
    )
  }

  return (
    <div className="product-grid">
      {items.map((id) => (
        <div key={id} className="aspect-[3/4] bg-mist flex items-center justify-center text-xs text-stone">
          Product {id.slice(0, 8)}
        </div>
      ))}
    </div>
  )
}
