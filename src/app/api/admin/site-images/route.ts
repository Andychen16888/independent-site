import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { requireAdmin } from "@/lib/auth/admin-guard"
import { updateSiteSettings } from "@/lib/settings/settings"
import { IMAGE_SETTING_KEY } from "@/lib/settings/keys"
import {
  getSiteImageMap,
  getStorefrontCategories,
  serializeSiteImageMap,
} from "@/lib/settings/site-images"
import {
  SITE_IMAGE_SLOTS,
  SITE_IMAGE_GROUP_LABELS,
  LEGACY_COMMODITY_SLOT,
  commoditySlotKey,
  commoditySlotsForCategories,
} from "@/config/images"

function mergedSlots(categories: { slug: string; name: string }[]) {
  const dynamic = commoditySlotsForCategories(categories)
  return SITE_IMAGE_SLOTS.filter((s) => s.group !== "commodities").concat(dynamic)
}

export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req)
  if (authError) return authError

  const raw = await getSiteImageMap()
  const categories = await getStorefrontCategories()

  // Fold legacy commodity values (commodity.chemicals, …) into the matching
  // per-category slot so pre-existing uploads keep showing in the admin.
  const effective = { ...raw }
  for (const category of categories) {
    const key = commoditySlotKey(category.slug)
    if (effective[key]) continue
    const legacyKey = LEGACY_COMMODITY_SLOT[category.slug]
    if (legacyKey && raw[legacyKey]) effective[key] = raw[legacyKey]
  }

  return NextResponse.json({
    images: effective,
    slots: mergedSlots(categories),
    groups: SITE_IMAGE_GROUP_LABELS,
  })
}

export async function PUT(req: NextRequest) {
  const authError = await requireAdmin(req)
  if (authError) return authError

  const body = await req.json().catch(() => null)
  const images = body?.images
  if (!images || typeof images !== "object" || Array.isArray(images)) {
    return NextResponse.json({ error: "images object is required" }, { status: 400 })
  }

  const knownSlotKeys = new Set(SITE_IMAGE_SLOTS.map((s) => s.key))
  const categories = await getStorefrontCategories()
  for (const category of categories) knownSlotKeys.add(commoditySlotKey(category.slug))

  const clean: Record<string, string> = {}
  for (const [key, value] of Object.entries(images as Record<string, unknown>)) {
    if (!knownSlotKeys.has(key)) continue
    if (typeof value === "string" && value.trim()) clean[key] = value.trim()
  }

  await updateSiteSettings({ [IMAGE_SETTING_KEY]: serializeSiteImageMap(clean) })

  // Regenerate the storefront (all locales) so new photos appear on next request.
  revalidatePath("/", "layout")

  return NextResponse.json({ images: clean })
}
