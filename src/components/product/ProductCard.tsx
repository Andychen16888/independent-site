"use client"

import { Link } from "@/i18n/navigation"
import { motion } from "framer-motion"
import { useLocale, useTranslations } from "next-intl"
import { useWishlistStore } from "@/stores/wishlist-store"
import { Badge } from "@/components/ui/Badge"
import { cn } from "@/lib/utils/cn"
import { getDiscountPercentage, formatPrice } from "@/lib/utils/format"
import { HiOutlineHeart, HiHeart } from "react-icons/hi2"

interface ProductCardProps {
  product: {
    id: string
    name: string
    slug: string
    unitPrice: number
    originalPrice?: number | null
    stock: number
    currency?: string
    images?: { url: string; alt?: string | null }[]
    isNew?: boolean
    isBestSeller?: boolean
  }
  priority?: boolean
}

export function ProductCard({ product, priority }: ProductCardProps) {
  const { isInWishlist, toggleItem } = useWishlistStore()
  const t = useTranslations("product")
  const tc = useTranslations("common")
  const locale = useLocale()
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
        <div className="relative aspect-[3/4] bg-mist rounded-lg mb-4 overflow-hidden">
          {product.images?.[0]?.url ? (
            <img
              src={product.images[0].url}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              loading={priority ? "eager" : "lazy"}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-stone/30 text-xs tracking-wider uppercase">
              {tc("imagePlaceholder")}
            </div>
          )}

          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {discount > 0 && <Badge variant="sale">-{discount}%</Badge>}
            {product.isNew && <Badge variant="new">{t("new")}</Badge>}
            {product.isBestSeller && <Badge variant="best">{t("best")}</Badge>}
          </div>

          {product.stock <= 0 && (
            <div className="absolute inset-0 bg-ivory/60 flex items-center justify-center">
              <span className="text-xs tracking-widest uppercase text-charcoal">{t("soldOut")}</span>
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
            aria-label={t("addToWishlist")}
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
        <h3 className="font-sans font-semibold text-sm md:text-base leading-snug group-hover:text-navy transition-colors">
          {product.name}
        </h3>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-sm">{formatPrice(product.unitPrice, product.currency || "USD", locale)}</span>
          {product.originalPrice && Number(product.originalPrice) > Number(product.unitPrice) && (
            <span className="text-sm text-stone line-through">
              {formatPrice(Number(product.originalPrice), product.currency || "USD", locale)}
            </span>
          )}
        </div>
      </Link>
    </motion.div>
  )
}
