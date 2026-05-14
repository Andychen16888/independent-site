"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Container } from "@/components/ui/Container"

const features = [
  {
    title: "Advanced Peptide Technology",
    description: "Multi-weight peptides that penetrate deeper for visible results",
  },
  {
    title: "Botanical Actives",
    description: "Fermented Asian botanicals — ginseng, green tea, and rice bran",
  },
  {
    title: "Minimalist Formulations",
    description: "Clean, effective ingredients. No parabens, sulfates, or synthetic fragrances",
  },
  {
    title: "Sustainable Luxury",
    description: "Refillable glass vessels and biodegradable packaging",
  },
]

export function PeptideSkincare() {
  return (
    <section className="section-padding bg-ivory">
      <Container>
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-caption mb-4 block">The Science of Beauty</span>
            <h2 className="heading-lg mb-6">Peptide Skincare</h2>
            <p className="text-body mb-10 max-w-lg">
              Our peptide formulations combine cutting-edge biotechnology with 
              centuries-old Asian botanical wisdom. Each product is designed to 
              work in harmony with your skin&apos;s natural rhythms.
            </p>

            <div className="space-y-8">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex gap-4"
                >
                  <span className="text-gold text-sm font-serif">{(index + 1).toString().padStart(2, "0")}</span>
                  <div>
                    <h4 className="font-serif text-lg mb-1">{feature.title}</h4>
                    <p className="text-body text-sm">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <Link href="/categories/beauty" className="btn-primary mt-10">
              View All Skincare
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative aspect-[3/4] bg-mist"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-ivory/20 to-transparent" />
            <div className="absolute top-8 left-8 right-8 bottom-8 border border-white/20" />
          </motion.div>
        </div>
      </Container>
    </section>
  )
}
