"use client"

import { motion } from "framer-motion"
import { Container } from "@/components/ui/Container"
import { SmartImage } from "@/components/ui/SmartImage"
import { supplyChainImages, type ImageAsset } from "@/config/images"
import type { SiteContent } from "@/config/site-content"

export function SupplyChain({
  content,
  images,
}: {
  content: SiteContent["supplyChain"]
  images?: ImageAsset[]
}) {
  return (
    <section className="section-padding bg-cream">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="section-title"
        >
          <span className="eyebrow mb-4 block">{content.eyebrow}</span>
          <h2>{content.heading}</h2>
          <p>{content.tagline}</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {content.items.map((item, index) => {
            const image = (images && images[index]) || supplyChainImages[index]
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08, duration: 0.5 }}
              >
                <div className="relative aspect-video overflow-hidden rounded-lg mb-5">
                  {/*
                    fit="contain" keeps the whole photo visible in the 16:9 card instead
                    of cropping it. The hover zoom is dropped on purpose: scaling a
                    contained image pushes it past the card edge and crops it again.
                  */}
                  <div className="absolute inset-[5%]">
                    <SmartImage
                      src={image?.src}
                      alt={image?.alt || item.title}
                      tone={image?.tone}
                      sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 22vw"
                      fit="contain"
                    />
                  </div>
                </div>
                <h3 className="heading-sm mb-2">{item.title}</h3>
                <p className="text-body text-sm">{item.description}</p>
              </motion.div>
            )
          })}
        </div>
      </Container>
    </section>
  )
}
