import { prisma } from "@/lib/db/prisma"
import type { BannerTranslation } from "@prisma/client"

export function bannerTranslationNeeded(locale: string): boolean {
  return locale !== "en"
}

export async function fetchBannerTranslations(
  bannerIds: string[],
  locale: string
): Promise<Map<string, BannerTranslation>> {
  const map = new Map<string, BannerTranslation>()
  const ids = [...new Set(bannerIds)].filter(Boolean)
  if (!bannerTranslationNeeded(locale) || ids.length === 0) return map

  try {
    const rows = await prisma.bannerTranslation.findMany({
      where: { locale, bannerId: { in: ids } },
    })
    for (const row of rows) map.set(row.bannerId, row)
  } catch (error) {
    console.error(
      `[i18n] Failed to load banner translations for locale "${locale}". Run "npx prisma migrate deploy" to apply the banner_translations migration.`,
      error
    )
  }
  return map
}

/* ------------------------------------------------------------------ */
/* Admin persistence (upsert translations from the admin banner form)  */
/* ------------------------------------------------------------------ */

export interface BannerTranslationInput {
  locale: string
  eyebrow?: string | null
  title?: string
  subtitle?: string | null
  description?: string | null
  ctaText?: string | null
  link?: string | null
}

function isFilled(values: (string | null | undefined)[]): boolean {
  return values.some((v) => typeof v === "string" && v.trim() !== "")
}

export async function upsertBannerTranslations(
  bannerId: string,
  inputs: BannerTranslationInput[]
) {
  const received = new Set<string>()
  for (const input of inputs) {
    if (!input?.locale) continue
    received.add(input.locale)
    const data = {
      eyebrow: input.eyebrow ?? null,
      title: input.title ?? "",
      subtitle: input.subtitle ?? null,
      description: input.description ?? null,
      ctaText: input.ctaText ?? null,
      link: input.link ?? null,
    }
    if (!isFilled([data.title, data.eyebrow, data.subtitle, data.description, data.ctaText])) {
      await prisma.bannerTranslation.deleteMany({ where: { bannerId, locale: input.locale } })
      continue
    }
    await prisma.bannerTranslation.upsert({
      where: { bannerId_locale: { bannerId, locale: input.locale } },
      update: data,
      create: { bannerId, locale: input.locale, ...data },
    })
  }
  if (received.size === 0) return
  await prisma.bannerTranslation.deleteMany({
    where: { bannerId, locale: { notIn: [...received] } },
  })
}
