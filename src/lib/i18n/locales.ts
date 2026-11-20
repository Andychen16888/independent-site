export const APP_LOCALES = ["en", "zh", "es", "pt", "fr", "de", "ru"] as const

export type AppLocale = (typeof APP_LOCALES)[number]

export const CONTENT_LOCALES = APP_LOCALES.filter((locale) => locale !== "en")

export const REMOVED_LOCALES = ["ar", "id", "vi", "th", "ms"] as const

export const LOCALE_NAMES: Record<string, string> = {
  en: "English",
  zh: "简体中文",
  es: "Español",
  pt: "Português",
  fr: "Français",
  de: "Deutsch",
  ru: "Русский",
}

export const LOCALE_NAMES_EN: Record<string, string> = {
  en: "English",
  zh: "Simplified Chinese",
  es: "Spanish",
  pt: "Portuguese",
  fr: "French",
  de: "German",
  ru: "Russian",
}
