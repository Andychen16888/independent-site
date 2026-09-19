"use client"

import { useState, useEffect } from "react"
import { Link } from "@/i18n/navigation"
import { useTranslations } from "next-intl"
import { motion, AnimatePresence } from "framer-motion"
import { Container } from "@/components/ui/Container"

export interface HeroSlide {
  title: string
  subtitle?: string
  description?: string
  cta?: string
  href?: string
  bg?: string
  image?: string
  align?: "left" | "center" | "right" | string
}

export const DEFAULT_HERO_SLIDES: HeroSlide[] = [
  {
    title: "Factory-Direct B2B Sourcing",
    subtitle: "Sourced from China, delivered worldwide",
    description: "Quality electronics, LED lighting, and daily commodities at wholesale prices",
    cta: "Browse Products",
    href: "/products",
    bg: "bg-gradient-to-br from-sage/20 to-ivory",
    image: "/images/hero-electronics.jpg",
    align: "left",
  },
  {
    title: "Wholesale Pricing",
    subtitle: "Built for retailers and distributors",
    description: "Tiered bulk pricing, private label options, and reliable supply schedules",
    cta: "Explore Categories",
    href: "/categories/electronics",
    bg: "bg-gradient-to-bl from-blush/20 to-ivory",
    image: "/images/hero-wholesale.jpg",
    align: "right",
  },
  {
    title: "Quality You Can Trust",
    subtitle: "Certified goods, inspected every batch",
    description: "CE, FCC, and RoHS certified products with pre-shipment inspection",
    cta: "Our Story",
    href: "/pages/about",
    bg: "bg-gradient-to-tr from-gold/10 to-ivory",
    image: "/images/hero-lifestyle.jpg",
    align: "center",
  },
]

const FALLBACK_BGS = ["bg-gradient-to-br from-sage/20 to-ivory", "bg-gradient-to-bl from-blush/20 to-ivory", "bg-gradient-to-tr from-gold/10 to-ivory"]

export function HeroBanner({ slides = DEFAULT_HERO_SLIDES }: { slides?: HeroSlide[] }) {
  const [current, setCurrent] = useState(0)
  const t = useTranslations("home.hero")
  const safeSlides = slides && slides.length > 0 ? slides : DEFAULT_HERO_SLIDES

  useEffect(() => {
    if (safeSlides.length <= 1) return
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % safeSlides.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [safeSlides.length])

  // Reset index if the number of slides changes.
  useEffect(() => {
    if (current >= safeSlides.length) setCurrent(0)
  }, [safeSlides.length, current])

  if (safeSlides.length === 0) return null

  return (
    <section className="relative h-screen min-h-[600px] max-h-[900px] overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className={`absolute inset-0 ${safeSlides[current].bg || FALLBACK_BGS[current % FALLBACK_BGS.length]}`}
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(255,255,240,0.4)_100%)]" />

          <Container className="relative h-full">
            <div className={`flex items-center h-full ${safeSlides[current].align === "right" ? "justify-end" : safeSlides[current].align === "center" ? "justify-center text-center" : ""}`}>
              <div className={`max-w-xl ${safeSlides[current].align === "center" ? "flex flex-col items-center" : ""}`}>
                {safeSlides[current].subtitle && (
                  <motion.span
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                    className="text-caption mb-6 block"
                  >
                    {safeSlides[current].subtitle}
                  </motion.span>
                )}
                <motion.h1
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                  className="heading-xl mb-6 text-balance"
                >
                  {safeSlides[current].title}
                </motion.h1>
                {safeSlides[current].description && (
                  <motion.p
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.6 }}
                    className="text-body mb-10 max-w-md"
                  >
                    {safeSlides[current].description}
                  </motion.p>
                )}
                {safeSlides[current].cta && safeSlides[current].href && (
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 0.6 }}
                  >
                    <Link href={safeSlides[current].href} className="btn-primary">
                      {safeSlides[current].cta}
                    </Link>
                  </motion.div>
                )}
              </div>
            </div>
          </Container>
        </motion.div>
      </AnimatePresence>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 z-10">
        {safeSlides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            className={`w-12 h-[2px] transition-all duration-500 ${
              index === current ? "bg-charcoal w-16" : "bg-stone/40"
            }`}
            aria-label={t("slideLabel", { index: index + 1 })}
          />
        ))}
      </div>
    </section>
  )
}