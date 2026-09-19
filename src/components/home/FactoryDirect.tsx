"use client"

import { Link } from "@/i18n/navigation"
import { motion } from "framer-motion"
import { Container } from "@/components/ui/Container"

export interface FeatureItem { title: string; description: string }

export interface PromoContent {
  eyebrow?: string
  title: string
  body?: string
  features?: FeatureItem[]
  image?: string
  ctaLabel?: string
  ctaHref?: string
}

export const DEFAULT_PROMO: PromoContent = {
  eyebrow: "Why Buy Direct",
  title: "Factory-Direct Electronics",
  body: "We partner with certified manufacturers across China to bring you quality electronics at wholesale prices — tested, documented, and shipped worldwide.",
  features: [
    {
      title: "Certified Quality",
      description: "CE, FCC, and RoHS certified products verified before shipment",
    },
    {
      title: "Factory-Direct Pricing",
      description: "Wholesale rates without middlemen or retail markups",
    },
    {
      title: "Low MOQ Options",
      description: "Start small with standard SKUs, scale up as you grow",
    },
    {
      title: "Global Logistics",
      description: "Air and sea freight options with tracking to your door",
    },
  ],
  ctaLabel: "View All Products",
  ctaHref: "/products",
}

export function PromoFeatureSection({ promo = DEFAULT_PROMO }: { promo?: PromoContent }) {
  const safe = promo.title ? promo : DEFAULT_PROMO
  const features = safe.features || []

  return (
    <section className="section-padding bg-ivory">
      <Container>
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            {safe.eyebrow && <span className="text-caption mb-4 block">{safe.eyebrow}</span>}
            <h2 className="heading-lg mb-6">{safe.title}</h2>
            {safe.body && <p className="text-body mb-10 max-w-lg">{safe.body}</p>}

            {features.length > 0 && (
              <div className="space-y-8">
                {features.map((feature, index) => (
                  <motion.div
                    key={feature.title + index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex gap-4"
                  >
                    <span className="text-gold text-sm font-serif">{(index + 1).toString().padStart(2, "0")}</span>
                    <div>
                      <h4 className="font-serif text-lg mb-1">{feature.title}</h4>
                      <p className="text-body text-sm">{feature.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {safe.ctaLabel && safe.ctaHref && (
              <Link href={safe.ctaHref} className="btn-primary mt-10 inline-flex">
                {safe.ctaLabel}
              </Link>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative aspect-[3/4] bg-mist"
          >
            {safe.image && <img src={safe.image} alt="" className="absolute inset-0 w-full h-full object-cover" />}
            <div className="absolute inset-0 bg-gradient-to-t from-ivory/20 to-transparent" />
            <div className="absolute top-8 left-8 right-8 bottom-8 border border-white/20" />
          </motion.div>
        </div>
      </Container>
    </section>
  )
}