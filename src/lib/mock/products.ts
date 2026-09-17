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
  category?: "electronics" | "home-kitchen"
}

export const mockProducts: MockProduct[] = [
  {
    id: "1", name: "LED Motion Sensor Night Light", slug: "led-motion-sensor-night-light",
    unitPrice: 9.9, originalPrice: 14.5, stock: 500, isNew: true, isBestSeller: true,
    images: [{ url: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&q=80" }],
    category: "electronics",
  },
  {
    id: "2", name: "Portable Power Bank 20000mAh", slug: "portable-power-bank-20000mah",
    unitPrice: 24.5, stock: 300, isNew: true,
    images: [{ url: "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=400&q=80" }],
    category: "electronics",
  },
  {
    id: "3", name: "TWS Wireless Earbuds Pro", slug: "tws-wireless-earbuds-pro",
    unitPrice: 32, originalPrice: 45, stock: 250, isBestSeller: true,
    images: [{ url: "https://images.unsplash.com/photo-1621607512214-68297480165e?w=400&q=80" }],
    category: "electronics",
  },
  {
    id: "4", name: "Smart LED Strip Light Kit", slug: "smart-led-strip-light-kit",
    unitPrice: 15.5, stock: 400, isNew: true,
    images: [{ url: "https://images.unsplash.com/photo-1599305090598-fe179d501227?w=400&q=80" }],
    category: "electronics",
  },
  {
    id: "5", name: "Ceramic Dinnerware Set", slug: "ceramic-dinnerware-set",
    unitPrice: 68, stock: 120, isNew: true, isBestSeller: true,
    images: [{ url: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=400&q=80" }],
    category: "home-kitchen",
  },
  {
    id: "6", name: "Stainless Steel Insulated Mug", slug: "stainless-steel-insulated-mug",
    unitPrice: 12, originalPrice: 16, stock: 350, isNew: true,
    images: [{ url: "https://images.unsplash.com/photo-1581783898377-1c85bf937427?w=400&q=80" }],
    category: "home-kitchen",
  },
  {
    id: "7", name: "Non-Stick Cookware Set", slug: "non-stick-cookware-set",
    unitPrice: 88, stock: 80,
    images: [{ url: "https://images.unsplash.com/photo-1602872030216-3ae6e5f3e5e5?w=400&q=80" }],
    category: "home-kitchen",
  },
  {
    id: "8", name: "Ceramic Dinnerware Set — 32-Piece", slug: "ceramic-dinnerware-set-32",
    unitPrice: 92, originalPrice: 110, stock: 60, isBestSeller: true,
    images: [{ url: "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=400&q=80" }],
    category: "home-kitchen",
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
