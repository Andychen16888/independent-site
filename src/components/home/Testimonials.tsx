"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Container } from "@/components/ui/Container"

const testimonials = [
  {
    id: 1,
    name: "Sarah M.",
    location: "New York",
    rating: 5,
    text: "The peptide serum transformed my skincare routine. My skin has never looked this radiant. It's the perfect balance of science and nature.",
    product: "Peptide Hydration Serum",
  },
  {
    id: 2,
    name: "Emily R.",
    location: "Los Angeles",
    rating: 5,
    text: "I purchased a ceramic tea set from the Handmade collection and it's absolutely breathtaking. Each piece tells a story. It has become the centerpiece of my morning ritual.",
    product: "Artisan Tea Collection",
  },
  {
    id: 3,
    name: "Jessica K.",
    location: "London",
    rating: 5,
    text: "Finally, a brand that understands true luxury — it's about ingredients that work and objects that matter. The overnight mask is pure magic.",
    product: "Overnight Recovery Mask",
  },
]

export function Testimonials() {
  const [current, setCurrent] = useState(0)

  return (
    <section className="section-padding bg-charcoal text-ivory">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="section-title"
        >
          <span className="text-caption text-ivory/50 mb-4 block">Kind Words</span>
          <h2 className="text-ivory">From Our Community</h2>
        </motion.div>

        <div className="max-w-3xl mx-auto text-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex justify-center gap-1 mb-8">
                {Array.from({ length: testimonials[current].rating }).map((_, i) => (
                  <svg key={i} className="w-4 h-4 text-gold" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <blockquote className="heading-sm mb-8 text-ivory/90 leading-relaxed font-light italic">
                &ldquo;{testimonials[current].text}&rdquo;
              </blockquote>
              <p className="text-sm text-ivory/60 tracking-wider uppercase">
                {testimonials[current].name} — {testimonials[current].location}
              </p>
              <p className="text-xs text-ivory/40 mt-1">
                Verified Buyer of {testimonials[current].product}
              </p>
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-center gap-3 mt-10">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrent(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === current ? "bg-ivory w-6" : "bg-ivory/30"
                }`}
                aria-label={`Testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </Container>
    </section>
  )
}
