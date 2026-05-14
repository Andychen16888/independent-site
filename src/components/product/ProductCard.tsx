"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { useWishlistStore } from "@/stores/wishlist-store"
import { Badge } from "@/components/ui/Badge"
import { cn } from "@/lib/utils/cn"
import { getDiscountPercentage } from "@/lib/utils/format"
import { HiOutlineHeart, HiHeart } from "react-icons/hi2"

interface ProductCardProps {
  product: {
    id: string
    name: string
    slug: string
    unitPrice: number
    originalPrice?: number | null
    stock: number
    images?: { url: string; alt?: string | null }[]
    isNew?: boolean
    isBestSeller?: boolean
  }
  priority?: boolean
}

export function ProductCard({ product, priority }: ProductCardProps) {
  const { isInWishlist, toggleItem } = useWishlistStore()
  const discount = product.originalPrice
    ? getDiscountPercentage(Number(product.originalPrice), Number(product.unitPrice))
    : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group"
    >
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative aspect-[3/4] bg-mist mb-4 overflow-hidden">
          {product.images?.[0]?.url ? (
            <img
              src={product.images[0].url}
              alt={product.images[0].alt || product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              loading={priority ? "eager" : "lazy"}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-stone/30 text-xs tracking-wider uppercase">
              Image
            </div>
          )}

          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {discount > 0 && <Badge variant="sale">-{discount}%</Badge>}
            {product.isNew && <Badge variant="new">New</Badge>}
            {product.isBestSeller && <Badge variant="best">Best</Badge>}
          </div>

          {product.stock <= 0 && (
            <div className="absolute inset-0 bg-ivory/60 flex items-center justify-center">
              <span className="text-xs tracking-widest uppercase text-charcoal">Sold Out</span>
            </div>
          )}

          <button
            onClick={(e) => {
              e.preventDefault()
              toggleItem(product.id)
            }}
            className={cn(
              "absolute top-3 right-3 p-2 transition-all duration-300",
              isInWishlist(product.id)
                ? "text-rosegold"
                : "text-stone/60 hover:text-charcoal opacity-0 group-hover:opacity-100"
            )}
            aria-label="Add to wishlist"
          >
            {isInWishlist(product.id) ? (
              <HiHeart className="w-5 h-5" />
            ) : (
              <HiOutlineHeart className="w-5 h-5" />
            )}
          </button>
        </div>
      </Link>

      <Link href={`/products/${product.slug}`} className="block">
        <h3 className="font-serif text-sm md:text-base leading-tight group-hover:text-stone transition-colors">
          {product.name}
        </h3>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-sm">${Number(product.unitPrice).toFixed(2)}</span>
          {product.originalPrice && Number(product.originalPrice) > Number(product.unitPrice) && (
            <span className="text-sm text-stone line-through">
              ${Number(product.originalPrice).toFixed(2)}
            </span>
          )}
        </div>
      </Link>
    </motion.div>
  )
}
