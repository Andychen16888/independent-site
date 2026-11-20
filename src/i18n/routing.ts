import { defineRouting } from "next-intl/routing"
import { APP_LOCALES, LOCALE_NAMES, type AppLocale as Locale } from "@/lib/i18n/locales"

export const routing = defineRouting({
  locales: [...APP_LOCALES],
  defaultLocale: "en",
  localePrefix: "always",
})

export const localeNames: Record<string, string> = LOCALE_NAMES

export const rtlLocales = new Set<string>([])

export type AppLocale = Locale
