import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth/admin-guard"
import { loadFooterDefaults } from "@/lib/settings/footer-defaults"
import {
  FOOTER_CONTENT_KEY,
  normalizeFooterContent,
  parseFooterContent,
  serializeFooterContent,
} from "@/lib/settings/footer"
import { invalidateStorefront } from "@/lib/settings/invalidate-storefront"
import { getSiteSettings, updateSiteSettings } from "@/lib/settings/settings"

export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req)
  if (authError) return authError

  const [settings, defaults] = await Promise.all([getSiteSettings(), loadFooterDefaults()])
  return NextResponse.json({
    content: parseFooterContent(settings[FOOTER_CONTENT_KEY]),
    defaults,
    fallback: {
      brief: settings["company.brief"] || "",
      address: settings["company.address"] || "",
    },
  })
}

export async function PUT(req: NextRequest) {
  const authError = await requireAdmin(req)
  if (authError) return authError

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const source = body as { content?: unknown } | null
  const content = normalizeFooterContent(source?.content)
  if (!content) {
    return NextResponse.json(
      { error: "content must be an object of locale -> { brief, address } strings" },
      { status: 400 }
    )
  }

  await updateSiteSettings({ [FOOTER_CONTENT_KEY]: serializeFooterContent(content) })
  invalidateStorefront()

  return NextResponse.json({ content })
}
