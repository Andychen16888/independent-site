const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://orientalbeauty.com"

export interface SitemapEntry {
  url: string
  lastModified?: Date
  changeFrequency?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never"
  priority?: number
  images?: { url: string; caption?: string; title?: string }[]
  videos?: { url: string; title?: string; description?: string }[]
}

export const staticRoutes: SitemapEntry[] = [
  { url: baseUrl, changeFrequency: "weekly", priority: 1.0 },
  { url: `${baseUrl}/products`, changeFrequency: "daily", priority: 0.9 },
  { url: `${baseUrl}/categories/beauty`, changeFrequency: "weekly", priority: 0.8 },
  { url: `${baseUrl}/categories/handmade-living`, changeFrequency: "weekly", priority: 0.8 },
  { url: `${baseUrl}/blog`, changeFrequency: "weekly", priority: 0.8 },
  { url: `${baseUrl}/about`, changeFrequency: "monthly", priority: 0.6 },
  { url: `${baseUrl}/contact`, changeFrequency: "monthly", priority: 0.5 },
  { url: `${baseUrl}/faq`, changeFrequency: "monthly", priority: 0.5 },
  { url: `${baseUrl}/shipping`, changeFrequency: "monthly", priority: 0.4 },
  { url: `${baseUrl}/privacy`, changeFrequency: "yearly", priority: 0.3 },
  { url: `${baseUrl}/terms`, changeFrequency: "yearly", priority: 0.3 },
  { url: `${baseUrl}/affiliate`, changeFrequency: "monthly", priority: 0.5 },
  { url: `${baseUrl}/search`, changeFrequency: "monthly", priority: 0.2 },
]

export const productRoutes: SitemapEntry[] = [
  {
    url: `${baseUrl}/products/peptide-hydration-serum`,
    changeFrequency: "weekly",
    priority: 0.8,
    images: [
      { url: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&q=80", title: "Peptide Hydration Serum" },
    ],
  },
  {
    url: `${baseUrl}/products/rice-bran-peptide-mask`,
    changeFrequency: "weekly",
    priority: 0.7,
    images: [
      { url: "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=800&q=80", title: "Rice Bran Peptide Mask" },
    ],
  },
  {
    url: `${baseUrl}/products/ginseng-peptide-eye-cream`,
    changeFrequency: "weekly",
    priority: 0.7,
    images: [
      { url: "https://images.unsplash.com/photo-1621607512214-68297480165e?w=800&q=80", title: "Ginseng Peptide Eye Cream" },
    ],
  },
  {
    url: `${baseUrl}/products/vitamin-c-brightening-essence`,
    changeFrequency: "weekly",
    priority: 0.6,
    images: [
      { url: "https://images.unsplash.com/photo-1599305090598-fe179d501227?w=800&q=80", title: "Vitamin C Brightening Essence" },
    ],
  },
  {
    url: `${baseUrl}/products/raku-teacup-set`,
    changeFrequency: "weekly",
    priority: 0.8,
    images: [
      { url: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=800&q=80", title: "Raku Teacup Set" },
    ],
  },
  {
    url: `${baseUrl}/products/celadon-lotus-vase`,
    changeFrequency: "weekly",
    priority: 0.7,
    images: [
      { url: "https://images.unsplash.com/photo-1581783898377-1c85bf937427?w=800&q=80", title: "Celadon Lotus Vase" },
    ],
  },
  {
    url: `${baseUrl}/products/bamboo-incense-holder`,
    changeFrequency: "weekly",
    priority: 0.5,
    images: [
      { url: "https://images.unsplash.com/photo-1602872030216-3ae6e5f3e5e5?w=800&q=80", title: "Bamboo Incense Holder" },
    ],
  },
  {
    url: `${baseUrl}/products/mulberry-silk-eye-mask`,
    changeFrequency: "weekly",
    priority: 0.6,
    images: [
      { url: "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=800&q=80", title: "Mulberry Silk Eye Mask" },
    ],
  },
]

export const blogRoutes: SitemapEntry[] = [
  {
    url: `${baseUrl}/blog/art-of-peptide-layering`,
    changeFrequency: "monthly",
    priority: 0.6,
  },
  {
    url: `${baseUrl}/blog/meet-artisan-kazuo-tanaka`,
    changeFrequency: "monthly",
    priority: 0.6,
  },
  {
    url: `${baseUrl}/blog/fermented-beauty`,
    changeFrequency: "monthly",
    priority: 0.6,
  },
  {
    url: `${baseUrl}/blog/mindful-home-sanctuary`,
    changeFrequency: "monthly",
    priority: 0.6,
  },
  {
    url: `${baseUrl}/blog/ingredient-spotlight-ginseng`,
    changeFrequency: "monthly",
    priority: 0.6,
  },
  {
    url: `${baseUrl}/blog/tea-ceremony-daily-ritual`,
    changeFrequency: "monthly",
    priority: 0.6,
  },
]

export const categoryRoutes: SitemapEntry[] = [
  { url: `${baseUrl}/categories/beauty`, changeFrequency: "weekly", priority: 0.8 },
  { url: `${baseUrl}/categories/handmade-living`, changeFrequency: "weekly", priority: 0.8 },
]

export const allRoutes: SitemapEntry[] = [
  ...staticRoutes,
  ...productRoutes,
  ...blogRoutes,
  ...categoryRoutes,
]
