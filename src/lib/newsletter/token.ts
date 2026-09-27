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

/** Absolute URL for the one-click unsubscribe endpoint. */
export function buildUnsubscribeUrl(token: string): string {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://commoditychina.com").replace(/\/+$/, "")
  return `${base}/api/newsletter/unsubscribe?token=${encodeURIComponent(token)}`
}
