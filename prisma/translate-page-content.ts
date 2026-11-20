import { PrismaClient } from "@prisma/client"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import OpenAI from "openai"
import { CONTENT_LOCALES, LOCALE_NAMES_EN as LOCALE_NAMES } from "../src/lib/i18n/locales"

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

const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini"
const API_KEY = process.env.OPENAI_API_KEY

const force = process.argv.includes("--force")
const slugIndex = process.argv.indexOf("--slug")
const slugFilter = slugIndex !== -1 ? process.argv[slugIndex + 1] : undefined

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms))

interface Fields {
  title: string
  excerpt: string
  content: string
  seoTitle: string
  seoDescription: string
  seoKeywords: string
}

async function translatePage(openai: OpenAI, fields: Fields, locale: string): Promise<Partial<Fields>> {
  const localeName = LOCALE_NAMES[locale] || locale
  const system =
    "You are a professional localization expert for a B2B company website. " +
    "Translate the JSON fields from English into " +
    localeName +
    ". Return ONLY a JSON object with the exact same keys: title, excerpt, content, seoTitle, seoDescription, seoKeywords. " +
    "The content may contain HTML — preserve every tag, attribute, class, id and link exactly as-is, translating only visible text. " +
    "Fields that are empty strings must stay empty. Do not translate brand names, URLs, emails, phone numbers or addresses unless already localized."

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

  const pages = await prisma.page.findMany({
    where: slugFilter ? { slug: slugFilter } : {},
    select: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      content: true,
      seoTitle: true,
      seoDescription: true,
      seoKeywords: true,
      translations: true,
    },
  })

  const translated: string[] = []
  const skipped: string[] = []
  const failed: string[] = []

  for (const page of pages) {
    if (!page.title || !page.content) {
      skipped.push(`${page.slug} (no English content)`)
      continue
    }
    const fields: Fields = {
      title: page.title,
      excerpt: page.excerpt || "",
      content: page.content,
      seoTitle: page.seoTitle || "",
      seoDescription: page.seoDescription || "",
      seoKeywords: page.seoKeywords || "",
    }
    const byLocale = new Map(page.translations.map((t) => [t.locale, t]))
    for (const locale of CONTENT_LOCALES) {
      const existing = byLocale.get(locale)
      if (!force && existing?.content) {
        skipped.push(`${page.slug} / ${locale}`)
        continue
      }
      try {
        const result = await translatePage(openai, fields, locale)
        const data = {
          title: result.title || existing?.title || page.title,
          excerpt: result.excerpt || existing?.excerpt || null,
          content: result.content || existing?.content || null,
          seoTitle: result.seoTitle || existing?.seoTitle || null,
          seoDescription: result.seoDescription || existing?.seoDescription || null,
          seoKeywords: result.seoKeywords || existing?.seoKeywords || null,
        }
        await prisma.pageTranslation.upsert({
          where: { pageId_locale: { pageId: page.id, locale } },
          update: data,
          create: { pageId: page.id, locale, ...data },
        })
        translated.push(`${page.slug} / ${locale}`)
        console.log(`Translated: ${page.slug} -> ${locale}`)
      } catch (err) {
        failed.push(`${page.slug} / ${locale}`)
        console.error(`Failed: ${page.slug} -> ${locale}:`, (err as Error).message)
      }
      await sleep(300)
    }
  }

  console.log(`Done. Translated: ${translated.length}, skipped: ${skipped.length}, failed: ${failed.length}.`)
  if (failed.length > 0) console.log("Failed items:", failed.join(", "))
}

main().finally(() => prisma.$disconnect())
