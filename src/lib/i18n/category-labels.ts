import { normalizeCategoryKey } from "@/lib/categories/slug"

const CATEGORY_NAME_MAP: Record<string, Record<string, string>> = {
  "agricultural-commodities": {
    zh: "农产品",
    es: "Productos agrícolas",
    pt: "Commodities agrícolas",
    fr: "Produits agricoles",
    de: "Agrarrohstoffe",
    ru: "Сельхозтовары",
  },
  "chemical-products": {
    zh: "化工产品",
    es: "Productos químicos",
    pt: "Produtos químicos",
    fr: "Produits chimiques",
    de: "Chemische Produkte",
    ru: "Химическая продукция",
  },
  "metal-products": {
    zh: "金属产品",
    es: "Productos metálicos",
    pt: "Produtos metálicos",
    fr: "Produits métalliques",
    de: "Metallprodukte",
    ru: "Металлы",
  },
  minerals: {
    zh: "矿产",
    es: "Minerales",
    pt: "Minerais",
    fr: "Minéraux",
    de: "Mineralien",
    ru: "Минералы",
  },
  energy: {
    zh: "能源",
    es: "Energía",
    pt: "Energia",
    fr: "Énergie",
    de: "Energie",
    ru: "Энергоресурсы",
  },
  electronics: {
    zh: "电子产品",
    es: "Electrónica",
    pt: "Eletrônicos",
    fr: "Électronique",
    de: "Elektronik",
    ru: "Электроника",
  },
  "led-lighting": {
    zh: "LED照明",
    es: "Iluminación LED",
    pt: "Iluminação LED",
    fr: "Éclairage LED",
    de: "LED-Beleuchtung",
    ru: "LED-освещение",
  },
  "led-christmas-lights": {
    zh: "LED圣诞灯",
    es: "Luces navideñas LED",
    pt: "Luzes de Natal LED",
    fr: "Guirlandes LED de Noël",
    de: "LED-Weihnachtsbeleuchtung",
    ru: "LED рождественские огни",
  },
  "commercial-led-lighting": {
    zh: "商业LED照明",
    es: "Iluminacion LED comercial",
    pt: "Iluminacao LED comercial",
    fr: "Eclairage LED commercial",
    de: "Gewerbliche LED-Beleuchtung",
    ru: "Коммерческое LED-освещение",
  },
  "industrial-led-lighting": {
    zh: "工业LED照明",
    es: "Iluminacion LED industrial",
    pt: "Iluminacao LED industrial",
    fr: "Eclairage LED industriel",
    de: "Industrielle LED-Beleuchtung",
    ru: "Промышленное LED-освещение",
  },
  "decorative-led-lighting": {
    zh: "装饰LED照明",
    es: "Iluminacion LED decorativa",
    pt: "Iluminacao LED decorativa",
    fr: "Eclairage LED decoratif",
    de: "Dekorative LED-Beleuchtung",
    ru: "Декоративное LED-освещение",
  },
  "rare-earth-permanent-magnets": {
    zh: "稀土永磁体",
    es: "Imanes permanentes de tierras raras",
    pt: "Imas permanentes de terras raras",
    fr: "Aimants permanents en terres rares",
    de: "Seltene-Erden-Dauermagnete",
    ru: "Постоянные магниты из редкоземельных металлов",
  },
  "home-kitchen": {
    zh: "家居厨房",
    es: "Hogar y cocina",
    pt: "Casa e cozinha",
    fr: "Maison et cuisine",
    de: "Haushalt & Küche",
    ru: "Дом и кухня",
  },
  "building-materials": {
    zh: "建材",
    es: "Materiales de construcción",
    pt: "Materiais de construção",
    fr: "Matériaux de construction",
    de: "Baustoffe",
    ru: "Строительные материалы",
  },
}

export const CATEGORY_NAME_ALIASES: Record<string, string> = {
  chemicals: "chemical-products",
  chemical: "chemical-products",
  "chemical-product": "chemical-products",
  metals: "metal-products",
  metal: "metal-products",
  "metal-product": "metal-products",
  agriculture: "agricultural-commodities",
  agricultural: "agricultural-commodities",
  "agricultural-commodity": "agricultural-commodities",
  mineral: "minerals",
  electronic: "electronics",
  "electronic-product": "electronics",
  "electronic-products": "electronics",
  "electronics-products": "electronics",
  "led-light": "led-lighting",
  "led-lights": "led-lighting",
  "commercial-led-light": "commercial-led-lighting",
  "commercial-led-lights": "commercial-led-lighting",
  "industrial-led-light": "industrial-led-lighting",
  "industrial-led-lights": "industrial-led-lighting",
  "decorative-led-light": "decorative-led-lighting",
  "decorative-led-lights": "decorative-led-lighting",
  "rare-earth-permanent-magnet": "rare-earth-permanent-magnets",
  "rare-earth-magnet": "rare-earth-permanent-magnets",
  "rare-earth-magnets": "rare-earth-permanent-magnets",
  "led-christmas-light": "led-christmas-lights",
  "christmas-lights": "led-christmas-lights",
  "christmas-light": "led-christmas-lights",
  building: "building-materials",
  construction: "building-materials",
  "construction-materials": "building-materials",
  cement: "building-materials",
}

function normalizeCategorySlug(slug: string): string {
  return normalizeCategoryKey(slug)
}

/** Follows one alias hop, so `/categories/led-lights` reaches "led-lighting". */
export function resolveCategoryAlias(slug: string): string {
  const key = normalizeCategorySlug(slug)
  return CATEGORY_NAME_ALIASES[key] || key
}

export function localizeCategoryName(
  locale: string,
  slug: string,
  fallback: string,
  dbTranslatedName?: string | null
): string {
  if (locale === "en") return fallback
  if (dbTranslatedName && dbTranslatedName.trim()) return dbTranslatedName

  const normalizedSlug = normalizeCategorySlug(slug)
  const normalizedFallback = normalizeCategorySlug(fallback)

  const candidates = [
    CATEGORY_NAME_ALIASES[normalizedSlug],
    normalizedSlug,
    CATEGORY_NAME_ALIASES[normalizedFallback],
    normalizedFallback,
  ].filter(Boolean) as string[]

  for (const key of candidates) {
    const localized = CATEGORY_NAME_MAP[key]?.[locale]
    if (localized) return localized
  }

  return fallback
}
