import OpenAI from "openai"
import { SUPPORTED_CONTENT_LOCALES } from "@/lib/i18n/content"
import { LOCALE_NAMES_EN } from "@/lib/i18n/locales"

export const AUTO_TRANSLATE_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini"

export const BANNER_TRANSLATE_LOCALES: readonly string[] = SUPPORTED_CONTENT_LOCALES.filter(
  (locale) => locale !== "en"
)

export interface BannerTranslationSource {
  eyebrow?: string | null
  title: string
  subtitle?: string | null
  description?: string | null
  ctaText?: string | null
}

export interface BannerTranslationOutput {
  locale: string
  eyebrow: string
  title: string
  subtitle: string
  description: string
  ctaText: string
}

export interface BannerTranslateResult {
  translations: BannerTranslationOutput[]
  failed: { locale: string; error: string }[]
}

export function isAutoTranslateConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY)
}

let client: OpenAI | null = null

function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured")
  if (!client) client = new OpenAI({ apiKey })
  return client
}

interface RawTranslation {
  eyebrow?: string
  title?: string
  subtitle?: string
  description?: string
  ctaText?: string
}

async function translateFields(source: BannerTranslationSource, locale: string): Promise<RawTranslation> {
  const localeName = LOCALE_NAMES_EN[locale] || locale
  const system =
    "You are a professional localization expert for a B2B company website homepage hero slider. " +
    "Translate the JSON fields from English into " +
    localeName +
    ". Return ONLY a JSON object with the exact same keys: eyebrow, title, subtitle, description, ctaText. " +
    "Keep titles short and punchy. Fields that are empty strings must stay empty. " +
    "Do not translate brand names, URLs, emails, phone numbers or addresses."

  const payload = JSON.stringify({
    eyebrow: source.eyebrow || "",
    title: source.title || "",
    subtitle: source.subtitle || "",
    description: source.description || "",
    ctaText: source.ctaText || "",
  })

  let lastError: unknown
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const completion = await getClient().chat.completions.create({
        model: AUTO_TRANSLATE_MODEL,
        messages: [
          { role: "system", content: system },
          { role: "user", content: payload },
        ],
        temperature: 0.2,
        max_tokens: 2000,
        response_format: { type: "json_object" },
      })
      const text = completion.choices[0]?.message?.content?.trim() ?? ""
      if (text) return JSON.parse(text) as RawTranslation
      lastError = new Error("Empty response from OpenAI")
    } catch (error) {
      lastError = error
      if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 1200))
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Translation failed")
}

async function runWithConcurrency(tasks: (() => Promise<void>)[], limit: number): Promise<void> {
  let index = 0
  const workers = Array.from({ length: Math.min(limit, tasks.length) }, async () => {
    while (index < tasks.length) {
      const current = index
      index += 1
      await tasks[current]()
    }
  })
  await Promise.all(workers)
}

/**
 * Translate a banner's English text into the requested locales. This is
 * stateless — it returns the translations and does not touch the database; the
 * caller previews/edits them and persists on save.
 */
export async function translateBannerText(
  source: BannerTranslationSource,
  locales: readonly string[] = BANNER_TRANSLATE_LOCALES
): Promise<BannerTranslateResult> {
  const result: BannerTranslateResult = { translations: [], failed: [] }
  if (!isAutoTranslateConfigured()) throw new Error("OPENAI_API_KEY is not configured")
  if (!source.title || !source.title.trim()) return result

  const targets = [...new Set(locales)].filter((locale) => locale && locale !== "en")

  const tasks = targets.map((locale) => async () => {
    try {
      const out = await translateFields(source, locale)
      result.translations.push({
        locale,
        eyebrow: out.eyebrow?.trim() || "",
        title: out.title?.trim() || source.title,
        subtitle: out.subtitle?.trim() || "",
        description: out.description?.trim() || "",
        ctaText: out.ctaText?.trim() || "",
      })
    } catch (error) {
      result.failed.push({ locale, error: (error as Error).message })
    }
  })

  await runWithConcurrency(tasks, 3)
  result.translations.sort((a, b) => a.locale.localeCompare(b.locale))
  return result
}
