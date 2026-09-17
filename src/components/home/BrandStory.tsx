"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Container } from "@/components/ui/Container"

export interface BrandStoryContent {
  eyebrow?: string
  title: string
  paragraphs?: string[]
  image?: string
  ctaLabel?: string
  ctaHref?: string
}

const DEFAULT_BRAND_STORY: BrandStoryContent = {
  eyebrow: "Our Story",
  title: "Quality Goods, Direct from the Source",
  paragraphs: [
    "Commodities From China was founded on a simple belief — that quality goods should move directly from Chinese makers to buyers around the world, without unnecessary layers and markup.",
    "We build long-term partnerships with certified manufacturers across China — from electronics factories in Shenzhen to kitchenware producers in Guangzhou — and inspect every batch before it ships.",
  ],
  ctaLabel: "Read Our Story",
  ctaHref: "/pages/about",
}

export function BrandStory({ content = DEFAULT_BRAND_STORY }: { content?: BrandStoryContent }) {
  const safe = content.title ? content : DEFAULT_BRAND_STORY
  const paragraphs = safe.paragraphs || []

  return (
    <section className="section-padding bg-ivory">
      <Container>
        <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
          >
            {safe.eyebrow && <span className="text-caption mb-4 block">{safe.eyebrow}</span>}
            <h2 className="heading-lg mb-6">{safe.title}</h2>
            {paragraphs.map((p, i) => (
              <p key={i} className="text-body mb-6">{p}</p>
            ))}
            {safe.ctaLabel && safe.ctaHref && (
              <Link href={safe.ctaHref} className="btn-outline inline-flex">
                {safe.ctaLabel}
              </Link>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative aspect-[4/5] bg-mist"
          >
            {safe.image && <img src={safe.image} alt="" className="absolute inset-0 w-full h-full object-cover" />}
            <div className="absolute inset-0 bg-gradient-to-tr from-charcoal/5 to-transparent" />
            <div className="absolute -bottom-4 -left-4 w-24 h-24 border border-sage/30" />
            <div className="absolute -top-4 -right-4 w-32 h-32 border border-blush/30" />
          </motion.div>
        </div>
      </Container>
    </section>
  )
}