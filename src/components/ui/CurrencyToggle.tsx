"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

const currencies = [
  { code: "USD", symbol: "$", label: "US Dollar" },
  { code: "EUR", symbol: "€", label: "Euro" },
  { code: "GBP", symbol: "£", label: "British Pound" },
  { code: "CAD", symbol: "C$", label: "Canadian Dollar" },
  { code: "AUD", symbol: "A$", label: "Australian Dollar" },
]

export function CurrencyToggle() {
  const [isOpen, setIsOpen] = useState(false)
  const [selected, setSelected] = useState(currencies[0])

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 text-xs text-stone hover:text-charcoal transition-colors tracking-wider uppercase"
      >
        {selected.symbol} {selected.code}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="absolute top-full right-0 mt-2 bg-ivory border border-mist shadow-lg min-w-[160px] z-50"
          >
            {currencies.map((currency) => (
              <button
                key={currency.code}
                onClick={() => {
                  setSelected(currency)
                  setIsOpen(false)
                }}
                className={`w-full text-left px-4 py-3 text-sm hover:bg-mist transition-colors ${
                  selected.code === currency.code ? "bg-mist font-medium" : ""
                }`}
              >
                <span className="text-stone mr-2">{currency.symbol}</span>
                {currency.code} — {currency.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
