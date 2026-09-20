import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { requireAdmin } from "@/lib/auth/admin-guard"
import { updateSiteSettings } from "@/lib/settings/settings"
import { IMAGE_SETTING_KEY } from "@/lib/settings/keys"
import { getSiteImageMap, serializeSiteImageMap } from "@/lib/settings/site-images"
import { SITE_IMAGE_SLOTS, SITE_IMAGE_GROUP_LABELS } from "@/config/images"

const KNOWN_SLOT_KEYS = new Set(SITE_IMAGE_SLOTS.map((s) => s.key))

export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req)
  if (authError) return authError

  const images = await getSiteImageMap()

  return NextResponse.json({
    images,
    slots: SITE_IMAGE_SLOTS,
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

  const clean: Record<string, string> = {}
  for (const [key, value] of Object.entries(images as Record<string, unknown>)) {
    if (!KNOWN_SLOT_KEYS.has(key)) continue
    if (typeof value === "string" && value.trim()) clean[key] = value.trim()
  }

  await updateSiteSettings({ [IMAGE_SETTING_KEY]: serializeSiteImageMap(clean) })

  // Regenerate the storefront (all locales) so new photos appear on next request.
  revalidatePath("/", "layout")

  return NextResponse.json({ images: clean })
}
