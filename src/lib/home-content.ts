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
    title: "Bulk Commodities from China, Delivered to Your Market",
    subtitle: "Belt & Road Trade Specialists",
    description: "China's key industrial commodities — carbon black, PVC, metals, minerals and building materials — shipped to Southeast Asian and African buyers at competitive prices.",
    cta: "View Products",
    href: "/products",
    bg: "bg-navy",
    align: "left",
  },
  {
    title: "One Trading Partner, 20 Years of Exports",
    subtitle: "AAA-Rated Trade Service",
    description: "Backed by long-standing cooperation with Chinese SOEs, listed companies and large enterprises — traceable quality, honest pricing, fast response.",
    cta: "Why Us",
    href: "/pages/about",
    bg: "bg-navy",
    align: "left",
  },
  {
    title: "Looking for a Commodity Not Listed?",
    subtitle: "Tell Us Your Requirement",
    description: "Our team responds quickly to requests for any bulk commodity — send your specs and destination, and we handle sourcing, documentation and freight end to end.",
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
  title: "20 Years Connecting Chinese Industry with Global Buyers",
  paragraphs: [
    "We are a Chinese trading house that bridges the country's leading enterprises — state-owned groups, listed companies and large manufacturers — with overseas buyers in Southeast Asia, Africa and other Belt & Road markets.",
    "In two decades of exports we've built lasting business ties with well-known companies worldwide, earned an AAA credit rating, and kept our service fees lean. For commodities not listed on this site, just send us your requirement — we respond fast with quality, cost-effective supply.",
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
    title: "Chemical Products",
    subtitle: "Industrial Chemicals & Polymers",
    description: "Carbon black, PVC, PP, PE, titanium dioxide and zinc oxide for every downstream industry",
    href: "/categories/chemical-products",
  },
  {
    title: "Minerals & Powders",
    subtitle: "Industrial Minerals & Fillers",
    description: "Quartz sand, barite, talc, calcium carbonate, barium sulfate, wollastonite, fluorite and iron oxide pigments",
    href: "/categories/minerals",
  },
  {
    title: "Metals",
    subtitle: "Copper, Aluminum & Steel",
    description: "Billets, ingots and profiles trusted by distributors and fabricators across emerging markets",
    href: "/categories/metal-products",
  },
  {
    title: "Building Materials",
    subtitle: "Cement, Glass & Ceramics",
    description: "Cement clinker, float glass and building ceramics for infrastructure and construction projects",
    href: "/categories/building-materials",
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
  eyebrow: "Why Work With Us",
  title: "Your Cost-Effective Sourcing Partner",
  body: "We connect Chinese SOEs, listed companies and large enterprises with overseas mid-sized buyers — charging lean service fees, responding fast, and delivering quality commodities at competitive prices.",
  features: [
    {
      title: "Cheap Service Fees",
      description: "Lean, transparent charges — you pay for the goods and freight, not inflated middleman margins",
    },
    {
      title: "Factory Access at Scale",
      description: "Direct cooperation with Chinese state-owned enterprises, listed companies and major manufacturers",
    },
    {
      title: "Fast Response to Any Inquiry",
      description: "Commodity not listed? Send your requirement and our team responds quickly with a quotation",
    },
    {
      title: "20 Years, AAA Credit",
      description: "Two decades of export experience and business ties with well-known companies worldwide",
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
  eyebrow: "Commodities We Export",
  title: "Bulk Products for Growing Markets",
  tagline: "Fast-growing commodity lines for importers and distributors across Southeast Asia, Africa and other Belt & Road economies",
  collections: [
    { title: "Chemical & Polymer", description: "Carbon black, PVC, PP, PE, titanium dioxide and zinc oxide", href: "/categories/chemical-products" },
    { title: "Minerals & Powders", description: "Quartz sand, barite, talc, calcium carbonate and more", href: "/categories/minerals" },
    { title: "Metals", description: "Copper, aluminum and steel for industry and construction", href: "/categories/metal-products" },
    { title: "Building Materials", description: "Cement clinker, float glass and building ceramics", href: "/categories/building-materials" },
  ],
  ctaLabel: "View All Products",
  ctaHref: "/products",
}

export interface Testimonial { name: string; location?: string; rating?: number; text: string; product?: string }

export const DEFAULT_TESTIMONIALS: Testimonial[] = [
  {
    name: "Siti Rahayu",
    location: "Jakarta, Indonesia",
    rating: 5,
    text: "We import carbon black and PVC resin for our plastic manufacturing lines. Consistent quality, honest pricing, and the team responds to every enquiry within hours. A trading partner we can rely on.",
    product: "Carbon Black & PVC Resin",
  },
  {
    name: "Kevin Okafor",
    location: "Lagos, Nigeria",
    rating: 5,
    text: "They quoted our aluminum and steel order quickly, handled all export documentation, and the goods arrived exactly to spec. Their 20 years of experience show in every shipment.",
    product: "Aluminum & Steel",
  },
  {
    name: "Nguyen Thanh",
    location: "Ho Chi Minh City, Vietnam",
    rating: 5,
    text: "I requested a commodity that wasn't on their site — cement clinker for our trading business. They responded fast, sourced it from a major Chinese supplier, and the terms were excellent.",
    product: "Cement Clinker",
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