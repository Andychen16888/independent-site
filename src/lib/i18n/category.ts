import { prisma } from "@/lib/db/prisma"
import { Prisma } from "@prisma/client"

export interface CategoryTranslationInput {
  locale: string
  name?: string
}

export function categoryTranslationNeeded(locale: string): boolean {
  return locale !== "en"
}

let missingTableWarned = false

function isCategoryTranslationsTableMissing(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return false
  if (error.code !== "P2021") return false
  const table = (error.meta as { table?: unknown } | undefined)?.table
  return typeof table === "string" && table.includes("category_translations")
}

function warnCategoryTranslationsMissing(context: string, error: unknown) {
  if (missingTableWarned) return
  missingTableWarned = true
  console.warn(
    `[i18n] category_translations table is missing; ${context} falls back to base category names. Run \"npm run db:migrate\".`
  )
  console.error(error)
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
    if (isCategoryTranslationsTableMissing(error)) {
      warnCategoryTranslationsMissing("read", error)
      return map
    }
    console.error(
      `[i18n] Failed to load category translations for locale "${locale}". Run "npx prisma migrate deploy" to apply category_translations migration.`,
      error
    )
  }

  return map
}

export async function upsertCategoryTranslations(categoryId: string, inputs: CategoryTranslationInput[]) {
  try {
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
  } catch (error) {
    if (isCategoryTranslationsTableMissing(error)) {
      warnCategoryTranslationsMissing("write", error)
      return
    }
    throw error
  }
}
