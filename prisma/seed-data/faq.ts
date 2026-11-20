import type { FaqTranslationSeed } from "./types"
import { faq1Translations } from "./faq-part1"
import { faq2Translations } from "./faq-part1"
import { faq3Translations } from "./faq-part1"
import { faq4Translations } from "./faq-part2"
import { faq5Translations } from "./faq-part2"
import { faq6Translations } from "./faq-part2"
import { filterSupportedLocales } from "./locales"

export const faqTranslationsSeed: Record<string, FaqTranslationSeed>[] = [
  filterSupportedLocales(faq1Translations),
  filterSupportedLocales(faq2Translations),
  filterSupportedLocales(faq3Translations),
  filterSupportedLocales(faq4Translations),
  filterSupportedLocales(faq5Translations),
  filterSupportedLocales(faq6Translations),
]