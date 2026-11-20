import { prisma } from "@/lib/db/prisma"
import type { BlogPostTranslation, PageTranslation, SiteFaq, SiteFaqTranslation } from "@prisma/client"
import { APP_LOCALES } from "@/lib/i18n/locales"

export function translationNeeded(locale: string): boolean {
  return locale !== "en"
}

export const SUPPORTED_CONTENT_LOCALES: readonly string[] = APP_LOCALES

/* ------------------------------------------------------------------ */
/* Pages (CMS about/contact/privacy/terms/...)                         */
/* ------------------------------------------------------------------ */

export interface LocalizedPageFields {
  title: string | null | undefined
  excerpt: string | null | undefined
  content: string | null | undefined
  seoTitle: string | null | undefined
  seoDescription: string | null | undefined
  seoKeywords: string | null | undefined
}

export async function fetchPageTranslations(
  pageIds: string[],
  locale: string
): Promise<Map<string, PageTranslation>> {
  const map = new Map<string, PageTranslation>()
  const ids = [...new Set(pageIds)].filter(Boolean)
  if (!translationNeeded(locale) || ids.length === 0) return map

  try {
    const rows = await prisma.pageTranslation.findMany({
      where: { locale, pageId: { in: ids } },
    })
    for (const row of rows) map.set(row.pageId, row)
  } catch (error) {
    console.error(`[i18n] Failed to load page translations for locale "${locale}". Run "npx prisma migrate deploy" to apply the content_translations migration.`, error)
  }
  return map
}

export function applyPageLocalization<T extends { id: string } & Partial<LocalizedPageFields>>(
  page: T,
  translations: ReadonlyMap<string, PageTranslation>
): T {
  const t = translations.get(page.id)
  if (!t) return page
  return {
    ...page,
    title: t.title || page.title,
    excerpt: t.excerpt || page.excerpt,
    content: t.content || page.content,
    seoTitle: t.seoTitle || page.seoTitle,
    seoDescription: t.seoDescription || page.seoDescription,
    seoKeywords: t.seoKeywords || page.seoKeywords,
  }
}

export function applyPageLocalizations<T extends { id: string } & Partial<LocalizedPageFields>>(
  pages: T[],
  translations: ReadonlyMap<string, PageTranslation>
): T[] {
  return pages.map((p) => applyPageLocalization(p, translations))
}

/* ------------------------------------------------------------------ */
/* Blog posts                                                          */
/* ------------------------------------------------------------------ */

export interface LocalizedBlogFields {
  title: string | null | undefined
  excerpt: string | null | undefined
  content: string | null | undefined
  seoTitle: string | null | undefined
  seoDescription: string | null | undefined
  seoKeywords: string | null | undefined
}

export async function fetchBlogPostTranslations(
  postIds: string[],
  locale: string
): Promise<Map<string, BlogPostTranslation>> {
  const map = new Map<string, BlogPostTranslation>()
  const ids = [...new Set(postIds)].filter(Boolean)
  if (!translationNeeded(locale) || ids.length === 0) return map

  try {
    const rows = await prisma.blogPostTranslation.findMany({
      where: { locale, blogPostId: { in: ids } },
    })
    for (const row of rows) map.set(row.blogPostId, row)
  } catch (error) {
    console.error(`[i18n] Failed to load blog translations for locale "${locale}". Run "npx prisma migrate deploy" to apply the content_translations migration.`, error)
  }
  return map
}

export function applyBlogPostLocalization<T extends { id: string } & Partial<LocalizedBlogFields>>(
  post: T,
  translations: ReadonlyMap<string, BlogPostTranslation>
): T {
  const t = translations.get(post.id)
  if (!t) return post
  return {
    ...post,
    title: t.title || post.title,
    excerpt: t.excerpt || post.excerpt,
    content: t.content || post.content,
    seoTitle: t.seoTitle || post.seoTitle,
    seoDescription: t.seoDescription || post.seoDescription,
    seoKeywords: t.seoKeywords || post.seoKeywords,
  }
}

export function applyBlogPostLocalizations<T extends { id: string } & Partial<LocalizedBlogFields>>(
  posts: T[],
  translations: ReadonlyMap<string, BlogPostTranslation>
): T[] {
  return posts.map((p) => applyBlogPostLocalization(p, translations))
}

/* ------------------------------------------------------------------ */
/* FAQ (site-level)                                                    */
/* ------------------------------------------------------------------ */

