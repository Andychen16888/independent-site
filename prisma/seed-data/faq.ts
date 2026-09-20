import type { FaqTranslationSeed } from "./types"
import { faq1Translations } from "./faq-part1"
import { faq2Translations } from "./faq-part1"
import { faq3Translations } from "./faq-part1"
import { faq4Translations } from "./faq-part2"
import { faq5Translations } from "./faq-part2"
import { faq6Translations } from "./faq-part2"

export const faqTranslationsSeed: Record<string, FaqTranslationSeed>[] = [
  faq1Translations,
  faq2Translations,
  faq3Translations,
  faq4Translations,
  faq5Translations,
  faq6Translations,
]