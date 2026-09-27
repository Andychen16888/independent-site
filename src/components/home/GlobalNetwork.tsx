"use client"

import { motion } from "framer-motion"
import { Container } from "@/components/ui/Container"
import { SmartImage } from "@/components/ui/SmartImage"
import { globalImage, type ImageAsset } from "@/config/images"
import type { SiteContent } from "@/config/site-content"

export function GlobalNetwork({
  content,
  image,
}: {
  content: SiteContent["global"]
  image?: ImageAsset
}) {
  const asset = image || globalImage

  return (
    <section className="section-padding bg-ivory">
      <Container>
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="eyebrow mb-4 block">{content.eyebrow}</span>
            <h2 className="text-3xl md:text-4xl lg:text-[2.75rem] font-semibold tracking-tight mb-5 text-balance">
              {content.heading}
            </h2>
            <p className="text-body max-w-lg">{content.body}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="relative aspect-[4/3] rounded-lg overflow-hidden border border-mist"
          >
            {/*
              fit="contain" keeps the whole image visible inside the fixed aspect-[4/3]
              box. A world-network map loses its meaning the moment an edge gets cropped,
              so the letterbox area is trimmed back to 5% to keep the frame from reading
              as empty bands; the brand gradient underneath fills whatever is left.
            */}
            <div className="absolute inset-[5%]">
              <SmartImage
                src={asset.src}
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
