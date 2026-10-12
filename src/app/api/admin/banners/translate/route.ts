import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth/admin-guard"
import {
  translateBannerText,
  isAutoTranslateConfigured,
  BANNER_TRANSLATE_LOCALES,
  type BannerTranslationSource,
} from "@/lib/ai/translate-banner"

export const runtime = "nodejs"
export const maxDuration = 300

/**
 * Stateless AI translation for the banner editor. Accepts the current English
 * source (plus optional target locales) and returns per-locale translations.
 * Nothing is persisted — the admin form previews/edits and saves normally.
 */
export async function POST(req: NextRequest) {
  const authError = await requireAdmin(req)
  if (authError) return authError

  try {
    const body = await req.json().catch(() => ({}))
    const source: BannerTranslationSource = {
      eyebrow: body.eyebrow || null,
      title: body.title || "",
      subtitle: body.subtitle || null,
      description: body.description || null,
      ctaText: body.ctaText || null,
    }

    if (!source.title || !source.title.trim()) {
      return NextResponse.json({ error: "Title is required to translate" }, { status: 400 })
    }
    if (!isAutoTranslateConfigured()) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not configured on the server" },
        { status: 400 }
      )
    }

    const requested = Array.isArray(body.locales) && body.locales.length
      ? (body.locales as string[])
      : BANNER_TRANSLATE_LOCALES

    const { translations, failed } = await translateBannerText(source, requested)
    return NextResponse.json({ translations, failed })
  } catch (error) {
    console.error("Admin banner translate error:", error)
    return NextResponse.json(
      { error: (error as Error).message || "Failed to translate banner" },
      { status: 500 }
    )
  }
}