export interface LocalizedFaqItem {
  id: string
  question: string
  answer: string
}

/**
 * Loads active site FAQs localized for the given locale.
 * Falls back to the English question/answer when a translation row is missing.
 */
export async function fetchLocalizedFaqs(locale: string): Promise<LocalizedFaqItem[]> {
  try {
    const faqs = await prisma.siteFaq.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: { translations: true },
    })
    return faqs.map((faq) => {
      const en = translationForLocale(faq.translations, "en")
      const t = translationForLocale(faq.translations, locale, en)
      const fallback = en || t
      return {
        id: faq.id,
        question: t?.question || fallback?.question || "",
        answer: t?.answer || fallback?.answer || "",
      }
    })
  } catch (error) {
    console.error(`[i18n] Failed to load site FAQ for locale "${locale}". Run "npx prisma migrate deploy" to apply the content_translations migration.`, error)
    return []
  }
}

function translationForLocale(
  translations: SiteFaqTranslation[],
  locale: string,
  fallback?: SiteFaqTranslation
): SiteFaqTranslation | undefined {
  return translations.find((t) => t.locale === locale) || fallback
}

export function faqToSiteSetting(faqs: { id: string; question: string; answer: string }[]): string {
  return JSON.stringify(faqs.map((f) => ({ q: f.question, a: f.answer })))
}

/** Grouped translations helper used by admin APIs when persisting all locales at once. */
export function groupTranslationsByLocale<T extends { locale: string }>(
  rows: T[]
): Record<string, T> {
  const out: Record<string, T> = {}
  for (const row of rows) {
    if (!out[row.locale]) out[row.locale] = row
  }
  return out
}

/* ------------------------------------------------------------------ */
/* Admin persistence (upsert translations from admin forms)            */
/* ------------------------------------------------------------------ */

export interface PageTranslationInput {
  locale: string
  title?: string
  excerpt?: string | null
  content?: string | null
  seoTitle?: string | null
  seoDescription?: string | null
  seoKeywords?: string | null
}

export interface BlogTranslationInput {
  locale: string
  title?: string
  excerpt?: string | null
  content?: string | null
  seoTitle?: string | null
  seoDescription?: string | null
  seoKeywords?: string | null
}

function isFilled(values: (string | null | undefined)[]): boolean {
  return values.some((v) => typeof v === "string" && v.trim() !== "")
}

export async function upsertPageTranslations(pageId: string, inputs: PageTranslationInput[]) {
  const received = new Set<string>()
  for (const input of inputs) {
    if (!input?.locale) continue
    received.add(input.locale)
    const data = {
      title: input.title ?? "",
      excerpt: input.excerpt ?? null,
      content: input.content ?? null,
      seoTitle: input.seoTitle ?? null,
      seoDescription: input.seoDescription ?? null,
      seoKeywords: input.seoKeywords ?? null,
    }
    if (!isFilled([data.title, data.excerpt, data.content])) {
      await prisma.pageTranslation.deleteMany({ where: { pageId, locale: input.locale } })
      continue
    }
    await prisma.pageTranslation.upsert({
      where: { pageId_locale: { pageId, locale: input.locale } },
      update: data,
      create: { pageId, locale: input.locale, ...data },
    })
  }
  await prisma.pageTranslation.deleteMany({
    where: { pageId, locale: { notIn: [...received] } },
  })
}

export async function upsertBlogPostTranslations(postId: string, inputs: BlogTranslationInput[]) {
  const received = new Set<string>()
  for (const input of inputs) {
    if (!input?.locale) continue
    received.add(input.locale)
    const data = {
      title: input.title ?? "",
      excerpt: input.excerpt ?? null,
      content: input.content ?? null,
      seoTitle: input.seoTitle ?? null,
      seoDescription: input.seoDescription ?? null,
      seoKeywords: input.seoKeywords ?? null,
    }
    if (!isFilled([data.title, data.excerpt, data.content])) {
      await prisma.blogPostTranslation.deleteMany({ where: { blogPostId: postId, locale: input.locale } })
      continue
    }
    await prisma.blogPostTranslation.upsert({
      where: { blogPostId_locale: { blogPostId: postId, locale: input.locale } },
      update: data,
      create: { blogPostId: postId, locale: input.locale, ...data },
    })
  }
  await prisma.blogPostTranslation.deleteMany({
    where: { blogPostId: postId, locale: { notIn: [...received] } },
  })
}