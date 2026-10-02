import { prisma } from "@/lib/db/prisma"

export interface CategoryTranslationInput {
  locale: string
  name?: string
}

export function categoryTranslationNeeded(locale: string): boolean {
  return locale !== "en"
}

export async function fetchCategoryTranslations(
  categoryIds: string[],
  locale: string
): Promise<Map<string, string>> {
  const map = new Map<string, string>()
  const ids = [...new Set(categoryIds)].filter(Boolean)
  if (!categoryTranslationNeeded(locale) || ids.length === 0) return map

  try {
    const rows = await prisma.categoryTranslation.findMany({
      where: { locale, categoryId: { in: ids } },
      select: { categoryId: true, name: true },
    })
    for (const row of rows) map.set(row.categoryId, row.name)
  } catch (error) {
    console.error(
      `[i18n] Failed to load category translations for locale "${locale}". Run "npx prisma migrate deploy" to apply category_translations migration.`,
      error
    )
  }

  return map
}

export async function upsertCategoryTranslations(categoryId: string, inputs: CategoryTranslationInput[]) {
  const received = new Set<string>()
  for (const input of inputs) {
    if (!input?.locale || input.locale === "en") continue
    received.add(input.locale)
    const name = input.name?.trim() || ""

    if (!name) {
      await prisma.categoryTranslation.deleteMany({ where: { categoryId, locale: input.locale } })
      continue
    }

    await prisma.categoryTranslation.upsert({
      where: { categoryId_locale: { categoryId, locale: input.locale } },
      update: { name },
      create: { categoryId, locale: input.locale, name },
    })
  }

  if (received.size === 0) return
  await prisma.categoryTranslation.deleteMany({
    where: { categoryId, locale: { notIn: [...received] } },
  })
}
