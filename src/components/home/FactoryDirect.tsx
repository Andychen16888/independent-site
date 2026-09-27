"use client"

import { Link } from "@/i18n/navigation"
import { motion } from "framer-motion"
import { Container } from "@/components/ui/Container"
import { SmartImage } from "@/components/ui/SmartImage"
import { aboutImages, type ImageAsset } from "@/config/images"
import { DEFAULT_PROMO, type PromoContent } from "@/lib/home-content"

export function PromoFeatureSection({
  promo = DEFAULT_PROMO,
  image,
}: {
  promo?: PromoContent
  image?: ImageAsset
}) {
  const safe = promo.title ? promo : DEFAULT_PROMO
  const features = safe.features || []
  const asset = image || aboutImages[3]

  return (
    <section className="section-padding bg-cloud">
      <Container>
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            {safe.eyebrow && <span className="eyebrow mb-4 block">{safe.eyebrow}</span>}
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
                    <span className="text-accent text-sm font-semibold tracking-wider">
                      {(index + 1).toString().padStart(2, "0")}
                    </span>
                    <div>
                      <h4 className="font-sans text-lg font-semibold mb-1">{feature.title}</h4>
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
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative aspect-[3/4] overflow-hidden rounded-lg border border-mist"
          >
            {/*
              fit="contain" keeps the whole image visible inside the fixed aspect-[3/4]
              box. The box is portrait and most uploads are landscape, so the letterbox
              area is trimmed back to 5% to keep the frame from reading as empty bands;
              the brand gradient underneath fills whatever is left.
            */}
            <div className="absolute inset-[5%]">
              <SmartImage
                src={safe.image || asset.src}
                alt={asset.alt}
                tone={asset.tone}
                sizes="(max-width: 1024px) 90vw, 45vw"
                fit="contain"
              />
            </div>
          </motion.div>
        </div>
      </Container>
    </section>
  )
}
