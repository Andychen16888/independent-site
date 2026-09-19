"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useTranslations } from "next-intl"
import { Container } from "@/components/ui/Container"

export interface Testimonial { name: string; location?: string; rating?: number; text: string; product?: string }

export const DEFAULT_TESTIMONIALS: Testimonial[] = [
  {
    name: "Marcus L.",
    location: "Hamburg, Germany",
    rating: 5,
    text: "We resell the LED night lights and power banks in our retail stores. Consistent quality, on-time shipments, and pricing that leaves real margin. They've become our go-to supplier.",
    product: "LED Motion Sensor Night Light",
  },
  {
    name: "Aline B.",
    location: "Lyon, France",
    rating: 5,
    text: "The ceramic dinnerware set sells out every season. Pre-shipment inspection photos and certificates give us total confidence, and the MOQ was flexible enough for us to start small.",
    product: "Ceramic Dinnerware Set",
  },
  {
    name: "Dong-mei H.",
    location: "Singapore",
    rating: 5,
    text: "Finally a sourcing partner that handles quality control and freight end to end. Our first order of TWS earbuds arrived on time and defect-free. Highly recommended for B2B buyers.",
    product: "TWS Wireless Earbuds Pro",
  },
]

export function Testimonials({ items = DEFAULT_TESTIMONIALS, eyebrow = "Buyer Reviews", heading = "Trusted by Importers Worldwide" }: { items?: Testimonial[]; eyebrow?: string; heading?: string }) {
  const [current, setCurrent] = useState(0)
  const t = useTranslations("home.testimonials")
  const safe = items && items.length > 0 ? items : DEFAULT_TESTIMONIALS

  if (safe.length === 0) return null
  const idx = Math.min(current, safe.length - 1)
  const testimonial = safe[idx]

  return (
    <section className="section-padding bg-charcoal text-ivory">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="section-title"
        >
          <span className="text-caption text-ivory/50 mb-4 block">{eyebrow}</span>
          <h2 className="text-ivory">{heading}</h2>
        </motion.div>

        <div className="max-w-3xl mx-auto text-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex justify-center gap-1 mb-8">
                {Array.from({ length: testimonial.rating || 5 }).map((_, i) => (
                  <svg key={i} className="w-4 h-4 text-gold" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <blockquote className="heading-sm mb-8 text-ivory/90 leading-relaxed font-light italic">
                &ldquo;{testimonial.text}&rdquo;
              </blockquote>
              <p className="text-sm text-ivory/60 tracking-wider uppercase">
                {testimonial.name}{testimonial.location ? ` — ${testimonial.location}` : ""}
              </p>
              {testimonial.product && (
                <p className="text-xs text-ivory/40 mt-1">{t("verifiedBuyerOf", { product: testimonial.product })}</p>
              )}
            </motion.div>
          </AnimatePresence>

          {safe.length > 1 && (
            <div className="flex justify-center gap-3 mt-10">
              {safe.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrent(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === idx ? "bg-ivory w-6" : "bg-ivory/30"
                  }`}
                  aria-label={t("testimonialLabel", { index: index + 1 })}
                />
              ))}
            </div>
          )}
        </div>
      </Container>
    </section>
  )
}