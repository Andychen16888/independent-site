"use client"

import { useState } from "react"
import { Container } from "@/components/ui/Container"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { ImageZoom } from "./ImageZoom"
import { FrequentlyBoughtTogether } from "./FrequentlyBoughtTogether"
import { ProductReviews } from "./ProductReviews"
import { useCartStore } from "@/stores/cart-store"
import { useWishlistStore } from "@/stores/wishlist-store"
import { formatPrice, getDiscountPercentage } from "@/lib/utils/format"
import { HiOutlineMinus, HiOutlinePlus, HiOutlineTruck, HiOutlineShieldCheck, HiOutlineArrowPath, HiHeart, HiOutlineHeart, HiPlay } from "react-icons/hi2"

interface ProductDetailProps {
  product: {
    id: string
    name: string
    slug: string
    sku: string
    brand?: string | null
    unitPrice: number
    originalPrice?: number | null
    currency?: string
    stock: number
    description: string
    shortDescription?: string | null
    images?: { url: string; alt?: string | null; isPrimary?: boolean }[]
    videos?: { url: string; title?: string | null }[]
    parameters?: { name: string; value: string }[]
  }
}

export function ProductDetail({ product }: ProductDetailProps) {
  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState(0)
  const [isPlayingVideo, setIsPlayingVideo] = useState(false)
  const addItem = useCartStore((s) => s.addItem)
  const toggleItem = useWishlistStore((s) => s.toggleItem)
  const isInWishlist = useWishlistStore((s) => s.isInWishlist)

  const discount = product.originalPrice
    ? getDiscountPercentage(Number(product.originalPrice), Number(product.unitPrice))
    : 0

  const mainImage = product.images?.[selectedImage]?.url

  const handleAddToCart = () => {
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
    { id: "bundle-1", name: "Rice Bran Peptide Mask", slug: "rice-bran-peptide-mask", price: 45 },
    { id: "bundle-2", name: "Ginseng Peptide Eye Cream", slug: "ginseng-peptide-eye-cream", price: 62 },
  ]

  return (
    <Container>
      <div className="grid md:grid-cols-2 gap-8 lg:gap-16 mb-16">
        <div className="space-y-4">
          {isPlayingVideo && product.videos?.[0] ? (
            <div className="aspect-[4/5] bg-black relative">
              <video
                src={product.videos[0].url}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
              <button
                onClick={() => setIsPlayingVideo(false)}
                className="absolute top-4 right-4 p-2 bg-ivory/80 hover:bg-ivory text-sm"
              >
                Close
              </button>
            </div>
          ) : (
            <ImageZoom
              src={mainImage}
              alt={product.name}
            />
          )}

          <div className="flex gap-3 overflow-x-auto pb-2">
            {product.images?.map((img, i) => (
              <button
                key={i}
                onClick={() => { setSelectedImage(i); setIsPlayingVideo(false) }}
                className={`flex-shrink-0 w-20 h-20 border-2 transition-colors overflow-hidden ${
                  i === selectedImage ? "border-charcoal" : "border-transparent hover:border-mist"
                }`}
              >
                <div className="w-full h-full bg-mist" />
              </button>
            ))}
            {product.videos?.map((video, i) => (
              <button
                key={`video-${i}`}
                onClick={() => setIsPlayingVideo(true)}
                className="flex-shrink-0 w-20 h-20 bg-charcoal border-2 border-transparent hover:border-charcoal flex items-center justify-center"
              >
                <HiPlay className="w-6 h-6 text-ivory" />
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
            <p className="text-body mb-6">{product.shortDescription}</p>
          )}

          <div className="flex items-baseline gap-3 mb-8">
            <span className="text-2xl font-serif">
              {formatPrice(Number(product.unitPrice), product.currency)}
            </span>
            {product.originalPrice && Number(product.originalPrice) > Number(product.unitPrice) && (
              <>
                <span className="text-lg text-stone line-through">
                  {formatPrice(Number(product.originalPrice), product.currency)}
                </span>
                <span className="text-sm text-rosegold">Save {discount}%</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-4 mb-8">
            <div className="flex items-center border border-charcoal/20">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-3 hover:bg-mist transition-colors"
                aria-label="Decrease quantity"
              >
                <HiOutlineMinus className="w-4 h-4" />
              </button>
              <span className="px-4 text-sm min-w-[40px] text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                className="p-3 hover:bg-mist transition-colors"
                aria-label="Increase quantity"
              >
                <HiOutlinePlus className="w-4 h-4" />
              </button>
            </div>
            <span className="text-xs text-stone">
              {product.stock > 0 ? `${product.stock} in stock` : "Sold out"}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <Button onClick={handleAddToCart} disabled={product.stock <= 0} size="lg" className="flex-1">
              {product.stock <= 0 ? "Sold Out" : "Add to Cart"}
            </Button>
            <button
              onClick={() => toggleItem(product.id)}
              className={`btn-outline px-4 ${
                isInWishlist(product.id) ? "text-rosegold border-rosegold" : ""
              }`}
            >
              {isInWishlist(product.id) ? <HiHeart className="w-5 h-5" /> : <HiOutlineHeart className="w-5 h-5" />}
            </button>
          </div>

          <div className="space-y-4 py-6 border-t border-mist text-sm text-stone">
            <div className="flex items-center gap-3">
              <HiOutlineTruck className="w-5 h-5" />
              <span>Free shipping on orders over $100</span>
            </div>
            <div className="flex items-center gap-3">
              <HiOutlineArrowPath className="w-5 h-5" />
              <span>30-day easy returns</span>
            </div>
            <div className="flex items-center gap-3">
              <HiOutlineShieldCheck className="w-5 h-5" />
              <span>Secure checkout with Stripe & PayPal</span>
            </div>
          </div>

          <div className="mt-6">
            <p className="text-xs text-stone mb-2">SKU: {product.sku}</p>
          </div>

          <details className="mt-6 border-t border-mist pt-6">
            <summary className="text-sm tracking-widest uppercase cursor-pointer text-charcoal hover:text-stone transition-colors">
              Description
            </summary>
            <p className="text-body mt-4 leading-relaxed">{product.description}</p>
          </details>

          {product.parameters && product.parameters.length > 0 && (
            <details className="mt-4 border-t border-mist pt-6">
              <summary className="text-sm tracking-widest uppercase cursor-pointer text-charcoal hover:text-stone transition-colors">
                Product Details
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
        </div>

        <div className="mb-16">
          <FrequentlyBoughtTogether
            mainProduct={{
              id: product.id,
              name: product.name,
              slug: product.slug,
              unitPrice: Number(product.unitPrice),
            }}
            bundleItems={bundleItems}
          />
        </div>

        <div className="mb-16">
          <ProductReviews
            reviews={[
              {
                id: "r1", rating: 5, title: "Absolutely love it",
                content: "This serum has transformed my skin! I've been using it for 3 weeks and the results are incredible.",
                isVerified: true,
                user: { firstName: "Sarah" },
                createdAt: new Date("2026-04-20"),
              },
              {
                id: "r2", rating: 4, title: "Great product",
                content: "Really high quality. My skin feels noticeably smoother and more hydrated.",
                isVerified: true,
                user: { firstName: "Emily" },
                createdAt: new Date("2026-04-15"),
              },
              {
                id: "r3", rating: 5, title: "Worth every penny",
                content: "I've tried many peptide serums and this is by far the best. The texture is amazing.",
                isVerified: false,
                user: { firstName: "Jessica" },
                createdAt: new Date("2026-04-10"),
              },
            ]}
            stats={{ average: 4.7, total: 3, distribution: { 5: 2, 4: 1, 3: 0, 2: 0, 1: 0 } }}
          />
        </div>
      </div>
    </Container>
  )
}
