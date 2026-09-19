"use client"

import { useState, useEffect, useRef } from "react"
import { useLocale } from "next-intl"
import { usePathname, useRouter } from "@/i18n/navigation"
import { routing, localeNames } from "@/i18n/routing"
import { motion, AnimatePresence } from "framer-motion"

export function LanguageSelector() {
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 text-xs text-stone hover:text-charcoal transition-colors tracking-wider uppercase"
      >
        {locale.toUpperCase()}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="absolute top-full right-0 mt-2 bg-ivory border border-mist shadow-lg min-w-[160px] z-50"
          >
            {routing.locales.map((l) => (
              <button
                key={l}
                onClick={() => {
                  router.replace(pathname, { locale: l })
                  setIsOpen(false)
                }}
                className={`w-full text-left px-4 py-3 text-sm hover:bg-mist transition-colors ${
                  locale === l ? "bg-mist font-medium" : ""
                }`}
              >
                {localeNames[l]}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}