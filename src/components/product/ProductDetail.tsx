"use client"

import { useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import { Container } from "@/components/ui/Container"
import { Button } from "@/components/ui/Button"
import { ImageZoom } from "./ImageZoom"
import { SocialShare } from "./SocialShare"
import { FrequentlyBoughtTogether } from "./FrequentlyBoughtTogether"
import { ProductReviews } from "./ProductReviews"
import { useCartStore } from "@/stores/cart-store"
import { useWishlistStore } from "@/stores/wishlist-store"
import { formatPrice, getDiscountPercentage } from "@/lib/utils/format"
import DOMPurify from "dompurify"
import { HiOutlineMinus, HiOutlinePlus, HiOutlineTruck, HiOutlineShieldCheck, HiOutlineArrowPath, HiHeart, HiOutlineHeart, HiPlay } from "react-icons/hi2"

interface ProductDetailProps {
  product: {
    id: string
    name: string
    slug: string
    sku: string
    brand?: string | null
    unitPrice: number | null
    originalPrice?: number | null
    currency?: string
    stock: number
    description: string
    shortDescription?: string | null
    images?: { url: string; alt?: string | null; isPrimary?: boolean }[]
    videos?: { url: string; title?: string | null }[]
    parameters?: { name: string; value: string }[]
    reviews?: {
      id: string
      rating: number
      title: string | null
      content: string
      isVerified: boolean
      user: { firstName: string | null; lastName: string | null }
      images?: { url: string }[]
      createdAt: Date | string
    }[]
    reviewStats?: { average: number; total: number; distribution: Record<number, number> }
  }
}

export function ProductDetail({ product }: ProductDetailProps) {
  const [quantity, setQuantity] = useState(1)
  const [selectedMedia, setSelectedMedia] = useState(0)
  const addItem = useCartStore((s) => s.addItem)
  const toggleItem = useWishlistStore((s) => s.toggleItem)
  const wishlistItems = useWishlistStore((s) => s.items)
  const t = useTranslations("product")
  const locale = useLocale()

  const hasPrice = product.unitPrice != null
  const discount =
    hasPrice && product.originalPrice
      ? getDiscountPercentage(Number(product.originalPrice), Number(product.unitPrice))
      : 0

  const allMedia = [
    ...(product.images?.map((img, i) => ({ type: "image" as const, url: img.url, alt: img.alt || product.name, index: i })) || []),
    ...(product.videos?.map((vid, i) => ({ type: "video" as const, url: vid.url, title: vid.title || t("video"), index: i })) || []),
  ]
  const currentMedia = allMedia[selectedMedia]

  const mainImage = currentMedia?.type === "image" ? currentMedia.url : product.images?.[0]?.url
  const isVideoActive = currentMedia?.type === "video"

  const handleAddToCart = () => {
    if (product.unitPrice == null) return
    addItem({
      id: `${product.id}-${Date.now()}`,
      productId: product.id,
      name: product.name,
      slug: product.slug,
      price: Number(product.unitPrice),
      image: product.images?.[0]?.url || "",
      quantity,
      stock: product.stock,
    })
  }

  const bundleItems = [
    { id: "bundle-1", name: "Portable Power Bank 20000mAh", slug: "portable-power-bank-20000mah", price: 24.5 },
    { id: "bundle-2", name: "Smart LED Strip Light Kit", slug: "smart-led-strip-light-kit", price: 15.5 },
  ]

  return (
    <Container>
      <div className="grid md:grid-cols-2 gap-8 lg:gap-16 mb-16">
        <div className="space-y-4">
          <div className="aspect-[4/5] bg-mist relative overflow-hidden">
            {isVideoActive && currentMedia ? (
              <video
                key={currentMedia.url}
                src={currentMedia.url}
                controls
                autoPlay
                className="w-full h-full object-contain bg-black"
              />
            ) : (
              <ImageZoom
                src={mainImage}
                alt={product.name}
              />
            )}
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
            {allMedia.map((media, i) => (
              <button
                key={`${media.type}-${media.index}`}
                onClick={() => setSelectedMedia(i)}
                className={`flex-shrink-0 w-20 h-20 border-2 transition-colors overflow-hidden relative ${
                  i === selectedMedia ? "border-charcoal" : "border-transparent hover:border-mist"
                }`}
              >
                {media.type === "image" ? (
                  <img
                    src={media.url}
                    alt={media.alt}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
                  />
                ) : (
                  <div className="w-full h-full bg-charcoal flex items-center justify-center">
                    <HiPlay className="w-6 h-6 text-ivory" />
                    {media.url && (
                      <video src={media.url} className="absolute inset-0 w-full h-full object-cover opacity-50" />
                    )}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col">
          {product.brand && (
            <span className="text-caption mb-2">{product.brand}</span>
          )}
          <h1 className="heading-lg mb-4">{product.name}</h1>

          {product.shortDescription && (
            <div
              className="text-body mb-6 prose prose-stone max-w-none"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(product.shortDescription) }}
            />
          )}

          <div className="flex items-baseline gap-3 mb-8">
            {hasPrice ? (
              <>
                <span className="text-2xl font-serif">
                  {formatPrice(Number(product.unitPrice), product.currency, locale)}
                </span>
                {product.originalPrice && Number(product.originalPrice) > Number(product.unitPrice) && (
                  <>
                    <span className="text-lg text-stone line-through">
                      {formatPrice(Number(product.originalPrice), product.currency, locale)}
                    </span>
                    <span className="text-sm text-rosegold">{t("savePercent", { percent: discount })}</span>
                  </>
                )}
              </>
            ) : (
              <span className="text-2xl font-serif text-stone">{t("priceOnRequest")}</span>
            )}
          </div>

          <div className="flex items-center gap-4 mb-8">
            <div className="flex items-center border border-charcoal/20">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-3 hover:bg-mist transition-colors"
                aria-label={t("decreaseQuantity")}
              >
                <HiOutlineMinus className="w-4 h-4" />
              </button>
              <span className="px-4 text-sm min-w-[40px] text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                className="p-3 hover:bg-mist transition-colors"
                aria-label={t("increaseQuantity")}
              >
                <HiOutlinePlus className="w-4 h-4" />
              </button>
            </div>
            <span className="text-xs text-stone">
              {product.stock > 0 ? t("inStock", { count: product.stock }) : t("soldOut")}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <Button onClick={handleAddToCart} disabled={product.stock <= 0 || !hasPrice} size="lg" className="flex-1">
              {!hasPrice ? t("priceOnRequest") : product.stock <= 0 ? t("soldOut") : t("addToCart")}
            </Button>
            <button
              onClick={() => toggleItem(product.id)}
              className={`btn-outline px-4 ${
                wishlistItems.includes(product.id) ? "text-rosegold border-rosegold" : ""
              }`}
            >
              {wishlistItems.includes(product.id) ? <HiHeart className="w-5 h-5" /> : <HiOutlineHeart className="w-5 h-5" />}
            </button>
          </div>

          <div className="space-y-4 py-6 border-t border-mist text-sm text-stone">
            <div className="flex items-center gap-3">
              <HiOutlineTruck className="w-5 h-5" />
              <span>{t("freeShipping")}</span>
            </div>
            <div className="flex items-center gap-3">
              <HiOutlineArrowPath className="w-5 h-5" />
              <span>{t("easyReturns")}</span>
            </div>
            <div className="flex items-center gap-3">
              <HiOutlineShieldCheck className="w-5 h-5" />
              <span>{t("secureCheckout")}</span>
            </div>
          </div>

          <div className="mt-6">
            <p className="text-xs text-stone mb-2">{t("sku", { sku: product.sku })}</p>
          </div>

          <details className="mt-6 border-t border-mist pt-6">
            <summary className="text-sm tracking-widest uppercase cursor-pointer text-charcoal hover:text-stone transition-colors">
              {t("description")}
            </summary>
            <div
              className="text-body mt-4 leading-relaxed prose prose-stone max-w-none"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(product.description) }}
            />
          </details>

          {product.parameters && product.parameters.length > 0 && (
            <details className="mt-4 border-t border-mist pt-6">
              <summary className="text-sm tracking-widest uppercase cursor-pointer text-charcoal hover:text-stone transition-colors">
                {t("productDetails")}
              </summary>
              <dl className="mt-4 space-y-3">
                {product.parameters.map((param, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <dt className="text-stone">{param.name}</dt>
                    <dd className="text-charcoal">{param.value}</dd>
                  </div>
                ))}
              </dl>
            </details>
          )}

          <div className="mt-6 pt-6 border-t border-mist">
            <SocialShare
              url={`${typeof window !== "undefined" ? window.location.origin : ""}/products/${product.slug}`}
              title={product.name}
              description={(product.shortDescription || product.description).replace(/<[^>]*>/g, "")}
              image={product.images?.[0]?.url}
            />
          </div>
        </div>

        <div className="mb-16">
          <FrequentlyBoughtTogether
            mainProduct={{
              id: product.id,
              name: product.name,
              slug: product.slug,
              unitPrice: hasPrice ? Number(product.unitPrice) : null,
              currency: product.currency,
            }}
            bundleItems={bundleItems}
          />
        </div>

        <div className="mb-16">
          <ProductReviews
            reviews={product.reviews ?? []}
            stats={product.reviewStats ?? { average: 0, total: 0, distribution: {} }}
          />
        </div>
      </div>
    </Container>
  )
}
