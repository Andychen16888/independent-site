"use client"

import Link from "next/link"
import { Container } from "@/components/ui/Container"

export function SEOSection() {
  return (
    <section className="py-12 md:py-16 bg-ivory border-t border-mist">
      <Container>
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="heading-sm mb-4">
            Premium Peptide Skincare & Artisanal Home Decor
          </h2>
          <div className="text-body text-sm space-y-3 max-w-3xl mx-auto">
            <p>
              Oriental Beauty brings you the finest in peptide skincare and handcrafted 
              oriental home decor. Our peptide-infused serums, masks, and treatments 
              combine cutting-edge biotechnology with traditional Eastern botanical wisdom. 
              Each product is formulated with multi-weight peptides, fermented Asian 
              botanicals, and clean, sustainable ingredients.
            </p>
            <p>
              Explore our curated collection of artisanal home objects — hand-thrown 
              ceramics from ancient Japanese kilns, carved teakwood pieces, handwoven 
              silk textiles, and mindful decor objects that bring warmth and intention 
              to your living space.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-6 mt-8 text-xs text-stone">
            <Link href="/categories/beauty" className="hover:text-charcoal transition-colors underline underline-offset-4 decoration-mist hover:decoration-charcoal">
              Peptide Skincare
            </Link>
            <Link href="/categories/beauty" className="hover:text-charcoal transition-colors underline underline-offset-4 decoration-mist hover:decoration-charcoal">
              Face Serums
            </Link>
            <Link href="/categories/beauty" className="hover:text-charcoal transition-colors underline underline-offset-4 decoration-mist hover:decoration-charcoal">
              Sheet Masks
            </Link>
            <Link href="/categories/handmade-living" className="hover:text-charcoal transition-colors underline underline-offset-4 decoration-mist hover:decoration-charcoal">
              Handmade Ceramics
            </Link>
            <Link href="/categories/handmade-living" className="hover:text-charcoal transition-colors underline underline-offset-4 decoration-mist hover:decoration-charcoal">
              Oriental Home Decor
            </Link>
            <Link href="/blog" className="hover:text-charcoal transition-colors underline underline-offset-4 decoration-mist hover:decoration-charcoal">
              Beauty Journal
            </Link>
          </div>
        </div>
      </Container>
    </section>
  )
}
