import { randomBytes } from "node:crypto"

/**
 * Opaque per-subscriber token used for one-click unsubscribe links.
 *
 * Stored on the Newsletter row and never derived from the address, so
 * changing an email does not invalidate an unsubscribe link that has
 * already been delivered, and a leaked list cannot be used to reconstruct
 * other subscribers' links.
 */
export function generateUnsubscribeToken(): string {
  return randomBytes(32).toString("hex")
}

/**
 * Absolute URL for the one-click unsubscribe endpoint.
 *
 * The locale is carried on the link so the confirmation page can answer in the
 * reader's own language. It is the campaign language, not a stored subscriber
 * preference -- the list has no locale column.
 */
export function buildUnsubscribeUrl(token: string, locale?: string): string {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://commoditychina.com").replace(/\/+$/, "")
  const url = new URL(`${base}/api/newsletter/unsubscribe`)
  url.searchParams.set("token", token)
  if (locale) url.searchParams.set("locale", locale)
  return url.toString()
}
