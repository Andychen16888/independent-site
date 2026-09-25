import { cache } from "react"
import { prisma } from "@/lib/db/prisma"
import { getSiteSettings } from "./settings"
import { IMAGE_SETTING_KEY } from "./keys"
import {
  SITE_IMAGE_SLOTS,
  DEFAULT_SITE_IMAGES,
  slotsForGroup,
  LEGACY_COMMODITY_SLOT,
  commoditySlotKey,
  categoryFallbackTone,
  type ImageAsset,
  type SiteImageGroup,
  type CategorySlotSeed,
} from "@/config/images"

/** Slot key -> uploaded URL. Empty when nothing has been uploaded. */
export type SiteImageMap = Record<string, string>

/** Active storefront categories that back the "Commodity Categories" image group. */
export const getStorefrontCategories = cache(async (): Promise<CategorySlotSeed[]> => {
  const rows = await prisma.category.findMany({
    where: { isActive: true },
    select: { slug: true, name: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  })
  return rows.map((r) => ({ slug: r.slug, name: r.name }))
})

export function parseSiteImageMap(raw: string | undefined): SiteImageMap {
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const out: SiteImageMap = {}
      for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
        if (typeof value === "string" && value.trim()) out[key] = value
      }
      return out
    }
  } catch {
    // ignore malformed JSON
  }
  return {}
}

export function serializeSiteImageMap(map: SiteImageMap): string {
  const clean: SiteImageMap = {}
  for (const [key, value] of Object.entries(map)) {
    if (typeof value === "string" && value.trim()) clean[key] = value.trim()
  }
  return JSON.stringify(clean)
}

export const getSiteImageMap = cache(async (): Promise<SiteImageMap> => {
  const settings = await getSiteSettings()
  return parseSiteImageMap(settings[IMAGE_SETTING_KEY])
})

/**
 * Every slot resolved to the uploaded URL (when present) or its default path.
 * Cached per request and safe to call from multiple server components.
 */
export const getResolvedSiteImages = cache(async (): Promise<Record<string, ImageAsset>> => {
  const map = await getSiteImageMap()
  const out: Record<string, ImageAsset> = {}
  for (const slot of SITE_IMAGE_SLOTS) {
    const fallback = DEFAULT_SITE_IMAGES[slot.key]
    out[slot.key] = { ...fallback, src: map[slot.key] || fallback.src }
  }
  // Dynamic per-category commodity slots (one per active storefront category).
  const categories = await getStorefrontCategories()
  for (const category of categories) {
    const key = commoditySlotKey(category.slug)
    if (out[key]) continue
    const legacyKey = LEGACY_COMMODITY_SLOT[category.slug]
    const legacyAsset = legacyKey ? out[legacyKey] : undefined
    out[key] = {
      src: map[key] || legacyAsset?.src || null,
      alt: legacyAsset?.alt ?? `${category.name} category cover`,
      tone: legacyAsset?.tone ?? categoryFallbackTone(category.slug),
    }
  }
  return out
})

export function groupImages(
  all: Record<string, ImageAsset>,
  group: SiteImageGroup,
): ImageAsset[] {
  return slotsForGroup(group).map((s) => all[s.key] || DEFAULT_SITE_IMAGES[s.key])
}

export function imageByKey(
  all: Record<string, ImageAsset>,
  key: string,
): ImageAsset {
  return all[key] || DEFAULT_SITE_IMAGES[key]
}

export async function getGroupedSiteImages() {
  const all = await getResolvedSiteImages()
  return {
    hero: groupImages(all, "hero"),
    commodities: groupImages(all, "commodities"),
    supplyChain: groupImages(all, "supplyChain"),
    process: groupImages(all, "process"),
    about: groupImages(all, "about"),
    port: imageByKey(all, "port"),
    global: imageByKey(all, "global"),
    all,
  }
}
