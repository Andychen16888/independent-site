"use client"

import { useState, useEffect } from "react"
import { HiXMark, HiOutlineGift } from "react-icons/hi2"

interface PromoBarProps {
  message?: string
  discount?: string
  code?: string
  link?: string
}

export function PromoBar({ message, discount, code, link }: PromoBarProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem("promo-dismissed")
      if (stored) {
        const expiry = parseInt(stored, 10)
        if (Date.now() < expiry) {
          setDismissed(true)
        } else {
          localStorage.removeItem("promo-dismissed")
        }
      }
    } catch {}
  }, [])

  if (!isVisible || dismissed) return null

  const handleDismiss = () => {
    setIsVisible(false)
    try {
      localStorage.setItem("promo-dismissed", String(Date.now() + 86400000))
    } catch {}
  }

  return (
    <div
      className="relative bg-charcoal text-ivory text-xs tracking-wider py-2.5 px-4 text-center overflow-hidden"
      style={{ animation: "slideDown 0.3s ease-out" }}
    >
      <div className="flex items-center justify-center gap-3">
        <HiOutlineGift className="w-4 h-4 shrink-0 text-rosegold" />
        <span>
          {message || "New customers save 10%"}
          {discount && (
            <span className="font-semibold text-rosegold"> {discount}</span>
          )}
          {code && (
            <span className="ml-1.5 px-2 py-0.5 bg-ivory/10 rounded text-rosegold font-mono text-[10px] tracking-widest">
              {code}
            </span>
          )}
          {link && (
            <a
              href={link}
              className="ml-2 underline underline-offset-2 hover:text-rosegold transition-colors"
            >
              Shop now
            </a>
          )}
        </span>
        <button
          onClick={handleDismiss}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-ivory/10 rounded transition-colors"
          aria-label="Dismiss promotion"
        >
          <HiXMark className="w-3.5 h-3.5" />
        </button>
      </div>
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-100%); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
