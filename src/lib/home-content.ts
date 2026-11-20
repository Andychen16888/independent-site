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
    title: "Quality Products, Delivered With Care",
    subtitle: "Your Trusted Partner",
    description: "Explore our range of products and discover how we can support your business with reliable service and competitive pricing.",
    cta: "View Products",
    href: "/products",
    bg: "bg-navy",
    align: "left",
  },
  {
    title: "A Team Focused on Your Needs",
    subtitle: "Get To Know Us",
    description: "From first enquiry to final delivery, our team works closely with you to make every step simple and dependable.",
    cta: "Why Us",
    href: "/pages/about",
    bg: "bg-navy",
    align: "left",
  },
  {
    title: "Need Something Specific?",
    subtitle: "Tell Us Your Requirement",
    description: "Send us your requirements and our team will respond quickly with the information, options and support you need.",
    cta: "Contact Us",
    href: "/pages/contact",
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
  title: "A Company Built on Quality and Service",
  paragraphs: [
    "We are a dedicated team supplying quality products to customers around the world.",
    "From sourcing to delivery, we focus on clear communication, dependable service and long-term partnerships. Add your own story here from Admin → Settings.",
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

export const DEFAULT_FEATURED_CATEGORIES: FeaturedCategory[] = []

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
  eyebrow: "Why Work With Us",
  title: "A Reliable Partner for Your Business",
  body: "We offer competitive pricing, consistent quality and responsive support. Edit this section at any time from Admin → Settings.",
  features: [
    { title: "Quality Products", description: "Carefully selected products for our customers" },
    { title: "Competitive Pricing", description: "Transparent pricing and flexible order options" },
    { title: "Fast Response", description: "We reply to enquiries quickly and clearly" },
    { title: "Reliable Service", description: "Support from enquiry through to delivery" },
  ],
  ctaLabel: "View All Products",
  ctaHref: "/products",
}

export interface Testimonial { name: string; location?: string; rating?: number; text: string; product?: string }

export const DEFAULT_TESTIMONIALS: Testimonial[] = []

export interface InstagramConfig {
  handle?: string
  handleUrl?: string
  tagline?: string
  posts?: string[]
}

export const DEFAULT_INSTAGRAM: InstagramConfig = {
  handle: "",
  handleUrl: "",
  tagline: "",
  posts: [],
}