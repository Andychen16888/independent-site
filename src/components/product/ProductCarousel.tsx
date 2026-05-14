"use client"

import { useEffect, useState, useRef } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Container } from "@/components/ui/Container"
import { ProductCard } from "./ProductCard"
import { HiOutlineArrowLeft, HiOutlineArrowRight } from "react-icons/hi2"

interface ProductCarouselProps {
  title: string
  subtitle?: string
  filter?: "bestseller" | "newest" | "featured"
  categorySlug?: string
}

// Temporary mock data — will be replaced with server-side fetching
const mockProducts = [
  {
    id: "1",
    name: "Peptide Hydration Serum",
    slug: "peptide-hydration-serum",
    unitPrice: 78,
    originalPrice: 98,
    stock: 15,
    isNew: true,
    isBestSeller: true,
    images: [],
  },
  {
    id: "2",
    name: "Overnight Recovery Mask",
    slug: "overnight-recovery-mask",
    unitPrice: 85,
    stock: 20,
    isNew: false,
    isBestSeller: true,
    images: [],
  },
  {
    id: "3",
    name: "Artisan Tea Ceremony Set",
    slug: "artisan-tea-ceremony-set",
    unitPrice: 120,
    originalPrice: 150,
    stock: 8,
    isNew: true,
    isBestSeller: false,
    images: [],
  },
  {
    id: "4",
    name: "Rice Bran Peptide Mask",
    slug: "rice-bran-peptide-mask",
    unitPrice: 45,
    stock: 30,
    isNew: false,
    isBestSeller: true,
    images: [],
  },
  {
    id: "5",
    name: "Hand-thrown Ceramic Vase",
    slug: "hand-thrown-ceramic-vase",
    unitPrice: 95,
    stock: 5,
    isNew: true,
    isBestSeller: false,
    images: [],
  },
  {
    id: "6",
    name: "Silk Sleep Set",
    slug: "silk-sleep-set",
    unitPrice: 165,
    stock: 10,
    isNew: false,
    isBestSeller: false,
    images: [],
  },
  {
    id: "7",
    name: "Ginseng Peptide Eye Cream",
    slug: "ginseng-peptide-eye-cream",
    unitPrice: 62,
    stock: 18,
    isNew: false,
    isBestSeller: true,
    images: [],
  },
  {
    id: "8",
    name: "Bamboo Carved Wall Art",
    slug: "bamboo-carved-wall-art",
    unitPrice: 140,
    originalPrice: 180,
    stock: 3,
    isNew: true,
    isBestSeller: false,
    images: [],
  },
]

export function ProductCarousel({ title, subtitle, filter }: ProductCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

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
              className="p-2 border border-charcoal/20 hover:bg-charcoal hover:text-white transition-colors"
              aria-label="Scroll left"
            >
              <HiOutlineArrowLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll("right")}
              className="p-2 border border-charcoal/20 hover:bg-charcoal hover:text-white transition-colors"
              aria-label="Scroll right"
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
          {mockProducts.map((product) => (
            <div key={product.id} className="min-w-[260px] md:min-w-[280px] snap-start">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>

      <Container>
        <div className="text-center mt-12">
          <Link href="/products" className="btn-outline">
            View All Products
          </Link>
        </div>
      </Container>
    </section>
  )
}
