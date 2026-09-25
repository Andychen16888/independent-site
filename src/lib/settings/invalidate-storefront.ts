import { revalidatePath } from "next/cache"

/**
 * Invalidate the whole storefront (all locales) after an admin mutation, so a
 * much longer ISR interval (`revalidate = 3600`) never delays content edits.
 */
export function invalidateStorefront(): void {
  revalidatePath("/", "layout")
}