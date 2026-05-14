"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Container } from "@/components/ui/Container"

export function BrandStory() {
  return (
    <section className="section-padding bg-ivory">
      <Container>
        <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
          >
            <span className="text-caption mb-4 block">Our Story</span>
            <h2 className="heading-lg mb-6">
              Bridging Two Worlds
            </h2>
            <p className="text-body mb-6">
              Oriental Beauty was born from a simple belief — that the finest skincare rituals 
              and the most beautiful home objects share a common origin: respect for nature 
              and devotion to craftsmanship.
            </p>
            <p className="text-body mb-8">
              We travel across Asia to partner with artisans who have perfected their craft 
              over generations, and collaborate with scientists who reimagine traditional 
              ingredients through modern peptide technology.
            </p>
            <Link href="/about" className="btn-outline">
              Read Our Story
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative aspect-[4/5] bg-mist"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-charcoal/5 to-transparent" />
            <div className="absolute -bottom-4 -left-4 w-24 h-24 border border-sage/30" />
            <div className="absolute -top-4 -right-4 w-32 h-32 border border-blush/30" />
          </motion.div>
        </div>
      </Container>
    </section>
  )
}
