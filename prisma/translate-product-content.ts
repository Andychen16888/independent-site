import { PrismaClient } from "@prisma/client"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import OpenAI from "openai"

const prisma = new PrismaClient()

try {
  const envFile = readFileSync(resolve(".env"), "utf-8")
  for (const line of envFile.split("\n")) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const sep = trimmed.indexOf("=")
    if (sep === -1) continue
    const key = trimmed.slice(0, sep).trim()
    const value = trimmed.slice(sep + 1).trim().replace(/^["']|["']$/g, "")
    if (!process.env[key]) process.env[key] = value
  }
} catch {
  // .env not found, rely on existing env vars
}

const CONTENT_LOCALES = ["zh", "es", "pt", "fr", "de", "ru", "ar", "id", "vi", "th", "ms"]

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

const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini"
const API_KEY = process.env.OPENAI_API_KEY

const force = process.argv.includes("--force")
const slugIndex = process.argv.indexOf("--slug")
const slugFilter = slugIndex !== -1 ? process.argv[slugIndex + 1] : undefined

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms))

interface Fields {
  name: string
  shortDescription: string
  description: string
  seoTitle: string
  seoDescription: string
}

async function translateProduct(openai: OpenAI, fields: Fields, locale: string): Promise<Partial<Fields>> {
  const localeName = LOCALE_NAMES[locale] || locale
  const system =
    "You are a professional e-commerce localization expert for a B2B wholesale store. " +
    "Translate the JSON fields from English into " +
    localeName +
    ". Return ONLY a JSON object with the exact same keys: name, shortDescription, description, seoTitle, seoDescription. " +
    "The description may contain HTML — preserve every tag, attribute, class, id and link exactly as-is, translating only visible text. " +
    "Fields that are empty strings must stay empty. Do not translate brand names, model numbers, URLs, emails or numbers."

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const completion = await openai.chat.completions.create({
        model: MODEL,
        messages: [
          { role: "system", content: system },
          { role: "user", content: JSON.stringify(fields) },
        ],
        temperature: 0.2,
        max_tokens: 8000,
        response_format: { type: "json_object" },
      })
      const text = completion.choices[0]?.message?.content?.trim() ?? ""
      if (text) return JSON.parse(text) as Partial<Fields>
    } catch (err) {
      const status = (err as { status?: number })?.status
      const delay = 1000 * 2 ** (attempt - 1) + attempt * 500
      console.warn(`Translation request failed (${status ?? "unknown"}). Retry ${attempt}/3 after ${delay}ms.`)
      if (attempt < 3) await sleep(delay)
    }
  }
  throw new Error("Translation request failed after 3 attempts.")
}

async function main() {
  if (!API_KEY) {
    console.error("OPENAI_API_KEY is not set. Add it to .env and try again.")
    process.exit(1)
  }

  const openai = new OpenAI({ apiKey: API_KEY })
  console.log(`Using model: ${MODEL}`)

  const products = await prisma.product.findMany({
    where: {
      status: "ACTIVE",
      deletedAt: null,
      ...(slugFilter ? { slug: slugFilter } : {}),
    },
    select: {
      id: true,
      slug: true,
      name: true,
      shortDescription: true,
      description: true,
      seoTitle: true,
      seoDescription: true,
      translations: true,
    },
  })

  const translated: string[] = []
  const skipped: string[] = []
  const failed: string[] = []

  for (const product of products) {
    if (!product.name || !product.description) {
      skipped.push(`${product.slug} (no English content)`)
      continue
    }
    const fields: Fields = {
      name: product.name,
      shortDescription: product.shortDescription || "",
      description: product.description,
      seoTitle: product.seoTitle || "",
      seoDescription: product.seoDescription || "",
    }
    const byLocale = new Map(product.translations.map((t) => [t.locale, t]))
    for (const locale of CONTENT_LOCALES) {
      const existing = byLocale.get(locale)
      if (!force && existing?.description) {
        skipped.push(`${product.slug} / ${locale}`)
        continue
      }
      try {
        const result = await translateProduct(openai, fields, locale)
        const data = {
          name: result.name || existing?.name || product.name,
          shortDescription: result.shortDescription || null,
          description: result.description || null,
          seoTitle: result.seoTitle || null,
          seoDescription: result.seoDescription || null,
        }
        await prisma.productTranslation.upsert({
          where: { productId_locale: { productId: product.id, locale } },
          update: data,
          create: { productId: product.id, locale, ...data },
        })
        translated.push(`${product.slug} / ${locale}`)
        console.log(`Translated: ${product.slug} -> ${locale}`)
      } catch (err) {
        failed.push(`${product.slug} / ${locale}`)
        console.error(`Failed: ${product.slug} -> ${locale}:`, (err as Error).message)
      }
      await sleep(300)
    }
  }

  console.log(`Done. Translated: ${translated.length}, skipped: ${skipped.length}, failed: ${failed.length}.`)
  if (failed.length > 0) console.log("Failed items:", failed.join(", "))
}

main().finally(() => prisma.$disconnect())
