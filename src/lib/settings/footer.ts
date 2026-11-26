import { APP_LOCALES, type AppLocale } from "@/lib/i18n/locales"

export const FOOTER_CONTENT_KEY = "footer.content"

export type FooterLocaleContent = {
  brief?: string
  address?: string
}

export type FooterContent = Partial<Record<AppLocale, FooterLocaleContent>>

const FIELDS: (keyof FooterLocaleContent)[] = ["brief", "address"]
const MAX_FIELD_LENGTH = 4000

export function parseFooterContent(raw: string | undefined): FooterContent {
  if (!raw) return {}
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {}
    const source = parsed as Record<string, unknown>
    const out: FooterContent = {}
    for (const locale of APP_LOCALES) {
      const entry = source[locale]
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue
      const values = entry as Record<string, unknown>
      const localeContent: FooterLocaleContent = {}
      for (const field of FIELDS) {
        const value = values[field]
        if (typeof value === "string" && value.trim()) localeContent[field] = value.trim()
      }
      if (Object.keys(localeContent).length) out[locale] = localeContent
    }
    return out
  } catch {
    return {}
  }
}

export function normalizeFooterContent(input: unknown): FooterContent | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null
  const source = input as Record<string, unknown>
  const out: FooterContent = {}
  for (const locale of APP_LOCALES) {
    const entry = source[locale]
    if (entry === undefined) continue
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null
    const values = entry as Record<string, unknown>
    const localeContent: FooterLocaleContent = {}
    for (const field of FIELDS) {
      const value = values[field]
      if (value === undefined || value === "") continue
      if (typeof value !== "string") return null
      const trimmed = value.trim()
      if (trimmed.length > MAX_FIELD_LENGTH) return null
      if (trimmed) localeContent[field] = trimmed
    }
    if (Object.keys(localeContent).length) out[locale] = localeContent
  }
  return out
}

export function serializeFooterContent(content: FooterContent): string {
  return JSON.stringify(content)
}

export function localizedFooterValue(
  content: FooterContent,
  locale: string,
  field: keyof FooterLocaleContent,
): string {
  return content[locale as AppLocale]?.[field] || ""
}
