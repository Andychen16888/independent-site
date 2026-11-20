import type { BlogTranslationSeed } from "./types"
import { importBeginnerTranslations } from "./blog-import"
import { qualityControlTranslations } from "./blog-quality-control"
import { freightTranslations } from "./blog-freight"
import { moqTranslations } from "./blog-moq"
import { ledTranslations } from "./blog-led"
import { customsTranslations } from "./blog-customs"
import { newSilkRoadTranslations } from "./blog-new-silk-road"
import { carbonBlackTranslations } from "./blog-carbon-black"
import { pvcTranslations } from "./blog-pvc"
import { ppPeTranslations } from "./blog-pp-pe"
import { titaniumDioxideTranslations } from "./blog-tio2"
import { industrialMineralsTranslations } from "./blog-industrial-minerals"
import { copperAluminumTranslations } from "./blog-copper-aluminum"
import { steelCementTranslations } from "./blog-steel-cement"
import { tradeServiceTranslations } from "./blog-trade-service"
import { filterSupportedLocales } from "./locales"

export const blogTranslationsSeed: Record<string, Record<string, BlogTranslationSeed>> = {
  "import-from-china-beginners-guide": filterSupportedLocales(importBeginnerTranslations),
  "quality-control-101": filterSupportedLocales(qualityControlTranslations),
  "air-freight-vs-sea-freight": filterSupportedLocales(freightTranslations),
  "understanding-moq-negotiation": filterSupportedLocales(moqTranslations),
  "why-led-lighting-transforming-wholesale": filterSupportedLocales(ledTranslations),
  "customs-tariffs-importer-guide": filterSupportedLocales(customsTranslations),
  "new-silk-road-commodities": filterSupportedLocales(newSilkRoadTranslations),
  "carbon-black-sourcing-guide": filterSupportedLocales(carbonBlackTranslations),
  "pvc-resin-buyers-guide": filterSupportedLocales(pvcTranslations),
  "pp-pe-polymer-guide": filterSupportedLocales(ppPeTranslations),
  "titanium-dioxide-buyers-guide": filterSupportedLocales(titaniumDioxideTranslations),
  "industrial-minerals-guide": filterSupportedLocales(industrialMineralsTranslations),
  "copper-aluminum-metals-guide": filterSupportedLocales(copperAluminumTranslations),
  "steel-cement-clinker-infrastructure": filterSupportedLocales(steelCementTranslations),
  "how-our-trade-service-works": filterSupportedLocales(tradeServiceTranslations),
}

export const defaultBlogPostTranslations = blogTranslationsSeed