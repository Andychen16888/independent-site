import type { BlogTranslationSeed } from "./types"
import { importBeginnerTranslations } from "./blog-import"
import { qualityControlTranslations } from "./blog-quality-control"
import { freightTranslations } from "./blog-freight"
import { moqTranslations } from "./blog-moq"
import { ledTranslations } from "./blog-led"
import { customsTranslations } from "./blog-customs"

export const blogTranslationsSeed: Record<string, Record<string, BlogTranslationSeed>> = {
  "import-from-china-beginners-guide": importBeginnerTranslations,
  "quality-control-101": qualityControlTranslations,
  "air-freight-vs-sea-freight": freightTranslations,
  "understanding-moq-negotiation": moqTranslations,
  "why-led-lighting-transforming-wholesale": ledTranslations,
  "customs-tariffs-importer-guide": customsTranslations,
}

export const defaultBlogPostTranslations = blogTranslationsSeed