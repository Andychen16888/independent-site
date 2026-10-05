import { MAX_SLUG_LENGTH } from "@/lib/utils/format"

const SAFE_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
/** Anything that cannot live in a single URL path segment becomes a hyphen. */
const NON_PATH_CHARS = /[^\p{L}\p{N}]+/gu
const COMBINING_MARKS = /[\u0300-\u036f]/g

/** True when the stored value can be used as-is in a /categories/<slug> URL. */
export function isUrlSafeCategorySlug(value: string | null | undefined): boolean {
  if (!value) return false
  if (value.length > MAX_SLUG_LENGTH) return false
  return SAFE_SLUG.test(value)
}

/** `decodeURIComponent` without throwing on malformed input such as `%zz`. */
export function safeDecodeSlug(value: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

/**
 * Canonical form of a category slug, used for every generated URL.
 *
 * The admin slug field is free text, so the database can hold values like
 * "led lighting" or "LED Lighting". Those break links (the browser encodes the
 * space as %20) and split one category across several URLs, so they are folded
 * to "led-lighting" here. Non-Latin slugs are preserved instead of stripped.
 */
export function canonicalCategorySlug(slugInput: unknown, nameFallback?: unknown): string {
  const raw = typeof slugInput === "string" ? slugInput.trim() : ""
  if (isUrlSafeCategorySlug(raw)) return raw

  const cleaned = foldSlug(raw)
  if (cleaned) return cleaned

  const fromName = foldSlug(typeof nameFallback === "string" ? nameFallback : "")
  if (fromName) return fromName

  return "category"
}

/** Storefront path for a category, always built from its canonical slug. */
export function categoryPath(slug: unknown, nameFallback?: unknown): string {
  return `/categories/${canonicalCategorySlug(slug, nameFallback)}`
}

/**
 * Loose comparison key: "LED Lighting", "led lighting", "led_lighting" and
 * "led-lighting" all collapse to "led-lighting" so legacy URLs still resolve.
 */
export function normalizeCategoryKey(value: unknown): string {
  const raw = typeof value === "string" ? safeDecodeSlug(value) : ""
  return raw
    .normalize("NFKD")
    .replace(COMBINING_MARKS, "")
    .toLowerCase()
    .replace(NON_PATH_CHARS, "-")
    .replace(/^-+|-+$/g, "")
}

function foldSlug(value: string): string {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(NON_PATH_CHARS, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/-+$/g, "")
}
