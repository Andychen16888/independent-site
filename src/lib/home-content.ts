export interface HeroSlide {
  title: string
  subtitle?: string
  description?: string
  cta?: string
  href?: string
  bg?: string
  image?: string
  align?: "left" | "center" | "right" | string
}

export const DEFAULT_HERO_SLIDES: HeroSlide[] = [
  {
    title: "Sourced in China, Delivered Worldwide",
    subtitle: "Bulk Commodities & Wholesale Supply",
    description: "A single sourcing partner for bulk goods — factory access, quality control and freight coordinated end to end.",
    cta: "View Products",
    href: "/products",
    bg: "bg-navy",
    align: "left",
  },
  {
    title: "One Connected Supply Chain",
    subtitle: "Factory to Port to Buyer",
    description: "From manufacturing and inspection to warehousing and shipping, every stage is coordinated for predictable delivery.",
    cta: "Explore Commodities",
    href: "/products",
    bg: "bg-navy",
    align: "left",
  },
  {
    title: "Built for International Buyers",
    subtitle: "Wholesale & Distribution",
    description: "Support for importers, distributors and retailers sourcing from China at scale.",
    cta: "How It Works",
    href: "/pages/about",
    bg: "bg-navy",
    align: "left",
  },
]

export interface BrandStoryContent {
  eyebrow?: string
  title: string
  paragraphs?: string[]
  image?: string
  ctaLabel?: string
  ctaHref?: string
}

export const DEFAULT_BRAND_STORY: BrandStoryContent = {
  eyebrow: "Our Story",
  title: "Quality Goods, Direct from the Source",
  paragraphs: [
    "Commodities From China was founded on a simple belief — that quality goods should move directly from Chinese makers to buyers around the world, without unnecessary layers and markup.",
    "We build long-term partnerships with manufacturing partners across China and inspect goods before they ship, so buyers can source with confidence.",
  ],
  ctaLabel: "Read Our Story",
  ctaHref: "/pages/about",
}

export interface FeaturedCategory {
  title: string
  subtitle?: string
  description?: string
  href: string
  image?: string
  icon?: "sparkles" | "swatch" | "bag"
}

export const DEFAULT_FEATURED_CATEGORIES: FeaturedCategory[] = [
  {
    title: "Electronics",
    subtitle: "LED & Smart Devices",
    description: "Certified electronics and LED lighting at wholesale prices",
    href: "/categories/electronics",
    icon: "sparkles",
  },
  {
    title: "Home & Kitchen",
    subtitle: "Everyday Essentials",
    description: "Practical, durable goods sourced from certified factories",
    href: "/categories/home-kitchen",
    icon: "swatch",
  },
]

export interface FeatureItem { title: string; description: string }

export interface PromoContent {
  eyebrow?: string
  title: string
  body?: string
  features?: FeatureItem[]
  image?: string
  ctaLabel?: string
  ctaHref?: string
}

export const DEFAULT_PROMO: PromoContent = {
  eyebrow: "Why Buy Direct",
  title: "Factory-Direct Electronics",
  body: "We partner with certified manufacturers across China to bring you quality electronics at wholesale prices — tested, documented, and shipped worldwide.",
  features: [
    {
      title: "Certified Quality",
      description: "CE, FCC, and RoHS certified products verified before shipment",
    },
    {
      title: "Factory-Direct Pricing",
      description: "Wholesale rates without middlemen or retail markups",
    },
    {
      title: "Low MOQ Options",
      description: "Start small with standard SKUs, scale up as you grow",
    },
    {
      title: "Global Logistics",
      description: "Air and sea freight options with tracking to your door",
    },
  ],
  ctaLabel: "View All Products",
  ctaHref: "/products",
}

export interface CollectionItem { title: string; description?: string; href: string }

export interface CollectionContent {
  eyebrow?: string
  title: string
  tagline?: string
  collections?: CollectionItem[]
  ctaLabel?: string
  ctaHref?: string
}

export const DEFAULT_COLLECTIONS: CollectionContent = {
  eyebrow: "Home & Kitchen",
  title: "Everyday Essentials",
  tagline: "Practical, durable goods for homes, hotels, and wholesale buyers",
  collections: [
    { title: "Kitchenware", description: "Cookware, dinnerware, and barware staples", href: "/categories/home-kitchen?sub=kitchenware" },
    { title: "Storage", description: "Containers and organizers for every room", href: "/categories/home-kitchen?sub=storage" },
    { title: "Tableware", description: "Dinnerware sets for homes and hospitality", href: "/categories/home-kitchen?sub=tableware" },
    { title: "Home Decor", description: "Functional decor loved by resellers", href: "/categories/home-kitchen?sub=decor" },
  ],
  ctaLabel: "Explore Home & Kitchen",
  ctaHref: "/categories/home-kitchen",
}

export interface Testimonial { name: string; location?: string; rating?: number; text: string; product?: string }

export const DEFAULT_TESTIMONIALS: Testimonial[] = [
  {
    name: "Marcus L.",
    location: "Hamburg, Germany",
    rating: 5,
    text: "We resell the LED night lights and power banks in our retail stores. Consistent quality, on-time shipments, and pricing that leaves real margin. They've become our go-to supplier.",
    product: "LED Motion Sensor Night Light",
  },
  {
    name: "Aline B.",
    location: "Lyon, France",
    rating: 5,
    text: "The ceramic dinnerware set sells out every season. Pre-shipment inspection photos and certificates give us total confidence, and the MOQ was flexible enough for us to start small.",
    product: "Ceramic Dinnerware Set",
  },
  {
    name: "Dong-mei H.",
    location: "Singapore",
    rating: 5,
    text: "Finally a sourcing partner that handles quality control and freight end to end. Our first order of TWS earbuds arrived on time and defect-free. Highly recommended for B2B buyers.",
    product: "TWS Wireless Earbuds Pro",
  },
]

export interface InstagramConfig {
  handle?: string
  handleUrl?: string
  tagline?: string
  posts?: string[]
}

export const DEFAULT_INSTAGRAM: InstagramConfig = {
  handle: "@commoditychina",
  handleUrl: "https://instagram.com/commoditychina",
  tagline: "Tag us @commoditychina for a chance to be featured",
  posts: [],
}