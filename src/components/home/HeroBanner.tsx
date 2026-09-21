"use client"

import { useState, useEffect } from "react"
import { Link } from "@/i18n/navigation"
import { useLocale, useTranslations } from "next-intl"
import { motion, AnimatePresence } from "framer-motion"
import { Container } from "@/components/ui/Container"
import { SmartImage } from "@/components/ui/SmartImage"
import { heroImages, type ImageAsset } from "@/config/images"
import { getSiteContent } from "@/config/site-content"
import { DEFAULT_HERO_SLIDES, type HeroSlide } from "@/lib/home-content"

export function HeroBanner({
  slides = DEFAULT_HERO_SLIDES,
  images,
}: {
  slides?: HeroSlide[]
  images?: ImageAsset[]
}) {
  const [current, setCurrent] = useState(0)
  const t = useTranslations("home.hero")
  const locale = useLocale()
  const { cta } = getSiteContent(locale)
  const safeSlides = slides && slides.length > 0 ? slides : DEFAULT_HERO_SLIDES

  useEffect(() => {
    if (safeSlides.length <= 1) return
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % safeSlides.length)
    }, 7000)
    return () => clearInterval(timer)
  }, [safeSlides.length])

  useEffect(() => {
    if (current >= safeSlides.length) setCurrent(0)
  }, [safeSlides.length, current])

  if (safeSlides.length === 0) return null

  const slide = safeSlides[current]
  const assets = images && images.length > 0 ? images : heroImages
  const asset = assets[current % assets.length]

  return (
    <section className="relative h-[560px] sm:h-[600px] lg:h-[680px] max-h-[760px] min-h-[520px] overflow-hidden bg-navy">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <SmartImage
            src={slide.image || asset.src}
            alt={asset.alt}
            tone={asset.tone}
            sizes="100vw"
            priority={current === 0}
            overlay
            // Broken/expired slide image falls back to the hero slot image.
            fallbackSrcs={slide.image ? [asset.src] : undefined}
          />

          <Container className="relative h-full">
            <div className="flex h-full items-center">
              <div className="max-w-2xl">
                {slide.subtitle && (
                  <motion.span
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, duration: 0.5 }}
                    className="eyebrow mb-5 block text-white/70"
                  >
                    {slide.subtitle}
                  </motion.span>
                )}

                <motion.h1
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25, duration: 0.55 }}
                  className="heading-xl text-white mb-6 text-balance"
                >
                  {slide.title}
                </motion.h1>

                {slide.description && (
                  <motion.p
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35, duration: 0.55 }}
                    className="text-white/80 leading-relaxed text-sm md:text-lg mb-10 max-w-xl"
                  >
                    {slide.description}
                  </motion.p>
                )}

                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45, duration: 0.55 }}
                  className="flex flex-wrap gap-4"
                >
                  <Link href={slide.href || "/products"} className="btn-primary">
                    {slide.cta || cta.viewProducts}
                  </Link>
                  <Link href="/pages/contact" className="btn-outline-light">
                    {cta.requestQuote}
                  </Link>
                </motion.div>
              </div>
            </div>
          </Container>
        </motion.div>
      </AnimatePresence>

      {safeSlides.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 z-10">
          {safeSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrent(index)}
              className={`h-[3px] rounded-full transition-all duration-500 ${
                index === current ? "bg-white w-12" : "bg-white/40 w-6 hover:bg-white/70"
              }`}
              aria-label={t("slideLabel", { index: index + 1 })}
            />
          ))}
        </div>
      )}
    </section>
  )
}
