"use client"

import { Link } from "@/i18n/navigation"
import { motion } from "framer-motion"
import { Container } from "@/components/ui/Container"
import { SmartImage } from "@/components/ui/SmartImage"
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
                className="relative mx-auto block w-full max-w-[500px] aspect-square overflow-hidden rounded-lg bg-white"
              >
                {/*
                  fit="contain" scales the whole image to fit inside the frame, so a
                  listing image of any dimensions stays fully visible instead of being
                  cropped by the default object-cover. The leftover area shows the
                  brand gradient underneath, which keeps mixed aspect ratios tidy.
                  No hover zoom here: scaling a contained image would push it past the
                  frame edge and bring the cropping back.
                */}
                <SmartImage
                  src={category.image}
                  alt={category.title}
                  tone="from-white via-white to-white"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  fit="contain"
                />
              </Link>

              <div className="pt-4 text-center">
                <Link href={category.href} className="inline-block">
                  <h3 className="text-xl md:text-2xl font-semibold tracking-tight text-charcoal">
                    {category.title}
                  </h3>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  )
}
