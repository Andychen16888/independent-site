import { APP_LOCALES } from "../../src/lib/i18n/locales"

const supported = new Set<string>(APP_LOCALES)

export function filterSupportedLocales<T>(localized: Record<string, T>): Record<string, T> {
  return Object.fromEntries(Object.entries(localized).filter(([locale]) => supported.has(locale)))
}
