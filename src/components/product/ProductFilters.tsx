"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils/cn"

const sortOptions = [
  { label: "Newest", value: "newest" },
  { label: "Price: Low to High", value: "price-asc" },
  { label: "Price: High to Low", value: "price-desc" },
  { label: "Best Sellers", value: "bestseller" },
]

const priceRanges = [
  { label: "Under $50", value: "0-50" },
  { label: "$50 - $100", value: "50-100" },
  { label: "$100 - $200", value: "100-200" },
  { label: "Over $200", value: "200-" },
]

interface ProductFiltersProps {
  category?: string
}

export function ProductFilters({ category }: ProductFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const updateParams = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (params.get(key) === value) {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    router.push(`/products?${params.toString()}`)
  }

  return (
    <div className="space-y-8">
      <div>
        <h4 className="text-xs tracking-widest uppercase mb-4">Sort By</h4>
        <div className="space-y-2">
          {sortOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => updateParams("sort", option.value)}
              className={cn(
                "block text-sm py-1 transition-colors",
                searchParams.get("sort") === option.value
                  ? "text-charcoal font-medium"
                  : "text-stone hover:text-charcoal"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-xs tracking-widest uppercase mb-4">Price Range</h4>
        <div className="space-y-2">
          {priceRanges.map((range) => (
            <button
              key={range.value}
              onClick={() => updateParams("price", range.value)}
              className={cn(
                "block text-sm py-1 transition-colors",
                searchParams.get("price") === range.value
                  ? "text-charcoal font-medium"
                  : "text-stone hover:text-charcoal"
              )}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
