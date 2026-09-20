"use client"

import { motion } from "framer-motion"
import { Container } from "@/components/ui/Container"
import type { SiteContent } from "@/config/site-content"

export function ProcessFlow({ content }: { content: SiteContent["process"] }) {
  return (
    <section className="section-padding bg-navy text-white">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14 md:mb-20"
        >
          <span className="eyebrow mb-4 block text-white/60">{content.eyebrow}</span>
          <h2 className="text-3xl md:text-4xl lg:text-[2.75rem] font-semibold tracking-tight text-white">
            {content.heading}
          </h2>
        </motion.div>

        <div className="relative">
          {/* Connecting line (desktop only) */}
          <div
            aria-hidden
            className="hidden lg:block absolute top-7 left-[8%] right-[8%] h-px bg-white/15"
          />

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-x-6 gap-y-10">
            {content.steps.map((step, index) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08, duration: 0.5 }}
                className="relative flex flex-col items-center text-center"
              >
                <span className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-navy-light text-sm font-semibold tracking-wider text-white">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="mt-4 text-sm font-semibold tracking-wide text-white/90">
                  {step}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  )
}
