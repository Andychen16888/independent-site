import OpenAI from "openai"
import { prisma } from "@/lib/db/prisma"
import { CONTENT_LOCALES, LOCALE_NAMES_EN } from "@/lib/i18n/locales"

/** English is the source language and is intentionally excluded. */
export const AUTO_TRANSLATE_LOCALES = CONTENT_LOCALES

export const AUTO_TRANSLATE_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini"

export interface ProductTranslationSource {
  name: string
  shortDescription?: string | null
  description?: string | null
  seoTitle?: string | null
  seoDescription?: string | null
}

export interface AutoTranslateResult {
  translated: string[]
  skipped: string[]
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

interface TranslationOutput {
  name?: string
  shortDescription?: string
  description?: string
  seoTitle?: string
  seoDescription?: string
}

async function translateFields(source: ProductTranslationSource, locale: string): Promise<TranslationOutput> {
  const localeName = LOCALE_NAMES_EN[locale] || locale
  const system =
    "You are a professional e-commerce localization expert for a B2B wholesale store. " +
    "Translate the JSON fields from English into " +
    localeName +
    ". Return ONLY a JSON object with the exact same keys: name, shortDescription, description, seoTitle, seoDescription. " +
    "The description may contain HTML — preserve every tag, attribute, class, id and link exactly as-is, translating only visible text. " +
    "Fields that are empty strings must stay empty. Do not translate brand names, model numbers, URLs, emails or numbers."

  const payload = JSON.stringify({
    name: source.name,
    shortDescription: source.shortDescription || "",
    description: source.description || "",
    seoTitle: source.seoTitle || "",
    seoDescription: source.seoDescription || "",
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
        max_tokens: 8000,
        response_format: { type: "json_object" },
      })
      const text = completion.choices[0]?.message?.content?.trim() ?? ""
      if (text) return JSON.parse(text) as TranslationOutput
      lastError = new Error("Empty response from OpenAI")
    } catch (err) {
      lastError = err
      if (attempt < 2) await new Promise((r) => setTimeout(r, 1200))
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Translation failed")
}

async function runWithConcurrency(tasks: (() => Promise<void>)[], limit: number): Promise<void> {
  let index = 0
  const workers = Array.from({ length: Math.min(limit, tasks.length) }, async () => {
    while (index < tasks.length) {
      const current = index++
      await tasks[current]()
    }
  })
  await Promise.all(workers)
}

/**
 * Translate a product's English content into every supported locale and store
 * the result in `product_translations`.
 *
 * By default only locales that do not already have a translation are filled in,
 * so admins keep any manual edits. Pass `overwrite: true` to re-translate
 * everything (used when the English source content changed).
 */
export async function autoTranslateProduct(
  productId: string,
  source: ProductTranslationSource,
  options: { overwrite?: boolean } = {}
): Promise<AutoTranslateResult> {
  const result: AutoTranslateResult = { translated: [], skipped: [], failed: [] }

  if (!isAutoTranslateConfigured()) {
    throw new Error("OPENAI_API_KEY is not configured")
  }
  if (!source.name || !source.name.trim()) {
    return result
  }

  const existing = await prisma.productTranslation.findMany({
    where: { productId },
    select: { locale: true, description: true },
  })
  const byLocale = new Map(existing.map((t) => [t.locale, t]))

  const targets = (AUTO_TRANSLATE_LOCALES as readonly string[]).filter((locale) => {
    if (options.overwrite) return true
    if (byLocale.get(locale)?.description) {
      result.skipped.push(locale)
      return false
    }
    return true
  })

  const tasks = targets.map((locale) => async () => {
    try {
      const out = await translateFields(source, locale)
      const data = {
        name: out.name?.trim() || source.name,
        shortDescription: out.shortDescription?.trim() || null,
        description: out.description?.trim() || null,
        seoTitle: out.seoTitle?.trim() || null,
        seoDescription: out.seoDescription?.trim() || null,
      }
      await prisma.productTranslation.upsert({
        where: { productId_locale: { productId, locale } },
        update: data,
        create: { productId, locale, ...data },
      })
      result.translated.push(locale)
    } catch (err) {
      result.failed.push({ locale, error: (err as Error).message })
    }
  })

  await runWithConcurrency(tasks, 3)
  return result
}
