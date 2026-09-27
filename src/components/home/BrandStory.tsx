"use client"

import { motion } from "framer-motion"
import { Link } from "@/i18n/navigation"
import { Container } from "@/components/ui/Container"
import { SmartImage } from "@/components/ui/SmartImage"
import { aboutImages, type ImageAsset } from "@/config/images"
import { DEFAULT_BRAND_STORY, type BrandStoryContent } from "@/lib/home-content"

export function BrandStory({
  content = DEFAULT_BRAND_STORY,
  image,
}: {
  content?: BrandStoryContent
  image?: ImageAsset
}) {
  const safe = content.title ? content : DEFAULT_BRAND_STORY
  const paragraphs = safe.paragraphs || []
  const asset = image || aboutImages[0]

  return (
    <section className="section-padding bg-ivory">
      <Container>
        <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
          >
            {safe.eyebrow && <span className="eyebrow mb-4 block">{safe.eyebrow}</span>}
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
            transition={{ duration: 0.7, delay: 0.15 }}
            className="relative aspect-[4/5] overflow-hidden rounded-lg border border-mist"
          >
            {/*
              fit="contain" keeps the whole photo visible inside the fixed aspect-[4/5]
              box. Because the box is portrait and most uploads are landscape, the
              letterbox area is trimmed back to 5% so the frame does not read as two
              large empty bands; the brand gradient underneath fills whatever is left.
            */}
            <div className="absolute inset-[5%]">
              <SmartImage
                src={safe.image || asset.src}
                alt={asset.alt}
                tone={asset.tone}
                sizes="(max-width: 768px) 90vw, 45vw"
                fit="contain"
              />
            </div>
          </motion.div>
        </div>
      </Container>
    </section>
  )
}
