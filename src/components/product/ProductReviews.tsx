"use client"

import { useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import { formatDate } from "@/lib/utils/format"
import { HiStar, HiOutlineStar } from "react-icons/hi2"

interface Review {
  id: string
  rating: number
  title?: string | null
  content: string
  isVerified: boolean
  user: { firstName?: string | null; lastName?: string | null }
  images?: { url: string }[]
  createdAt: Date | string
}

interface ProductReviewsProps {
  reviews: Review[]
  stats: { average: number; total: number; distribution: Record<number, number> }
}

function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const cls = size === "sm" ? "w-3 h-3" : "w-4 h-4"
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        i <= rating
          ? <HiStar key={i} className={`${cls} text-gold`} />
          : <HiOutlineStar key={i} className={`${cls} text-stone/30`} />
      ))}
    </div>
  )
}

export function ProductReviews({ reviews, stats }: ProductReviewsProps) {
  const [sortBy, setSortBy] = useState<"newest" | "highest" | "lowest">("newest")
  const t = useTranslations("product.reviews")
  const locale = useLocale()

  const sorted = [...reviews].sort((a, b) => {
    if (sortBy === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    if (sortBy === "highest") return b.rating - a.rating
    return a.rating - b.rating
  })

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="heading-md mb-8">{t("title")}</h2>

      <div className="grid md:grid-cols-[280px_1fr] gap-8 mb-12">
        <div className="bg-cream p-6 text-center">
          <p className="text-4xl font-serif mb-2">{stats.average.toFixed(1)}</p>
          <StarRating rating={Math.round(stats.average)} size="md" />
          <p className="text-sm text-stone mt-2">{t("reviewCount", { count: stats.total })}</p>
          <div className="mt-4 space-y-1">
            {[5, 4, 3, 2, 1].map((star) => (
              <div key={star} className="flex items-center gap-2 text-xs">
                <span className="w-4 text-right">{star}</span>
                <div className="flex-1 h-1.5 bg-mist rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gold rounded-full"
                    style={{ width: `${stats.total > 0 ? (stats.distribution[star] || 0) / stats.total * 100 : 0}%` }}
                  />
                </div>
                <span className="w-8 text-stone text-right">{stats.distribution[star] || 0}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-stone">{t("reviewCount", { count: sorted.length })}</p>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-sm bg-transparent border border-charcoal/20 px-3 py-2 outline-none"
            >
              <option value="newest">{t("sortNewest")}</option>
              <option value="highest">{t("sortHighest")}</option>
              <option value="lowest">{t("sortLowest")}</option>
            </select>
          </div>

          <div className="space-y-6">
            {sorted.length === 0 ? (
              <p className="text-body text-center py-8">{t("noReviews")}</p>
            ) : (
              sorted.map((review) => (
                <div key={review.id} className="border-b border-mist pb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <StarRating rating={review.rating} />
                    {review.isVerified && (
                      <span className="text-[10px] text-sage tracking-wider uppercase bg-sage/10 px-2 py-0.5">
                        {t("verifiedPurchase")}
                      </span>
                    )}
                  </div>
                  {review.title && (
                    <h4 className="font-serif text-base mb-1">{review.title}</h4>
                  )}
                  <p className="text-body text-sm leading-relaxed">{review.content}</p>
                  {review.images && review.images.length > 0 && (
                    <div className="flex gap-2 mt-3">
                      {review.images.map((img, i) => (
                        <div key={i} className="w-16 h-16 bg-mist" />
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-stone mt-2">
                    {review.user.firstName || t("anonymous")} — {formatDate(review.createdAt, locale)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
