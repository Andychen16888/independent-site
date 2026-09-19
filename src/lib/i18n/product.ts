import { prisma } from "@/lib/db/prisma"
import type { ProductTranslation } from "@prisma/client"

export interface LocalizedFields {
  name: string | null | undefined
  shortDescription: string | null | undefined
  description: string | null | undefined
  seoTitle: string | null | undefined
  seoDescription: string | null | undefined
}

export function translationNeeded(locale: string): boolean {
  return locale !== "en"
}

export async function fetchProductTranslations(
  productIds: string[],
  locale: string
): Promise<Map<string, ProductTranslation>> {
  const map = new Map<string, ProductTranslation>()
  const ids = [...new Set(productIds)].filter(Boolean)
  if (!translationNeeded(locale) || ids.length === 0) return map

  try {
    const rows = await prisma.productTranslation.findMany({
      where: { locale, productId: { in: ids } },
    })
    for (const row of rows) map.set(row.productId, row)
  } catch (error) {
    console.error(`[i18n] Failed to load product translations for locale "${locale}". Run "npx prisma migrate deploy" to apply the product_translations migration.`, error)
  }
  return map
}

export function applyProductLocalization<T extends { id: string } & Partial<LocalizedFields>>(
  product: T,
  translations: ReadonlyMap<string, ProductTranslation>
): T {
  const t = translations.get(product.id)
  if (!t) return product
  return {
    ...product,
    name: t.name || product.name,
    shortDescription: t.shortDescription || product.shortDescription,
    description: t.description || product.description,
    seoTitle: t.seoTitle || product.seoTitle,
    seoDescription: t.seoDescription || product.seoDescription,
  }
}

export function applyProductLocalizations<T extends { id: string } & Partial<LocalizedFields>>(
  products: T[],
  translations: ReadonlyMap<string, ProductTranslation>
): T[] {
  return products.map((p) => applyProductLocalization(p, translations))
}