"use client"

import { motion } from "framer-motion"
import { HiOutlineCheckBadge } from "react-icons/hi2"
import { Container } from "@/components/ui/Container"
import type { SiteContent } from "@/config/site-content"

export function TrustQuality({ content }: { content: SiteContent["trust"] }) {
  return (
    <section className="section-padding bg-cloud">
      <Container>
        <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] gap-12 lg:gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="eyebrow mb-4 block">{content.eyebrow}</span>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4 text-balance">
              {content.heading}
            </h2>
            <p className="text-body max-w-md">{content.tagline}</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-8">
            {content.items.map((item, index) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08, duration: 0.5 }}
                className="flex items-start gap-4 border-t border-mist pt-6"
              >
                <HiOutlineCheckBadge className="w-6 h-6 shrink-0 text-navy" />
                <span className="text-sm md:text-base font-medium text-charcoal">{item}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  )
}
