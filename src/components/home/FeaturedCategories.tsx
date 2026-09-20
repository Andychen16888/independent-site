"use client"

import { Link } from "@/i18n/navigation"
import { motion } from "framer-motion"
import { useTranslations } from "next-intl"
import { HiOutlineArrowRight } from "react-icons/hi2"
import { Container } from "@/components/ui/Container"
import { SmartImage } from "@/components/ui/SmartImage"
import { categoryFallbackTone } from "@/config/images"
import { DEFAULT_FEATURED_CATEGORIES, type FeaturedCategory } from "@/lib/home-content"

export function FeaturedCategories({
  categories = DEFAULT_FEATURED_CATEGORIES,
  eyebrow = "Explore",
  heading = "Our Collections",
  tagline,
}: {
  categories?: FeaturedCategory[]
  eyebrow?: string
  heading?: string
  tagline?: string
}) {
  const safe = categories && categories.length > 0 ? categories : DEFAULT_FEATURED_CATEGORIES
  const tc = useTranslations("common")

  return (
    <section className="section-padding bg-ivory">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="section-title"
        >
          <span className="eyebrow mb-4 block">{eyebrow}</span>
          <h2>{heading}</h2>
          {tagline && <p>{tagline}</p>}
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {safe.map((category, index) => (
            <motion.div
              key={category.title + index}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08, duration: 0.5 }}
              className="group"
            >
              <Link
                href={category.href}
                className="relative block aspect-[4/3] overflow-hidden rounded-lg"
              >
                <SmartImage
                  src={category.image}
                  alt={category.title}
                  tone={categoryFallbackTone(category.href)}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="transition-all duration-500 group-hover:scale-[1.05]"
                  overlay
                />

                <div className="absolute inset-0 flex flex-col justify-end p-7 md:p-9">
                  {category.subtitle && (
                    <span className="eyebrow mb-2 text-white/70">{category.subtitle}</span>
                  )}
                  <h3 className="text-xl md:text-2xl font-semibold tracking-tight text-white mb-2">
                    {category.title}
                  </h3>
                  {category.description && (
                    <p className="text-white/75 text-sm line-clamp-2 max-w-sm">{category.description}</p>
                  )}
                  <span className="mt-5 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-white">
                    {tc("exploreCollection")}
                    <HiOutlineArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
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
