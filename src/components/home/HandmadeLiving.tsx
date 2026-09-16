"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Container } from "@/components/ui/Container"

export interface CollectionItem { title: string; description?: string; href: string }

export interface CollectionContent {
  eyebrow?: string
  title: string
  tagline?: string
  collections?: CollectionItem[]
  ctaLabel?: string
  ctaHref?: string
}

const DEFAULT_COLLECTIONS: CollectionContent = {
  eyebrow: "Craftsmanship",
  title: "Handmade Living",
  tagline: "Objects that bring warmth, story, and intention into your home",
  collections: [
    { title: "Ceramics", description: "Hand-thrown pottery from ancient kilns", href: "/categories/handmade-living?sub=ceramics" },
    { title: "Woodcraft", description: "Carved teak and bamboo art pieces", href: "/categories/handmade-living?sub=woodcraft" },
    { title: "Textiles", description: "Handwoven silk and linen home goods", href: "/categories/handmade-living?sub=textiles" },
    { title: "Decor", description: "Curated objects for mindful spaces", href: "/categories/handmade-living?sub=decor" },
  ],
  ctaLabel: "Explore All Collections",
  ctaHref: "/categories/handmade-living",
}

export function CollectionGallerySection({ content = DEFAULT_COLLECTIONS }: { content?: CollectionContent }) {
  const safe = content.title ? content : DEFAULT_COLLECTIONS
  const collections = safe.collections || []

  return (
    <section className="section-padding bg-cream overflow-hidden">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="section-title"
        >
          {safe.eyebrow && <span className="text-caption mb-4 block">{safe.eyebrow}</span>}
          <h2>{safe.title}</h2>
          {safe.tagline && <p>{safe.tagline}</p>}
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {collections.map((item, index) => (
            <motion.div
              key={item.title + index}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Link
                href={item.href}
                className="group block relative aspect-[3/4] bg-mist overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute inset-0 flex flex-col justify-end p-6">
                  <h3 className="font-serif text-lg text-ivory translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                    {item.title}
                  </h3>
                  {item.description && (
                    <p className="text-xs text-ivory/70 mt-1 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 delay-75">
                      {item.description}
                    </p>
                  )}
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {safe.ctaLabel && safe.ctaHref && (
          <div className="text-center mt-12">
            <Link href={safe.ctaHref} className="btn-outline inline-flex">
              {safe.ctaLabel}
            </Link>
          </div>
        )}
      </Container>
    </section>
  )
}