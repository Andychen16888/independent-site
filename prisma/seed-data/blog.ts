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

export const blogTranslationsSeed: Record<string, Record<string, BlogTranslationSeed>> = {
  "import-from-china-beginners-guide": importBeginnerTranslations,
  "quality-control-101": qualityControlTranslations,
  "air-freight-vs-sea-freight": freightTranslations,
  "understanding-moq-negotiation": moqTranslations,
  "why-led-lighting-transforming-wholesale": ledTranslations,
  "customs-tariffs-importer-guide": customsTranslations,
  "new-silk-road-commodities": newSilkRoadTranslations,
  "carbon-black-sourcing-guide": carbonBlackTranslations,
  "pvc-resin-buyers-guide": pvcTranslations,
  "pp-pe-polymer-guide": ppPeTranslations,
  "titanium-dioxide-buyers-guide": titaniumDioxideTranslations,
  "industrial-minerals-guide": industrialMineralsTranslations,
  "copper-aluminum-metals-guide": copperAluminumTranslations,
  "steel-cement-clinker-infrastructure": steelCementTranslations,
  "how-our-trade-service-works": tradeServiceTranslations,
}

export const defaultBlogPostTranslations = blogTranslationsSeed