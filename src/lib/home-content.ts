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
    title: "Factory-Direct B2B Sourcing",
    subtitle: "Sourced from China, delivered worldwide",
    description: "Quality electronics, LED lighting, and daily commodities at wholesale prices",
    cta: "Browse Products",
    href: "/products",
    bg: "bg-gradient-to-br from-sage/20 to-ivory",
    image: "/images/hero-electronics.jpg",
    align: "left",
  },
  {
    title: "Wholesale Pricing",
    subtitle: "Built for retailers and distributors",
    description: "Tiered bulk pricing, private label options, and reliable supply schedules",
    cta: "Explore Categories",
    href: "/categories/electronics",
    bg: "bg-gradient-to-bl from-blush/20 to-ivory",
    image: "/images/hero-wholesale.jpg",
    align: "right",
  },
  {
    title: "Quality You Can Trust",
    subtitle: "Certified goods, inspected every batch",
    description: "CE, FCC, and RoHS certified products with pre-shipment inspection",
    cta: "Our Story",
    href: "/pages/about",
    bg: "bg-gradient-to-tr from-gold/10 to-ivory",
    image: "/images/hero-lifestyle.jpg",
    align: "center",
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
    "We build long-term partnerships with certified manufacturers across China — from electronics factories in Shenzhen to kitchenware producers in Guangzhou — and inspect every batch before it ships.",
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
    image: "/images/category-electronics.jpg",
  },
  {
    title: "Home & Kitchen",
    subtitle: "Everyday Essentials",
    description: "Practical, durable goods sourced from certified factories",
    href: "/categories/home-kitchen",
    icon: "swatch",
    image: "/images/category-living.jpg",
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