export interface BlogTranslationSeed {
  title: string
  excerpt: string
  seoTitle: string
  seoDescription: string
  seoKeywords: string
  /** Full localized article body (HTML). When omitted, the row keeps title/excerpt/SEO only. */
  content?: string
}

export interface FaqTranslationSeed {
  q: string
  a: string
}