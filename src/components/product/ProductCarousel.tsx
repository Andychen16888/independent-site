"use client"

import { useRef } from "react"
import { Link } from "@/i18n/navigation"
import { useTranslations } from "next-intl"
import { Container } from "@/components/ui/Container"
import { ProductCard } from "./ProductCard"
import { HiOutlineArrowLeft, HiOutlineArrowRight } from "react-icons/hi2"

interface ProductCarouselProps {
  title: string
  subtitle?: string
  products: {
    id: string
    name: string
    slug: string
    unitPrice: number | null
    originalPrice?: number | null
    stock: number
    isNew?: boolean
    isBestSeller?: boolean
    images?: { url: string; alt?: string | null }[]
  }[]
}

export function ProductCarousel({ title, subtitle, products }: ProductCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const t = useTranslations("product.carousel")
  const tc = useTranslations("common")

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 320
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      })
    }
  }

  return (
    <section className="section-padding bg-ivory">
      <Container>
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="heading-lg">{title}</h2>
            {subtitle && <p className="text-body mt-2">{subtitle}</p>}
          </div>
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => scroll("left")}
              className="p-2 rounded-md border border-charcoal/20 hover:bg-charcoal hover:text-white transition-colors"
              aria-label={t("scrollLeft")}
            >
              <HiOutlineArrowLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll("right")}
              className="p-2 rounded-md border border-charcoal/20 hover:bg-charcoal hover:text-white transition-colors"
              aria-label={t("scrollRight")}
            >
              <HiOutlineArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Container>

      <div className="relative">
        <div
          ref={scrollRef}
          className="flex gap-5 overflow-x-auto px-4 md:px-8 scrollbar-hide snap-x snap-mandatory"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {products.map((product) => (
            <div key={product.id} className="min-w-[260px] md:min-w-[280px] snap-start">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>

      <Container>
        <div className="text-center mt-12">
          <Link href="/products" className="btn-outline">
            {tc("viewAllProducts")}
          </Link>
        </div>
      </Container>
    </section>
  )
}
