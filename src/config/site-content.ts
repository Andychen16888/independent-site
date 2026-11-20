/**
 * Localized copy for the sections added in the visual upgrade.
 *
 * Kept separate from `messages/*.json` so the new marketing sections ship
 * with their own translations without churning every locale file. Falls back
 * to English when a locale is missing.
 *
 * Copy is deliberately process-oriented and non-committal: no certificates,
 * customer counts, factory counts or country coverage are claimed.
 */

export interface SupplyChainItem {
  title: string
  description: string
}

export interface SiteContent {
  cta: {
    requestQuote: string
    contactUs: string
    viewProducts: string
    explore: string
    howItWorks: string
  }
  supplyChain: {
    eyebrow: string
    heading: string
    tagline: string
    items: SupplyChainItem[]
  }
  process: {
    eyebrow: string
    heading: string
    steps: string[]
  }
  port: {
    eyebrow: string
    heading: string
    body: string
  }
  trust: {
    eyebrow: string
    heading: string
    tagline: string
    items: string[]
  }
  global: {
    eyebrow: string
    heading: string
    body: string
  }
}

export const SITE_CONTENT: Record<string, SiteContent> = {
  en: {
    cta: {
      requestQuote: "Request a Quote",
      contactUs: "Contact Us",
      viewProducts: "View Products",
      explore: "Explore Commodities",
      howItWorks: "How It Works",
    },
    supplyChain: {
      eyebrow: "China Supply Chain",
      heading: "One Connected Supply Chain",
      tagline:
        "From major Chinese producers to your port, every stage is coordinated so bulk commodities move efficiently and predictably.",
      items: [
        { title: "Sourcing", description: "Matches your spec with state-owned enterprises, listed companies and major producers." },
        { title: "Negotiation", description: "Clean quotes at the source price — you pay for goods and freight, not inflated margins." },
        { title: "Quality Control", description: "Inspect goods against your specification before they leave the factory." },
        { title: "Export & Logistics", description: "Handle documentation, inspection and sea freight end to end." },
      ],
    },
    process: {
      eyebrow: "From China to the World",
      heading: "How Sourcing Works",
      steps: ["Inquiry", "Sourcing", "Quote", "Inspection", "Port", "Shipping", "Buyer"],
    },
    port: {
      eyebrow: "Global Export",
      heading: "Connecting China with Southeast Asia & Africa",
      body: "We coordinate sourcing, inspection and freight so bulk orders move from Chinese factories to ports and onward to buyers across Southeast Asia, Africa and Belt & Road economies.",
    },
    trust: {
      eyebrow: "Why Our Buyers Stay",
      heading: "20 Years of Process, Not Promises",
      tagline: "Every order follows the same disciplined workflow and an AAA-rated track record — the foundation of reliable commodity trade.",
      items: ["20 Years of Exports", "AAA Credit Rating", "State-Owned & Listed Suppliers", "Lean Service Fees", "Fast Off-List Inquiries"],
    },
    global: {
      eyebrow: "Global Network",
      heading: "Trusted Relationships, Worldwide",
      body: "Two decades of exports have built lasting business ties with well-known companies across Southeast Asia, Africa and the Belt & Road economies.",
    },
  },

  zh: {
    cta: {
      requestQuote: "请求报价",
      contactUs: "联系我们",
      viewProducts: "查看产品",
      explore: "浏览商品",
      howItWorks: "合作流程",
    },
    supplyChain: {
      eyebrow: "中国供应链",
      heading: "一体化供应链",
      tagline: "从中国大型生产企业到您的港口，每个环节协同运作，让大宗商品高效、稳定地流动。",
      items: [
        { title: "寻源", description: "按您的规格对接国企、上市公司与大型生产企业。" },
        { title: "议价", description: "透明报价直达源头价格——您只为货物与运费买单，无虚高利润。" },
        { title: "质检", description: "出货前按您的规格进行验货。" },
        { title: "出口与物流", description: "全程处理单证、检验与海运。" },
      ],
    },
    process: {
      eyebrow: "从中国走向世界",
      heading: "采购流程",
      steps: ["询价", "寻源", "报价", "验货", "港口", "海运", "买家"],
    },
    port: {
      eyebrow: "全球出口",
      heading: "连接中国与东南亚、非洲市场",
      body: "我们统筹寻源、验货与运输，让大宗订单从中国工厂直达港口，并运往东南亚、非洲及一带一路经济体的买家。",
    },
    trust: {
      eyebrow: "买家选择我们的原因",
      heading: "20 年流程沉淀，而非空头承诺",
      tagline: "每一笔订单都遵循同样严谨的流程，并拥有 AAA 级信用记录——这是可靠大宗贸易的基础。",
      items: ["20 年出口经验", "AAA 级信用评级", "国企与上市公司供应商", "低廉服务费", "未列商品快速响应"],
    },
    global: {
      eyebrow: "全球网络",
      heading: "遍布全球的长期合作",
      body: "二十年出口历程，我们在东南亚、非洲及一带一路经济体与众多知名企业建立了持久的商业联系。",
    },
  },

  es: {
    cta: {
      requestQuote: "Solicitar presupuesto",
      contactUs: "Contáctenos",
      viewProducts: "Ver productos",
      explore: "Explorar productos",
      howItWorks: "Cómo funciona",
    },
    supplyChain: {
      eyebrow: "Cadena de suministro en China",
      heading: "Una cadena de suministro conectada",
      tagline:
        "De la fabricación al flete, cada etapa se coordina para que sus mercancías se muevan de forma eficiente y predecible.",
      items: [
        { title: "Fábrica", description: "Acceso a fabricantes verificados en los principales centros de producción de China." },
        { title: "Almacén", description: "Consolide varios pedidos en un solo lugar antes del envío." },
        { title: "Control de calidad", description: "Inspeccione la mercancía según su especificación antes de que salga de fábrica." },
        { title: "Logística", description: "Coordine flete aéreo y marítimo con la documentación gestionada de principio a fin." },
      ],
    },
    process: {
      eyebrow: "De China al mundo",
      heading: "Cómo funciona el abastecimiento",
      steps: ["Fábrica", "Inspección", "Almacén", "Puerto", "Transporte", "Comprador"],
    },
    port: {
      eyebrow: "Exportación global",
      heading: "Conectamos China con los mercados globales",
      body: "Coordinamos el abastecimiento, la inspección y el flete para que los pedidos al por mayor viajen de las fábricas chinas a los puertos y de allí a compradores de todo el mundo.",
    },
    trust: {
      eyebrow: "Calidad y cumplimiento",
      heading: "Basado en procesos, no en promesas",
      tagline: "Cada pedido sigue el mismo flujo de trabajo disciplinado: la base del comercio internacional fiable.",
      items: ["Proveedores verificados", "Inspección previa al envío", "Documentación de exportación", "Logística consolidada"],
    },
    global: {
      eyebrow: "Red global",
      heading: "Abastecimiento sin fronteras",
      body: "Nuestras operaciones de exportación conectan la fabricación china con compradores a través de rutas comerciales internacionales consolidadas.",
    },
  },

  pt: {
    cta: {
      requestQuote: "Solicitar cotação",
      contactUs: "Fale conosco",
      viewProducts: "Ver produtos",
      explore: "Explorar produtos",
      howItWorks: "Como funciona",
    },
    supplyChain: {
      eyebrow: "Cadeia de suprimentos na China",
      heading: "Uma cadeia de suprimentos conectada",
      tagline:
        "Da fabricação ao frete, cada etapa é coordenada para que suas mercadorias circulem de forma eficiente e previsível.",
      items: [
        { title: "Fábrica", description: "Acesso a fabricantes verificados nos principais polos produtivos da China." },
        { title: "Armazém", description: "Consolide vários pedidos em um só local antes do envio." },
        { title: "Controle de qualidade", description: "Inspecione as mercadorias conforme sua especificação antes de saírem da fábrica." },
        { title: "Logística", description: "Coordene frete aéreo e marítimo com a documentação tratada de ponta a ponta." },
      ],
    },
    process: {
      eyebrow: "Da China para o mundo",
      heading: "Como funciona o sourcing",
      steps: ["Fábrica", "Inspeção", "Armazém", "Porto", "Transporte", "Comprador"],
    },
    port: {
      eyebrow: "Exportação global",
      heading: "Conectando a China aos mercados globais",
      body: "Coordenamos sourcing, inspeção e frete para que pedidos no atacado saiam das fábricas chinesas para os portos e cheguem a compradores no mundo todo.",
    },
    trust: {
      eyebrow: "Qualidade e conformidade",
      heading: "Baseado em processos, não em promessas",
      tagline: "Cada pedido segue o mesmo fluxo de trabalho disciplinado — a base do comércio internacional confiável.",
      items: ["Fornecedores verificados", "Inspeção pré-embarque", "Documentação de exportação", "Logística consolidada"],
    },
    global: {
      eyebrow: "Rede global",
      heading: "Sourcing sem fronteiras",
      body: "Nossas operações de exportação conectam a fabricação chinesa a compradores por rotas comerciais internacionais consolidadas.",
    },
  },

  fr: {
    cta: {
      requestQuote: "Demander un devis",
      contactUs: "Nous contacter",
      viewProducts: "Voir les produits",
      explore: "Explorer les produits",
      howItWorks: "Comment ça marche",
    },
    supplyChain: {
      eyebrow: "Chaîne d'approvisionnement en Chine",
      heading: "Une chaîne d'approvisionnement connectée",
      tagline:
        "De la fabrication au fret, chaque étape est coordonnée pour que vos marchandises circulent de manière efficace et prévisible.",
      items: [
        { title: "Usine", description: "Accès à des fabricants vérifiés dans les principaux pôles de production chinois." },
        { title: "Entrepôt", description: "Regroupez plusieurs commandes en un seul endroit avant l'expédition." },
        { title: "Contrôle qualité", description: "Inspectez les marchandises selon vos spécifications avant leur départ de l'usine." },
        { title: "Logistique", description: "Coordonnez le fret aérien et maritime, avec la documentation gérée de bout en bout." },
      ],
    },
    process: {
      eyebrow: "De la Chine au monde",
      heading: "Comment fonctionne le sourcing",
      steps: ["Usine", "Inspection", "Entrepôt", "Port", "Fret", "Acheteur"],
    },
    port: {
      eyebrow: "Export mondial",
      heading: "Relier la Chine aux marchés mondiaux",
      body: "Nous coordonnons le sourcing, l'inspection et le fret afin que les commandes en gros partent des usines chinoises vers les ports, puis vers des acheteurs du monde entier.",
    },
    trust: {
      eyebrow: "Qualité et conformité",
      heading: "Fondé sur des processus, pas des promesses",
      tagline: "Chaque commande suit le même flux de travail rigoureux — le fondement d'un commerce international fiable.",
      items: ["Fournisseurs vérifiés", "Inspection avant expédition", "Documentation d'exportation", "Logistique groupée"],
    },
    global: {
      eyebrow: "Réseau mondial",
      heading: "Un sourcing sans frontières",
      body: "Nos opérations d'exportation relient la fabrication chinoise à des acheteurs via des routes commerciales internationales établies.",
    },
  },

  de: {
    cta: {
      requestQuote: "Angebot anfordern",
      contactUs: "Kontakt",
      viewProducts: "Produkte ansehen",
      explore: "Produkte entdecken",
      howItWorks: "So funktioniert es",
    },
    supplyChain: {
      eyebrow: "Lieferkette in China",
      heading: "Eine vernetzte Lieferkette",
      tagline:
        "Von der Fertigung bis zum Frachtverkehr wird jede Phase koordiniert, damit Ihre Waren effizient und planbar unterwegs sind.",
      items: [
        { title: "Werk", description: "Zugang zu geprüften Herstellungspartnern in den wichtigsten Produktionszentren Chinas." },
        { title: "Lager", description: "Bündeln Sie mehrere Bestellungen an einem Ort vor dem Versand." },
        { title: "Qualitätskontrolle", description: "Prüfen Sie die Ware nach Ihrer Spezifikation, bevor sie das Werk verlässt." },
        { title: "Logistik", description: "Koordinieren Sie Luft- und Seefracht mit durchgängig bearbeiteten Dokumenten." },
      ],
    },
    process: {
      eyebrow: "Von China in die Welt",
      heading: "So funktioniert die Beschaffung",
      steps: ["Werk", "Prüfung", "Lager", "Hafen", "Fracht", "Käufer"],
    },
    port: {
      eyebrow: "Globaler Export",
      heading: "China mit den Weltmärkten verbinden",
      body: "Wir koordinieren Beschaffung, Prüfung und Fracht, damit Großbestellungen von chinesischen Werken zu den Häfen und weiter zu Käufern weltweit gelangen.",
    },
    trust: {
      eyebrow: "Qualität & Konformität",
      heading: "Auf Prozessen aufgebaut, nicht auf Versprechen",
      tagline: "Jede Bestellung folgt demselben disziplinierten Ablauf — die Grundlage verlässlichen internationalen Handels.",
      items: ["Geprüfte Lieferanten", "Prüfung vor Versand", "Exportdokumentation", "Konsolidierte Logistik"],
    },
    global: {
      eyebrow: "Globales Netzwerk",
      heading: "Beschaffung ohne Grenzen",
      body: "Unsere Exporttätigkeit verbindet chinesische Fertigung über etablierte internationale Handelsrouten mit Käufern.",
    },
  },

  ru: {
    cta: {
      requestQuote: "Запросить цену",
      contactUs: "Связаться с нами",
      viewProducts: "Смотреть товары",
      explore: "Изучить товары",
      howItWorks: "Как это работает",
    },
    supplyChain: {
      eyebrow: "Цепочка поставок в Китае",
      heading: "Единая связанная цепочка поставок",
      tagline:
        "От производства до фрахта — каждый этап согласован, чтобы ваш груз двигался эффективно и предсказуемо.",
      items: [
        { title: "Завод", description: "Доступ к проверенным производителям в ключевых промышленных центрах Китая." },
        { title: "Склад", description: "Объединяйте несколько заказов в одном месте перед отправкой." },
        { title: "Контроль качества", description: "Проверка товара по вашим спецификациям до выхода с завода." },
        { title: "Логистика", description: "Координация авиа- и морских перевозок с полным оформлением документов." },
      ],
    },
    process: {
      eyebrow: "Из Китая в мир",
      heading: "Как работает закупка",
      steps: ["Завод", "Проверка", "Склад", "Порт", "Доставка", "Покупатель"],
    },
    port: {
      eyebrow: "Глобальный экспорт",
      heading: "Соединяем Китай с мировыми рынками",
      body: "Мы координируем закупку, инспекцию и фрахт, чтобы оптовые заказы шли с китайских заводов в порты и далее к покупателям по всему миру.",
    },
    trust: {
      eyebrow: "Качество и соответствие",
      heading: "Основано на процессах, а не на обещаниях",
      tagline: "Каждый заказ следует одному и тому же чёткому процессу — основе надёжной международной торговли.",
      items: ["Проверенные поставщики", "Инспекция перед отправкой", "Экспортные документы", "Консолидированная логистика"],
    },
    global: {
      eyebrow: "Глобальная сеть",
      heading: "Закупки без границ",
      body: "Наши экспортные операции связывают китайское производство с покупателями через проверенные международные торговые маршруты.",
    },
  },

}

export function getSiteContent(locale: string): SiteContent {
  return SITE_CONTENT[locale] || SITE_CONTENT.en
}
