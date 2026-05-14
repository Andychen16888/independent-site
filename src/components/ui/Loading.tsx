"use client"

import { Container } from "./Container"

export function PageLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-charcoal/20 border-t-charcoal rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-stone tracking-wider uppercase">Loading...</p>
      </div>
    </div>
  )
}

export function SectionLoading() {
  return (
    <div className="product-grid">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-4">
          <div className="aspect-[3/4] bg-mist animate-pulse" />
          <div className="h-4 bg-mist animate-pulse rounded w-3/4" />
          <div className="h-4 bg-mist animate-pulse rounded w-1/2" />
        </div>
      ))}
    </div>
  )
}
