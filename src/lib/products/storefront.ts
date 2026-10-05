import type { Prisma } from "@prisma/client"

/**
 * Visibility rules shared by the products listing and the category pages.
 *
 * Both used to build their own `where` clause, which is how a category page
 * could end up listing fewer products than the matching tab on /products.
 */
export function storefrontProductWhere(
  extra: Prisma.ProductWhereInput = {}
): Prisma.ProductWhereInput {
  return { status: "ACTIVE", deletedAt: null, ...extra }
}

/** Products of a category branch, exactly as /products filters them. */
export function storefrontCategoryWhere(categoryIds: string[]): Prisma.ProductWhereInput {
  return storefrontProductWhere({
    categories: { some: { categoryId: { in: categoryIds } } },
  })
}

/** Same options as the "Sort by" control on the products listing. */
export function storefrontProductOrderBy(
  sort?: string
): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case "price-asc":
      return [{ unitPrice: "asc" }]
    case "price-desc":
      return [{ unitPrice: "desc" }]
    case "bestseller":
      return [{ isBestSeller: "desc" }, { createdAt: "desc" }]
    case "newest":
    default:
      return [{ createdAt: "desc" }]
  }
}

/** `?price=100-200` style bounds shared by both listings. */
export function storefrontPriceWhere(price?: string): Prisma.ProductWhereInput {
  if (!price) return {}
  const [minRaw, maxRaw] = price.split("-")
  const min = Number(minRaw)
  const max = maxRaw ? Number(maxRaw) : Infinity
  if (Number.isNaN(min) && !Number.isFinite(max)) return {}
  return {
    unitPrice: {
      ...(Number.isFinite(min) ? { gte: min } : {}),
      ...(Number.isFinite(max) ? { lte: max } : {}),
    },
  }
}

/** Decimal columns arrive as strings/objects; cards need plain numbers. */
export function toDisplayProduct<
  T extends { unitPrice?: unknown; originalPrice?: unknown }
>(product: T): T {
  return {
    ...product,
    unitPrice: product.unitPrice != null ? Number(product.unitPrice) : null,
    originalPrice: product.originalPrice != null ? Number(product.originalPrice) : null,
  }
}
