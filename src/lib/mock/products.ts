export interface MockProduct {
  id: string
  name: string
  slug: string
  unitPrice: number
  originalPrice?: number | null
  stock: number
  isNew?: boolean
  isBestSeller?: boolean
  images?: { url: string; alt?: string | null }[]
  category?: "beauty" | "handmade-living"
}

export const mockProducts: MockProduct[] = [
  {
    id: "1", name: "Peptide Hydration Serum", slug: "peptide-hydration-serum",
    unitPrice: 78, originalPrice: 98, stock: 15, isNew: true, isBestSeller: true,
    images: [{ url: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&q=80" }],
    category: "beauty",
  },
  {
    id: "2", name: "Rice Bran Peptide Mask", slug: "rice-bran-peptide-mask",
    unitPrice: 12, stock: 100, isNew: true,
    images: [{ url: "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=400&q=80" }],
    category: "beauty",
  },
  {
    id: "3", name: "Ginseng Peptide Eye Cream", slug: "ginseng-peptide-eye-cream",
    unitPrice: 62, originalPrice: 78, stock: 18, isBestSeller: true,
    images: [{ url: "https://images.unsplash.com/photo-1621607512214-68297480165e?w=400&q=80" }],
    category: "beauty",
  },
  {
    id: "4", name: "Vitamin C Brightening Essence", slug: "vitamin-c-brightening-essence",
    unitPrice: 55, stock: 30, isNew: true,
    images: [{ url: "https://images.unsplash.com/photo-1599305090598-fe179d501227?w=400&q=80" }],
    category: "beauty",
  },
  {
    id: "5", name: "Raku Teacup Set", slug: "raku-teacup-set",
    unitPrice: 145, stock: 8, isNew: true, isBestSeller: true,
    images: [{ url: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=400&q=80" }],
    category: "handmade-living",
  },
  {
    id: "6", name: "Celadon Lotus Vase", slug: "celadon-lotus-vase",
    unitPrice: 230, originalPrice: 280, stock: 3, isNew: true,
    images: [{ url: "https://images.unsplash.com/photo-1581783898377-1c85bf937427?w=400&q=80" }],
    category: "handmade-living",
  },
  {
    id: "7", name: "Bamboo Incense Holder", slug: "bamboo-incense-holder",
    unitPrice: 38, stock: 50,
    images: [{ url: "https://images.unsplash.com/photo-1602872030216-3ae6e5f3e5e5?w=400&q=80" }],
    category: "handmade-living",
  },
  {
    id: "8", name: "Mulberry Silk Eye Mask", slug: "mulberry-silk-eye-mask",
    unitPrice: 48, originalPrice: 58, stock: 35, isBestSeller: true,
    images: [{ url: "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=400&q=80" }],
    category: "handmade-living",
  },
]

export function filterMockProducts(params: {
  sort?: string
  price?: string
  category?: string
  q?: string
}): MockProduct[] {
  let filtered = [...mockProducts]

  if (params.category) {
    filtered = filtered.filter((p) => p.category === params.category)
  }

  if (params.q) {
    const q = params.q.toLowerCase()
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q)
    )
  }

  if (params.price) {
    const [minStr, maxStr] = params.price.split("-")
    const min = Number(minStr)
    const max = maxStr ? Number(maxStr) : Infinity
    filtered = filtered.filter((p) => p.unitPrice >= min && p.unitPrice <= max)
  }

  if (params.sort) {
    switch (params.sort) {
      case "price-asc":
        filtered.sort((a, b) => a.unitPrice - b.unitPrice)
        break
      case "price-desc":
        filtered.sort((a, b) => b.unitPrice - a.unitPrice)
        break
      case "newest":
        filtered.sort((a, b) => Number(b.isNew) - Number(a.isNew) || a.unitPrice - b.unitPrice)
        break
      case "bestseller":
        filtered.sort((a, b) => Number(b.isBestSeller) - Number(a.isBestSeller) || a.unitPrice - b.unitPrice)
        break
    }
  }

  return filtered
}

export function filterByParam(
  products: MockProduct[],
  filter?: "bestseller" | "newest" | "featured"
): MockProduct[] {
  if (!filter) return products
  switch (filter) {
    case "bestseller":
      return products.filter((p) => p.isBestSeller)
    case "newest":
      return products.filter((p) => p.isNew)
    case "featured":
      return products.filter((p) => p.isBestSeller || p.isNew)
  }
}
