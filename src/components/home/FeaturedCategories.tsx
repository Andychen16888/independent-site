"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Container } from "@/components/ui/Container"
import { HiOutlineSparkles, HiOutlineSwatch, HiOutlineShoppingBag } from "react-icons/hi2"

export interface FeaturedCategory {
  title: string
  subtitle?: string
  description?: string
  href: string
  image?: string
  icon?: "sparkles" | "swatch" | "bag"
}

const FALLBACK_ICONS = [HiOutlineSparkles, HiOutlineSwatch, HiOutlineShoppingBag]
const FALLBACK_BGS = ["bg-gradient-to-br from-ivory to-sage/10", "bg-gradient-to-br from-ivory to-blush/10", "bg-gradient-to-br from-ivory to-gold/10"]

export const DEFAULT_FEATURED_CATEGORIES: FeaturedCategory[] = [
  {
    title: "Beauty",
    subtitle: "Peptide Skincare",
    description: "Advanced formulations rooted in Eastern botanical wisdom",
    href: "/categories/beauty",
    icon: "sparkles",
    image: "/images/category-beauty.jpg",
  },
  {
    title: "Handmade Living",
    subtitle: "Artisanal Objects",
    description: "One-of-a-kind pieces crafted by master artisans",
    href: "/categories/handmade-living",
    icon: "swatch",
    image: "/images/category-living.jpg",
  },
]

function iconFor(name?: string) {
  if (name === "sparkles") return HiOutlineSparkles
  if (name === "swatch") return HiOutlineSwatch
  return HiOutlineShoppingBag
}

export function FeaturedCategories({ categories = DEFAULT_FEATURED_CATEGORIES, eyebrow = "Explore", heading = "Our Collections", tagline }: { categories?: FeaturedCategory[]; eyebrow?: string; heading?: string; tagline?: string }) {
  const safe = categories && categories.length > 0 ? categories : DEFAULT_FEATURED_CATEGORIES

  return (
    <section className="section-padding bg-cream">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="section-title"
        >
          <span className="text-caption mb-4 block">{eyebrow}</span>
          <h2>{heading}</h2>
          {tagline && <p>{tagline}</p>}
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 md:gap-8">
          {safe.map((category, index) => {
            const Icon = iconFor(category.icon)
            return (
              <motion.div
                key={category.title + index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
              >
                <Link
                  href={category.href}
                  className={`group block relative overflow-hidden aspect-[4/5] ${FALLBACK_BGS[index % FALLBACK_BGS.length]}`}
                >
                  {category.image && <img src={category.image} alt={category.title} className="absolute inset-0 w-full h-full object-cover" />}
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_40%,_rgba(44,44,44,0.02)_100%)]" />
                  <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-12">
                    <Icon className="w-8 h-8 text-stone mb-4 group-hover:scale-110 transition-transform duration-500" />
                    {category.subtitle && <span className="text-caption mb-2">{category.subtitle}</span>}
                    <h3 className="heading-md mb-3 group-hover:translate-x-2 transition-transform duration-500">
                      {category.title}
                    </h3>
                    {category.description && <p className="text-body max-w-xs">{category.description}</p>}
                    <span className="inline-block mt-6 text-xs tracking-widest uppercase border-b border-charcoal pb-1 w-fit group-hover:border-stone transition-colors">
                      Explore Collection
                    </span>
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </div>
      </Container>
    </section>
  )
}