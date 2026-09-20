/**
 * Central image configuration.
 *
 * Every storefront image is referenced from here so that `src` paths,
 * alt text and placeholder tones stay in one place. Append the real
 * photograph to `public/` at the documented path and it activates
 * automatically — no component changes required.
 *
 * Suggested upload locations (create the folders when you add photos):
 *   public/images/hero/…
 *   public/images/commodities/…
 *   public/images/supply-chain/…
 *   public/images/process/…
 *   public/images/port/…
 *   public/images/global/…
 *   public/images/about/…
 */

export interface ImageAsset {
  /** Path under /public. `null` renders the tone placeholder only. */
  src: string | null
  /** Meaningful, non-keyword-stuffed alt text. */
  alt: string
  /** Tailwind gradient classes for the placeholder / loading state. */
  tone: string
}

const NAVY_TONES = {
  deep: "from-navy-dark via-navy to-navy-light",
  steel: "from-ink via-charcoal to-steel",
  slate: "from-navy-light via-steel to-sand",
  warm: "from-charcoal via-navy-light to-blush",
  earth: "from-ink via-navy to-sage",
  dawn: "from-navy via-blush to-sand",
} as const

/* -------------------------------------------------------------------------- */
/* Hero                                                                       */
/* -------------------------------------------------------------------------- */

export const heroImages: ImageAsset[] = [
  {
    src: "/images/hero/china-container-port.jpg",
    alt: "Container terminal at a Chinese export port at dusk",
    tone: NAVY_TONES.deep,
  },
  {
    src: "/images/hero/factory-production-line.jpg",
    alt: "Production line inside a modern Chinese manufacturing facility",
    tone: NAVY_TONES.steel,
  },
  {
    src: "/images/hero/global-logistics.jpg",
    alt: "Freight ship carrying export cargo across the ocean",
    tone: NAVY_TONES.slate,
  },
]

/* -------------------------------------------------------------------------- */
/* Commodities                                                                */
/* -------------------------------------------------------------------------- */

export type CommodityKey =
  | "chemicals"
  | "metals"
  | "minerals"
  | "energy"
  | "agriculture"
  | "industrial"

export const commodityImages: Record<CommodityKey, ImageAsset> = {
  chemicals: {
    src: "/images/commodities/chemicals.jpg",
    alt: "Industrial chemical processing and storage",
    tone: NAVY_TONES.steel,
  },
  metals: {
    src: "/images/commodities/metals.jpg",
    alt: "Stacked steel coils and metal billets in a warehouse",
    tone: NAVY_TONES.slate,
  },
  minerals: {
    src: "/images/commodities/minerals.jpg",
    alt: "Bulk mineral ore and aggregates",
    tone: NAVY_TONES.earth,
  },
  energy: {
    src: "/images/commodities/energy.jpg",
    alt: "Energy sector storage and distribution infrastructure",
    tone: NAVY_TONES.deep,
  },
  agriculture: {
    src: "/images/commodities/agriculture.jpg",
    alt: "Bulk agricultural produce prepared for export",
    tone: NAVY_TONES.warm,
  },
  industrial: {
    src: "/images/commodities/industrial.jpg",
    alt: "Heavy industrial materials and machinery components",
    tone: NAVY_TONES.steel,
  },
}

/* -------------------------------------------------------------------------- */
/* Supply chain                                                               */
/* -------------------------------------------------------------------------- */

export const supplyChainImages: ImageAsset[] = [
  {
    src: "/images/supply-chain/factory.jpg",
    alt: "Manufacturing partners on the production floor",
    tone: NAVY_TONES.steel,
  },
  {
    src: "/images/supply-chain/warehouse.jpg",
    alt: "Organised export warehouse with palletised goods",
    tone: NAVY_TONES.slate,
  },
  {
    src: "/images/supply-chain/quality-control.jpg",
    alt: "Quality control inspection of goods before shipment",
    tone: NAVY_TONES.earth,
  },
  {
    src: "/images/supply-chain/logistics.jpg",
    alt: "Freight containers being loaded for international shipping",
    tone: NAVY_TONES.deep,
  },
]

/* -------------------------------------------------------------------------- */
/* Sourcing process                                                           */
/* -------------------------------------------------------------------------- */

export const processImages: ImageAsset[] = [
  {
    src: "/images/process/factory.jpg",
    alt: "Sourcing from the factory",
    tone: NAVY_TONES.steel,
  },
  {
    src: "/images/process/inspection.jpg",
    alt: "Inspection and quality checks",
    tone: NAVY_TONES.slate,
  },
  {
    src: "/images/process/warehouse.jpg",
    alt: "Consolidation and warehousing",
    tone: NAVY_TONES.earth,
  },
  {
    src: "/images/process/port.jpg",
    alt: "Export port handling",
    tone: NAVY_TONES.deep,
  },
  {
    src: "/images/process/shipping.jpg",
    alt: "International freight shipping",
    tone: NAVY_TONES.slate,
  },
  {
    src: "/images/process/buyer.jpg",
    alt: "Delivery to the overseas buyer",
    tone: NAVY_TONES.warm,
  },
]

/* -------------------------------------------------------------------------- */
/* Standalone banners                                                         */
/* -------------------------------------------------------------------------- */

export const portImage: ImageAsset = {
  src: "/images/port/china-port-banner.jpg",
  alt: "Aerial view of a Chinese port handling global export cargo",
  tone: NAVY_TONES.deep,
}

export const globalImage: ImageAsset = {
  src: "/images/global/world-network.png",
  alt: "Global trade routes connecting China with international markets",
  tone: NAVY_TONES.steel,
}

export const aboutImages: ImageAsset[] = [
  {
    src: "/images/about/factory.jpg",
    alt: "Manufacturing facility",
    tone: NAVY_TONES.steel,
  },
  {
    src: "/images/about/warehouse.jpg",
    alt: "Warehouse and consolidation",
    tone: NAVY_TONES.slate,
  },
  {
    src: "/images/about/port.jpg",
    alt: "Export port operations",
    tone: NAVY_TONES.deep,
  },
  {
    src: "/images/about/logistics.jpg",
    alt: "International logistics",
    tone: NAVY_TONES.earth,
  },
]

/* -------------------------------------------------------------------------- */
/* Category fallback (database categories are dynamic)                        */
/* -------------------------------------------------------------------------- */

const CATEGORY_TONE_POOL = [
  NAVY_TONES.steel,
  NAVY_TONES.slate,
  NAVY_TONES.earth,
  NAVY_TONES.deep,
  NAVY_TONES.warm,
]

/** Deterministic placeholder tone for a category slug. */
export function categoryFallbackTone(slug: string): string {
  let hash = 0
  for (let i = 0; i < slug.length; i++) hash = (hash * 31 + slug.charCodeAt(i)) >>> 0
  return CATEGORY_TONE_POOL[hash % CATEGORY_TONE_POOL.length]
}

/** Optional real photograph per category slug. */
export const categoryImages: Record<string, string> = {
  // "chemicals": "/images/commodities/chemicals.jpg",
}
