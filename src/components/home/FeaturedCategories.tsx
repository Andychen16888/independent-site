"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Container } from "@/components/ui/Container"
import { HiOutlineSparkles, HiOutlineSwatch } from "react-icons/hi2"

const categories = [
  {
    title: "Beauty",
    subtitle: "Peptide Skincare",
    description: "Advanced formulations rooted in Eastern botanical wisdom",
    href: "/categories/beauty",
    icon: HiOutlineSparkles,
    bg: "bg-gradient-to-br from-ivory to-sage/10",
    image: "/images/category-beauty.jpg",
  },
  {
    title: "Handmade Living",
    subtitle: "Artisanal Objects",
    description: "One-of-a-kind pieces crafted by master artisans",
    href: "/categories/handmade-living",
    icon: HiOutlineSwatch,
    bg: "bg-gradient-to-br from-ivory to-blush/10",
    image: "/images/category-living.jpg",
  },
]

export function FeaturedCategories() {
  return (
    <section className="section-padding bg-cream">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="section-title"
        >
          <span className="text-caption mb-4 block">Explore</span>
          <h2>Our Collections</h2>
          <p>Two worlds, one philosophy — beauty that honors tradition and nature</p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 md:gap-8">
          {categories.map((category, index) => (
            <motion.div
              key={category.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
            >
              <Link
                href={category.href}
                className={`group block relative overflow-hidden aspect-[4/5] ${category.bg}`}
              >
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_40%,_rgba(44,44,44,0.02)_100%)]" />
                <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-12">
                  <category.icon className="w-8 h-8 text-stone mb-4 group-hover:scale-110 transition-transform duration-500" />
                  <span className="text-caption mb-2">{category.subtitle}</span>
                  <h3 className="heading-md mb-3 group-hover:translate-x-2 transition-transform duration-500">
                    {category.title}
                  </h3>
                  <p className="text-body max-w-xs">
                    {category.description}
                  </p>
                  <span className="inline-block mt-6 text-xs tracking-widest uppercase border-b border-charcoal pb-1 w-fit group-hover:border-stone transition-colors">
                    Explore Collection
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  )
}
