import { defineRouting } from "next-intl/routing"

export const routing = defineRouting({
  locales: ["en", "zh", "es", "pt", "fr", "de", "ru", "ar", "id", "vi", "th", "ms"],
  defaultLocale: "en",
  localePrefix: "always",
})

export const localeNames: Record<string, string> = {
  en: "English",
  zh: "简体中文",
  es: "Español",
  pt: "Português",
  fr: "Français",
  de: "Deutsch",
  ru: "Русский",
  ar: "العربية",
  id: "Bahasa Indonesia",
  vi: "Tiếng Việt",
  th: "ภาษาไทย",
  ms: "Bahasa Melayu",
}

export const rtlLocales = new Set(["ar"])

export type AppLocale = (typeof routing.locales)[number]