import type { Category, Prisma } from "@prisma/client"
import { prisma } from "@/lib/db/prisma"
import { resolveCategoryAlias } from "@/lib/i18n/category-labels"
import {
  canonicalCategorySlug,
  isUrlSafeCategorySlug,
  normalizeCategoryKey,
  safeDecodeSlug,
} from "@/lib/categories/slug"

export type CategoryRef = Pick<Category, "id" | "name" | "slug" | "parentId" | "isActive">

export interface ResolvedCategory {
  category: Category
  /** Slug every internal link, canonical tag and sitemap entry must use. */
  canonicalSlug: string
  /** False when the request used a legacy/non-canonical form and must 301. */
  isCanonicalRequest: boolean
}

const CATEGORY_LIST_SELECT = {
  id: true,
  name: true,
  slug: true,
  parentId: true,
  isActive: true,
  sortOrder: true,
} satisfies Prisma.CategorySelect

const SCORE_NONE = 0
const SCORE_BY_NAME = 2
const SCORE_BY_SLUG = 3

/** A key plus the alias it points at, so "led-lights" also matches "led-lighting". */
function keyVariants(key: string): string[] {
  if (!key) return []
  const alias = resolveCategoryAlias(key)
  return alias && alias !== key ? [key, alias] : [key]
}

function requestedKeyVariants(requested: string): Set<string> {
  const keys = new Set<string>()
  for (const raw of [requested, canonicalCategorySlug(requested)]) {
    for (const key of keyVariants(normalizeCategoryKey(raw))) keys.add(key)
  }
  return keys
}

function intersects(a: Iterable<string>, b: Set<string>): boolean {
  for (const value of a) {
    if (b.has(value)) return true
  }
  return false
}

/**
 * Matches a URL slug (or `?category=` value) against an already loaded list.
 *
 * Accepts the canonical slug plus legacy forms such as "led lighting",
 * "LED-Lighting" and the aliases in CATEGORY_NAME_ALIASES, so a URL that was
 * generated from a free-text slug keeps working.
 */
export function matchCategoryInList<T extends CategoryRef>(
  categories: readonly T[],
  rawSlug: string | null | undefined
): T | null {
  const requested = typeof rawSlug === "string" ? safeDecodeSlug(rawSlug).trim() : ""
  if (!requested) return null

  const requestedKeys = requestedKeyVariants(requested)
  if (requestedKeys.size === 0) return null

  let best: T | null = null
  let bestScore = SCORE_NONE

  for (const category of categories) {
    const slugKeys = keyVariants(normalizeCategoryKey(category.slug))
    const nameKeys = keyVariants(normalizeCategoryKey(category.name))
    const score = intersects(slugKeys, requestedKeys)
      ? SCORE_BY_SLUG
      : intersects(nameKeys, requestedKeys)
        ? SCORE_BY_NAME
        : SCORE_NONE
    if (score === SCORE_NONE) continue

    const wins =
      score > bestScore ||
      (score === bestScore && best !== null && !best.isActive && category.isActive)
    if (wins) {
      best = category
      bestScore = score
    }
  }

  return best
}

/**
 * Resolves a category id plus every descendant below it.
 *
 * A category page lists the products of its whole branch, which is what the
 * products listing shows for that category once child categories exist.
 */
export function collectCategoryBranch(
  categories: readonly CategoryRef[],
  rootId: string
): Set<string> {
  const branch = new Set<string>([rootId])
  let changed = true
  while (changed) {
    changed = false
    for (const category of categories) {
      if (category.parentId && branch.has(category.parentId) && !branch.has(category.id)) {
        branch.add(category.id)
        changed = true
      }
    }
  }
  return branch
}

/** Active top-level categories, as used by the products page filter bar. */
export async function listTopLevelCategories(): Promise<CategoryRef[]> {
  return prisma.category.findMany({
    where: { isActive: true, parentId: null },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: { id: true, name: true, slug: true, parentId: true, isActive: true },
  })
}

/** Every category with its parent link, used for slug lookups and branches. */
export async function listCategoryTree(): Promise<CategoryRef[]> {
  return prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: CATEGORY_LIST_SELECT,
  })
}

/**
 * Looks a category up by URL slug without 404-ing on legacy slugs.
 *
 * Order: exact slug, canonical slug, then a loose match over every category.
 * Inactive categories are matched too, because the products listing still shows
 * their products; the storefront only ever links to active ones.
 */
export async function resolveCategoryBySlug(
  rawSlug: string | null | undefined
): Promise<ResolvedCategory | null> {
  const requested = typeof rawSlug === "string" ? safeDecodeSlug(rawSlug).trim() : ""
  if (!requested) return null

  const direct = await prisma.category.findUnique({ where: { slug: requested } })
  if (direct) return toResolved(direct, requested)

  const canonicalSlug = canonicalCategorySlug(requested)
  if (canonicalSlug !== requested) {
    const canonical = await prisma.category.findUnique({ where: { slug: canonicalSlug } })
    if (canonical) return toResolved(canonical, requested)
  }

  const loose = matchCategoryInList(await listCategoryTree(), requested)
  if (loose) {
    const category = await prisma.category.findUnique({ where: { id: loose.id } })
    if (category) return toResolved(category, requested)
  }

  return null
}

function toResolved(category: Category, requested: string): ResolvedCategory {
  const canonicalSlug = canonicalCategorySlug(category.slug, category.name)
  return {
    category,
    canonicalSlug,
    isCanonicalRequest: isUrlSafeCategorySlug(requested) && requested === canonicalSlug,
  }
}
