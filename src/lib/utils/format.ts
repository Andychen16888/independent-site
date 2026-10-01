export function formatPrice(
  price: number | string,
  currency: string = "USD",
  locale: string = "en"
): string {
  const amount = typeof price === "string" ? parseFloat(price) : price
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(date: Date | string, locale: string = "en"): string {
  const d = typeof date === "string" ? new Date(date) : date
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(d)
}

export function formatDateShort(date: Date | string, locale: string = "en"): string {
  const d = typeof date === "string" ? new Date(date) : date
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(d)
}

export const MAX_SLUG_LENGTH = 80

/**
 * Lowercase, ASCII-only, hyphen-separated slug.
 *
 * Anything that is not a URL-safe character becomes a hyphen, so a name like
 * "Radar Sensor T8 LED Tube Light" can never end up stored as "Radar Sensor
 * T8 LED Tube Light" (spaces in a slug break links and the sitemap).
 */
export function slugify(text: string): string {
  return String(text ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/-+$/g, "")
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text
  return text.slice(0, length).trim() + "..."
}

export function generateSKU(category: string, name: string): string {
  const prefix = category.slice(0, 3).toUpperCase()
  const namePart = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 4)
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${prefix}-${namePart}-${random}`
}

export function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `OB-${timestamp}-${random}`
}

export function getDiscountPercentage(originalPrice: number, salePrice: number): number {
  if (originalPrice <= 0) return 0
  return Math.round(((originalPrice - salePrice) / originalPrice) * 100)
}
