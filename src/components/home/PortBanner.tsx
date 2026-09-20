"use client"

import { motion } from "framer-motion"
import { Link } from "@/i18n/navigation"
import { Container } from "@/components/ui/Container"
import { SmartImage } from "@/components/ui/SmartImage"
import { portImage } from "@/config/images"
import type { SiteContent } from "@/config/site-content"

export function PortBanner({
  content,
  ctaLabel,
  ctaHref = "/pages/contact",
}: {
  content: SiteContent["port"]
  ctaLabel: string
  ctaHref?: string
}) {
  return (
    <section className="relative min-h-[420px] md:min-h-[520px] flex items-center overflow-hidden">
      <SmartImage
        src={portImage.src}
        alt={portImage.alt}
        tone={portImage.tone}
        sizes="100vw"
        overlay
      />

      <Container className="relative py-20 md:py-28">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl"
        >
          <span className="eyebrow mb-4 block text-white/60">{content.eyebrow}</span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-white mb-5 text-balance">
            {content.heading}
          </h2>
          <p className="text-white/80 leading-relaxed text-sm md:text-base max-w-xl mb-9">
            {content.body}
          </p>
          <Link href={ctaHref} className="btn-primary">
            {ctaLabel}
          </Link>
        </motion.div>
      </Container>
    </section>
  )
}
