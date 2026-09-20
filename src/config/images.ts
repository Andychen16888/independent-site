/**
 * Central image registry.
 *
 * Every storefront image is a named "slot". Each slot has a default path and
 * an admin-managed override stored in site settings (see /admin/images).
 * `resolveSiteImages()` merges the uploaded URL over the default so a photo
 * uploaded from the dashboard activates automatically.
 *
 * Suggested (optional) default file locations, used only when no photo has
 * been uploaded for a slot:
 *   public/images/hero/…  commodities/…  supply-chain/…  process/…  port/…  global/…  about/…
 */

export interface ImageAsset {
  /** Resolved URL. `null` renders the tone placeholder only. */
  src: string | null
  /** Meaningful, non-keyword-stuffed alt text. */
  alt: string
  /** Tailwind gradient classes for the placeholder / loading state. */
  tone: string
}

export type SiteImageGroup =
  | "hero"
  | "commodities"
  | "supplyChain"
  | "process"
  | "port"
  | "global"
  | "about"

export interface SiteImageSlot {
  key: string
  group: SiteImageGroup
  label: string
  alt: string
  tone: string
  defaultSrc: string | null
}

const TONES = {
  deep: "from-navy-dark via-navy to-navy-light",
  steel: "from-ink via-charcoal to-steel",
  slate: "from-navy-light via-steel to-sand",
  warm: "from-charcoal via-navy-light to-blush",
  earth: "from-ink via-navy to-sage",
  dawn: "from-navy via-blush to-sand",
} as const

/* -------------------------------------------------------------------------- */
/* Slot registry (single source of truth for defaults + admin labels)          */
/* -------------------------------------------------------------------------- */

export const SITE_IMAGE_SLOTS: SiteImageSlot[] = [
  // Hero
  {
    key: "hero.0",
    group: "hero",
    label: "Hero Slide 1",
    alt: "Container terminal at a Chinese export port at dusk",
    tone: TONES.deep,
    defaultSrc: "/images/hero/china-container-port.jpg",
  },
  {
    key: "hero.1",
    group: "hero",
    label: "Hero Slide 2",
    alt: "Production line inside a modern Chinese manufacturing facility",
    tone: TONES.steel,
    defaultSrc: "/images/hero/factory-production-line.jpg",
  },
  {
    key: "hero.2",
    group: "hero",
    label: "Hero Slide 3",
    alt: "Freight ship carrying export cargo across the ocean",
    tone: TONES.slate,
    defaultSrc: "/images/hero/global-logistics.jpg",
  },

  // Commodities
  { key: "commodity.chemicals", group: "commodities", label: "Chemicals", alt: "Industrial chemical processing and storage", tone: TONES.steel, defaultSrc: "/images/commodities/chemicals.jpg" },
  { key: "commodity.metals", group: "commodities", label: "Metals", alt: "Stacked steel coils and metal billets in a warehouse", tone: TONES.slate, defaultSrc: "/images/commodities/metals.jpg" },
  { key: "commodity.minerals", group: "commodities", label: "Minerals", alt: "Bulk mineral ore and aggregates", tone: TONES.earth, defaultSrc: "/images/commodities/minerals.jpg" },
  { key: "commodity.energy", group: "commodities", label: "Energy", alt: "Energy sector storage and distribution infrastructure", tone: TONES.deep, defaultSrc: "/images/commodities/energy.jpg" },
  { key: "commodity.agriculture", group: "commodities", label: "Agricultural Commodities", alt: "Bulk agricultural produce prepared for export", tone: TONES.warm, defaultSrc: "/images/commodities/agriculture.jpg" },
  { key: "commodity.industrial", group: "commodities", label: "Industrial Materials", alt: "Heavy industrial materials and machinery components", tone: TONES.steel, defaultSrc: "/images/commodities/industrial.jpg" },

  // Supply chain
  { key: "supplyChain.0", group: "supplyChain", label: "Supply Chain — Factory", alt: "Manufacturing partners on the production floor", tone: TONES.steel, defaultSrc: "/images/supply-chain/factory.jpg" },
  { key: "supplyChain.1", group: "supplyChain", label: "Supply Chain — Warehouse", alt: "Organised export warehouse with palletised goods", tone: TONES.slate, defaultSrc: "/images/supply-chain/warehouse.jpg" },
  { key: "supplyChain.2", group: "supplyChain", label: "Supply Chain — Quality Control", alt: "Quality control inspection of goods before shipment", tone: TONES.earth, defaultSrc: "/images/supply-chain/quality-control.jpg" },
  { key: "supplyChain.3", group: "supplyChain", label: "Supply Chain — Logistics", alt: "Freight containers being loaded for international shipping", tone: TONES.deep, defaultSrc: "/images/supply-chain/logistics.jpg" },

  // Sourcing process
  { key: "process.0", group: "process", label: "Process — Factory", alt: "Sourcing from the factory", tone: TONES.steel, defaultSrc: "/images/process/factory.jpg" },
  { key: "process.1", group: "process", label: "Process — Inspection", alt: "Inspection and quality checks", tone: TONES.slate, defaultSrc: "/images/process/inspection.jpg" },
  { key: "process.2", group: "process", label: "Process — Warehouse", alt: "Consolidation and warehousing", tone: TONES.earth, defaultSrc: "/images/process/warehouse.jpg" },
  { key: "process.3", group: "process", label: "Process — Port", alt: "Export port handling", tone: TONES.deep, defaultSrc: "/images/process/port.jpg" },
  { key: "process.4", group: "process", label: "Process — Shipping", alt: "International freight shipping", tone: TONES.slate, defaultSrc: "/images/process/shipping.jpg" },
  { key: "process.5", group: "process", label: "Process — Buyer", alt: "Delivery to the overseas buyer", tone: TONES.warm, defaultSrc: "/images/process/buyer.jpg" },

  // Standalone banners
  { key: "port", group: "port", label: "Port Banner", alt: "Aerial view of a Chinese port handling global export cargo", tone: TONES.deep, defaultSrc: "/images/port/china-port-banner.jpg" },
  { key: "global", group: "global", label: "Global Network Map", alt: "Global trade routes connecting China with international markets", tone: TONES.steel, defaultSrc: "/images/global/world-network.png" },

  // About
  { key: "about.0", group: "about", label: "About — Factory", alt: "Manufacturing facility", tone: TONES.steel, defaultSrc: "/images/about/factory.jpg" },
  { key: "about.1", group: "about", label: "About — Warehouse", alt: "Warehouse and consolidation", tone: TONES.slate, defaultSrc: "/images/about/warehouse.jpg" },
  { key: "about.2", group: "about", label: "About — Port", alt: "Export port operations", tone: TONES.deep, defaultSrc: "/images/about/port.jpg" },
  { key: "about.3", group: "about", label: "About — Logistics", alt: "International logistics", tone: TONES.earth, defaultSrc: "/images/about/logistics.jpg" },
]

