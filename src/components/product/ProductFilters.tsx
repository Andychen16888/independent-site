"use client"

import { useRouter } from "@/i18n/navigation"
import { useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils/cn"

export function ProductFilters({ category }: { category?: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const t = useTranslations("products.filters")

  const sortOptions = [
    { label: t("newest"), value: "newest" },
    { label: t("priceLowHigh"), value: "price-asc" },
    { label: t("priceHighLow"), value: "price-desc" },
    { label: t("bestSellers"), value: "bestseller" },
  ]

  const priceRanges = [
    { label: t("under", { amount: "$50" }), value: "0-50" },
    { label: t("range", { min: "$50", max: "$100" }), value: "50-100" },
    { label: t("range", { min: "$100", max: "$200" }), value: "100-200" },
    { label: t("over", { amount: "$200" }), value: "200-" },
  ]

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
        <h4 className="text-xs tracking-widest uppercase mb-4">{t("sortBy")}</h4>
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
        <h4 className="text-xs tracking-widest uppercase mb-4">{t("priceRange")}</h4>
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