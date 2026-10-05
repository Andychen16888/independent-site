import { prisma } from "@/lib/db/prisma"
import { MAX_SLUG_LENGTH } from "@/lib/utils/format"

/**
 * Appends -2, -3, ... until the category slug is free.
 *
 * The products listing has the same helper; categories needed their own so the
 * uniqueness check stays on the categories table.
 */
export async function ensureUniqueCategorySlug(
  candidate: string,
  excludeId?: string
): Promise<string> {
  const base = candidate.slice(0, MAX_SLUG_LENGTH)
  for (let suffix = 1; suffix < 500; suffix += 1) {
    const tail = suffix === 1 ? "" : `-${suffix}`
    const slug = `${base.slice(0, MAX_SLUG_LENGTH - tail.length)}${tail}`
    const taken = await prisma.category.findFirst({
      where: { slug, ...(excludeId ? { id: { not: excludeId } } : {}) },
      select: { id: true },
    })
    if (!taken) return slug
  }
  return `${base.slice(0, MAX_SLUG_LENGTH - 8)}-${Date.now().toString(36).slice(-6)}`
}
