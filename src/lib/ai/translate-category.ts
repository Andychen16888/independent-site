import OpenAI from "openai"
import { routing } from "@/i18n/routing"
import { localizeCategoryName } from "@/lib/i18n/category-labels"

const LOCALE_NAMES: Record<string, string> = {
  zh: "Simplified Chinese",
  es: "Spanish",
  pt: "Portuguese",
  fr: "French",
  de: "German",
  ru: "Russian",
  ar: "Arabic",
  id: "Indonesian",
  vi: "Vietnamese",
  th: "Thai",
  ms: "Malay",
}

export const CATEGORY_TRANSLATE_LOCALES = routing.locales.filter((locale) => locale !== "en")

export function isCategoryAutoTranslateConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY)
}

let client: OpenAI | null = null

function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured")
  if (!client) client = new OpenAI({ apiKey })
  return client
}

async function translateCategoryName(name: string, locale: string): Promise<string> {
  const localeName = LOCALE_NAMES[locale] || locale
  const completion = await getClient().chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are a professional B2B ecommerce localization expert. " +
          `Translate the given product category name from English to ${localeName}. ` +
          "Return ONLY the translated category name text with no quotes, labels or punctuation changes.",
      },
      { role: "user", content: name },
    ],
    temperature: 0.2,
    max_tokens: 120,
  })
  return completion.choices[0]?.message?.content?.trim() || ""
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

export async function buildCategoryTranslations(params: {
  name: string
  slug: string
  existing?: Map<string, string>
  manual: Map<string, string>
  overwrite: boolean
}) {
  const { name, slug, manual, overwrite } = params
  const existing = params.existing || new Map<string, string>()
  const output = new Map<string, string>()
  const aiTargets: string[] = []

  for (const locale of CATEGORY_TRANSLATE_LOCALES) {
    if (manual.has(locale)) {
      output.set(locale, manual.get(locale) || "")
      continue
    }

    const previous = existing.get(locale)?.trim() || ""
    if (!overwrite && previous) {
      output.set(locale, previous)
      continue
    }

    const builtIn = localizeCategoryName(locale, slug, name)
    if (builtIn && builtIn.trim() && builtIn.trim() !== name.trim()) {
      output.set(locale, builtIn.trim())
      continue
    }

    aiTargets.push(locale)
  }

  const failed: { locale: string; error: string }[] = []

  if (aiTargets.length > 0 && isCategoryAutoTranslateConfigured()) {
    const tasks = aiTargets.map((locale) => async () => {
      try {
        const translated = await translateCategoryName(name, locale)
        output.set(locale, translated || existing.get(locale)?.trim() || "")
      } catch (error) {
        failed.push({ locale, error: (error as Error).message })
        output.set(locale, existing.get(locale)?.trim() || "")
      }
    })
    await runWithConcurrency(tasks, 3)
  } else {
    for (const locale of aiTargets) {
      output.set(locale, existing.get(locale)?.trim() || "")
    }
  }

  return {
    translations: CATEGORY_TRANSLATE_LOCALES.map((locale) => ({
      locale,
      name: output.get(locale) || "",
    })),
    failed,
  }
}
