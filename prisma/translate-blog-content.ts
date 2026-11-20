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

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function translateContent(openai: OpenAI, content: string, locale: string): Promise<string> {
  const localeName = LOCALE_NAMES[locale] || locale
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const completion = await openai.chat.completions.create({
        model: MODEL,
        messages: [
          {
            role: "system",
            content:
              "You are a professional e-commerce localization expert. Translate an English HTML article into " +
              localeName +
              ". Return ONLY the translated HTML document. Preserve the HTML structure exactly: keep every tag, attribute, class name, id, and link as-is. Translate all visible text into natural, fluent " +
              localeName +
              ". Do not translate brand names, URLs, email addresses, or numbers. Do not add or remove any markup.",
          },
          { role: "user", content },
        ],
        temperature: 0.2,
        max_tokens: 8000,
      })
      const text = completion.choices[0]?.message?.content?.trim() ?? ""
      if (text) return text
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

  const posts = await prisma.blogPost.findMany({
    where: {
      isPublished: true,
      ...(slugFilter ? { slug: slugFilter } : {}),
    },
    select: { id: true, slug: true, title: true, content: true, translations: true },
  })

  const translated: string[] = []
  const skipped: string[] = []
  const failed: string[] = []

  for (const post of posts) {
    if (!post.content) {
      skipped.push(`${post.slug} (no English content)`)
      continue
    }
    const byLocale = new Map(post.translations.map((t) => [t.locale, t]))
    for (const locale of CONTENT_LOCALES) {
      const existing = byLocale.get(locale)
      if (!force && existing?.content) {
        skipped.push(`${post.slug} / ${locale}`)
        continue
      }
      try {
        const content = await translateContent(openai, post.content, locale)
        await prisma.blogPostTranslation.upsert({
          where: { blogPostId_locale: { blogPostId: post.id, locale } },
          update: { content },
          create: { blogPostId: post.id, locale, title: existing?.title || post.title, content },
        })
        translated.push(`${post.slug} / ${locale}`)
        console.log(`Translated: ${post.slug} -> ${locale}`)
      } catch (err) {
        failed.push(`${post.slug} / ${locale}`)
        console.error(`Failed: ${post.slug} -> ${locale}:`, (err as Error).message)
      }
      await sleep(300)
    }
  }

  console.log(
    `Done. Translated: ${translated.length}, skipped: ${skipped.length}, failed: ${failed.length}.`
  )
  if (failed.length > 0) console.log("Failed items:", failed.join(", "))
}

main().finally(() => prisma.$disconnect())