import { prisma } from "@/lib/db/prisma"
import { slugify, MAX_SLUG_LENGTH } from "@/lib/utils/format"

const SAFE_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/** True when the stored value can be used as-is in a /products/<slug> URL. */
export function isUrlSafeSlug(value: string | null | undefined): boolean {
  if (!value) return false
  if (value.length > MAX_SLUG_LENGTH) return false
  return SAFE_SLUG.test(value)
}

/**
 * Turn whatever the admin form sent into a usable slug.
 *
 * The form field is free text, so it may hold spaces, capitals or nothing at
 * all (a name made only of Chinese characters slugifies to an empty string).
 * Falls back to the product name, then to a timestamp slug.
 */
export function buildProductSlug(slugInput: unknown, name: unknown): string {
  const fromSlug = slugify(typeof slugInput === "string" ? slugInput : "")
  if (fromSlug) return fromSlug
  const fromName = slugify(typeof name === "string" ? name : "")
  if (fromName) return fromName
  return `product-${Date.now().toString(36)}`
}

/** Appends -2, -3, ... until the slug is free, so URLs stay stable and readable. */
export async function ensureUniqueProductSlug(candidate: string, excludeId?: string): Promise<string> {
  const base = candidate.slice(0, MAX_SLUG_LENGTH)
  for (let suffix = 1; suffix < 500; suffix += 1) {
    const taken = await prisma.product.findFirst({
      where: {
        slug: suffix === 1 ? base : `${base.slice(0, MAX_SLUG_LENGTH - String(suffix).length - 1)}-${suffix}`,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    })
    if (!taken) {
      return suffix === 1 ? base : `${base.slice(0, MAX_SLUG_LENGTH - String(suffix).length - 1)}-${suffix}`
    }
  }
  return `${base.slice(0, MAX_SLUG_LENGTH - 8)}-${Date.now().toString(36).slice(-6)}`
}