export const SITE_IMAGE_GROUP_LABELS: Record<SiteImageGroup, string> = {
  hero: "Homepage Hero",
  commodities: "Commodity Categories",
  supplyChain: "China Supply Chain",
  process: "Sourcing Process",
  port: "Port Banner",
  global: "Global Network",
  about: "About & Story",
}

export const DEFAULT_SITE_IMAGES: Record<string, ImageAsset> = Object.fromEntries(
  SITE_IMAGE_SLOTS.map((s) => [s.key, { src: s.defaultSrc, alt: s.alt, tone: s.tone }]),
)

export function slotsForGroup(group: SiteImageGroup): SiteImageSlot[] {
  return SITE_IMAGE_SLOTS.filter((s) => s.group === group)
}

/* -------------------------------------------------------------------------- */
/* Static defaults (fallbacks used when a group is not resolved server-side)  */
/* -------------------------------------------------------------------------- */

export const heroImages: ImageAsset[] = slotsForGroup("hero").map((s) => DEFAULT_SITE_IMAGES[s.key])
export const supplyChainImages: ImageAsset[] = slotsForGroup("supplyChain").map((s) => DEFAULT_SITE_IMAGES[s.key])
export const processImages: ImageAsset[] = slotsForGroup("process").map((s) => DEFAULT_SITE_IMAGES[s.key])
export const aboutImages: ImageAsset[] = slotsForGroup("about").map((s) => DEFAULT_SITE_IMAGES[s.key])
export const portImage: ImageAsset = DEFAULT_SITE_IMAGES["port"]
export const globalImage: ImageAsset = DEFAULT_SITE_IMAGES["global"]

/* -------------------------------------------------------------------------- */
/* Commodities                                                                */
/* -------------------------------------------------------------------------- */

export type CommodityKey = "chemicals" | "metals" | "minerals" | "energy" | "agriculture" | "industrial"

export const commodityImages: Record<CommodityKey, ImageAsset> = {
  chemicals: DEFAULT_SITE_IMAGES["commodity.chemicals"],
  metals: DEFAULT_SITE_IMAGES["commodity.metals"],
  minerals: DEFAULT_SITE_IMAGES["commodity.minerals"],
  energy: DEFAULT_SITE_IMAGES["commodity.energy"],
  agriculture: DEFAULT_SITE_IMAGES["commodity.agriculture"],
  industrial: DEFAULT_SITE_IMAGES["commodity.industrial"],
}

/* -------------------------------------------------------------------------- */
/* Category fallback (database categories are dynamic)                        */
/* -------------------------------------------------------------------------- */

const CATEGORY_TONE_POOL = [TONES.steel, TONES.slate, TONES.earth, TONES.deep, TONES.warm]

/** Deterministic placeholder tone for a category slug. */
export function categoryFallbackTone(slug: string): string {
  let hash = 0
  for (let i = 0; i < slug.length; i++) hash = (hash * 31 + slug.charCodeAt(i)) >>> 0
  return CATEGORY_TONE_POOL[hash % CATEGORY_TONE_POOL.length]
}

/** Optional real photograph per category slug. */
export const categoryImages: Record<string, string> = {}
