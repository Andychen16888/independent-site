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
        "From manufacturing to freight, every stage is coordinated so your goods move efficiently and predictably.",
      items: [
        { title: "Factory", description: "Access vetted manufacturing partners across China's major production hubs." },
        { title: "Warehouse", description: "Consolidate multiple orders in one place before they ship." },
        { title: "Quality Control", description: "Inspect goods against your specification before they leave the factory." },
        { title: "Logistics", description: "Coordinate air and sea freight with documentation handled end to end." },
      ],
    },
    process: {
      eyebrow: "From China to the World",
      heading: "How Sourcing Works",
      steps: ["Factory", "Inspection", "Warehouse", "Port", "Shipping", "Buyer"],
    },
    port: {
      eyebrow: "Global Export",
      heading: "Connecting China with Global Markets",
      body: "We coordinate sourcing, inspection and freight so bulk orders move from Chinese factories to ports and onward to buyers worldwide.",
    },
    trust: {
      eyebrow: "Quality & Compliance",
      heading: "Built on Process, Not Promises",
      tagline: "Every order follows the same disciplined workflow — the foundation of reliable international trade.",
      items: ["Verified Suppliers", "Pre-Shipment Inspection", "Export Documentation", "Consolidated Logistics"],
    },
    global: {
      eyebrow: "Global Network",
      heading: "Sourcing Without Borders",
      body: "Our export operations connect Chinese manufacturing with buyers across established international trade routes.",
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
      tagline: "从生产到运输，每个环节协同运作，让您的货物高效、稳定地流动。",
      items: [
        { title: "工厂", description: "对接中国主要产业带中经过审核的制造合作伙伴。" },
        { title: "仓储", description: "发运前将多个订单集中整合。" },
        { title: "质检", description: "出货前按您的规格进行验货。" },
        { title: "物流", description: "协调空运与海运，全程处理出口单证。" },
      ],
    },
    process: {
      eyebrow: "从中国走向世界",
      heading: "采购流程",
      steps: ["工厂", "验货", "仓储", "港口", "海运", "买家"],
    },
    port: {
      eyebrow: "全球出口",
      heading: "连接中国与全球市场",
      body: "我们统筹采购、验货与运输，让大宗订单从中国工厂直达港口并运往全球买家。",
    },
    trust: {
      eyebrow: "质量与合规",
      heading: "以流程为本，而非承诺",
      tagline: "每一笔订单都遵循同样严谨的流程——这是可靠国际贸易的基础。",
      items: ["审核供应商", "出货前验货", "出口单证", "集拼运输"],
    },
    global: {
      eyebrow: "全球网络",
      heading: "无国界采购",
      body: "我们的出口业务依托成熟的国际贸易航线，连接中国制造与全球买家。",
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

  ar: {
    cta: {
      requestQuote: "اطلب عرض سعر",
      contactUs: "اتصل بنا",
      viewProducts: "عرض المنتجات",
      explore: "استكشف المنتجات",
      howItWorks: "كيف تعمل",
    },
    supplyChain: {
      eyebrow: "سلسلة التوريد في الصين",
      heading: "سلسلة توريد واحدة متكاملة",
      tagline: "من التصنيع إلى الشحن، تُنسَّق كل مرحلة ليتحرك بضائعك بكفاءة وموثوقية.",
      items: [
        { title: "المصنع", description: "الوصول إلى مصنّعين موثوقين في أهم مراكز الإنتاج في الصين." },
        { title: "المستودع", description: "اجمع عدة طلبات في مكان واحد قبل الشحن." },
        { title: "مراقبة الجودة", description: "افحص البضائع وفق مواصفاتك قبل مغادرتها المصنع." },
        { title: "اللوجستيات", description: "نسّق الشحن الجوي والبحري مع إتمام المستندات من البداية إلى النهاية." },
      ],
    },
    process: {
      eyebrow: "من الصين إلى العالم",
      heading: "كيف تعمل عملية التوريد",
      steps: ["المصنع", "الفحص", "المستودع", "الميناء", "الشحن", "المشتري"],
    },
    port: {
      eyebrow: "التصدير العالمي",
      heading: "نربط الصين بالأسواق العالمية",
      body: "ننسّق التوريد والفحص والشحن لتنتقل الطلبات بالجملة من المصانع الصينية إلى الموانئ ثم إلى المشترين حول العالم.",
    },
    trust: {
      eyebrow: "الجودة والامتثال",
      heading: "مبني على العمليات لا على الوعود",
      tagline: "كل طلب يتبع سير عمل منظّمًا واحدًا — أساس التجارة الدولية الموثوقة.",
      items: ["موردون موثوقون", "فحص قبل الشحن", "مستندات التصدير", "لوجستيات مجمّعة"],
    },
    global: {
      eyebrow: "شبكة عالمية",
      heading: "توريد بلا حدود",
      body: "تربط عملياتنا التصديرية التصنيع الصيني بالمشترين عبر طرق تجارية دولية راسخة.",
    },
  },

  id: {
    cta: {
      requestQuote: "Minta Penawaran",
      contactUs: "Hubungi Kami",
      viewProducts: "Lihat Produk",
      explore: "Jelajahi Produk",
      howItWorks: "Cara Kerja",
    },
    supplyChain: {
      eyebrow: "Rantai Pasok Tiongkok",
      heading: "Satu Rantai Pasok Terhubung",
      tagline:
        "Dari manufaktur hingga pengiriman, setiap tahap dikoordinasikan agar barang Anda bergerak efisien dan terprediksi.",
      items: [
        { title: "Pabrik", description: "Akses ke mitra manufaktur terverifikasi di pusat produksi utama Tiongkok." },
        { title: "Gudang", description: "Konsolidasikan beberapa pesanan di satu tempat sebelum dikirim." },
        { title: "Kontrol Kualitas", description: "Periksa barang sesuai spesifikasi Anda sebelum meninggalkan pabrik." },
        { title: "Logistik", description: "Koordinasikan angkutan udara dan laut dengan dokumen yang ditangani menyeluruh." },
      ],
    },
    process: {
      eyebrow: "Dari Tiongkok ke Dunia",
      heading: "Cara Kerja Pengadaan",
      steps: ["Pabrik", "Inspeksi", "Gudang", "Pelabuhan", "Pengiriman", "Pembeli"],
    },
    port: {
      eyebrow: "Ekspor Global",
      heading: "Menghubungkan Tiongkok dengan Pasar Global",
      body: "Kami mengoordinasikan pengadaan, inspeksi, dan pengiriman agar pesanan grosir bergerak dari pabrik Tiongkok ke pelabuhan hingga ke pembeli di seluruh dunia.",
    },
    trust: {
      eyebrow: "Kualitas & Kepatuhan",
      heading: "Dibangun atas Proses, Bukan Janji",
      tagline: "Setiap pesanan mengikuti alur kerja yang sama dan disiplin — dasar perdagangan internasional yang andal.",
      items: ["Pemasok Terverifikasi", "Inspeksi Pra-Pengiriman", "Dokumen Ekspor", "Logistik Terkonsolidasi"],
    },
    global: {
      eyebrow: "Jaringan Global",
      heading: "Pengadaan Tanpa Batas",
      body: "Operasi ekspor kami menghubungkan manufaktur Tiongkok dengan pembeli melalui rute perdagangan internasional yang mapan.",
    },
  },

  vi: {
    cta: {
      requestQuote: "Yêu cầu báo giá",
      contactUs: "Liên hệ",
      viewProducts: "Xem sản phẩm",
      explore: "Khám phá sản phẩm",
      howItWorks: "Cách hoạt động",
    },
    supplyChain: {
      eyebrow: "Chuỗi cung ứng Trung Quốc",
      heading: "Một chuỗi cung ứng kết nối",
      tagline:
        "Từ sản xuất đến vận chuyển, mọi khâu đều được phối hợp để hàng hóa của bạn di chuyển hiệu quả và ổn định.",
      items: [
        { title: "Nhà máy", description: "Tiếp cận các nhà sản xuất đã được xác minh tại các trung tâm sản xuất lớn của Trung Quốc." },
        { title: "Kho", description: "Gom nhiều đơn hàng về một nơi trước khi vận chuyển." },
        { title: "Kiểm soát chất lượng", description: "Kiểm tra hàng hóa theo đúng yêu cầu của bạn trước khi rời nhà máy." },
        { title: "Logistics", description: "Phối hợp vận tải hàng không và đường biển, xử lý chứng từ trọn gói." },
      ],
    },
    process: {
      eyebrow: "Từ Trung Quốc ra thế giới",
      heading: "Quy trình thu mua",
      steps: ["Nhà máy", "Kiểm hàng", "Kho", "Cảng", "Vận chuyển", "Người mua"],
    },
    port: {
      eyebrow: "Xuất khẩu toàn cầu",
      heading: "Kết nối Trung Quốc với thị trường toàn cầu",
      body: "Chúng tôi phối hợp thu mua, kiểm hàng và vận chuyển để các đơn hàng số lượng lớn đi từ nhà máy Trung Quốc ra cảng và đến tay người mua trên toàn thế giới.",
    },
    trust: {
      eyebrow: "Chất lượng & Tuân thủ",
      heading: "Xây dựng trên quy trình, không phải lời hứa",
      tagline: "Mỗi đơn hàng đều theo cùng một quy trình chuẩn mực — nền tảng của thương mại quốc tế đáng tin cậy.",
      items: ["Nhà cung cấp đã xác minh", "Kiểm hàng trước khi gửi", "Chứng từ xuất khẩu", "Logistics hợp nhất"],
    },
    global: {
      eyebrow: "Mạng lưới toàn cầu",
      heading: "Thu mua không biên giới",
      body: "Hoạt động xuất khẩu của chúng tôi kết nối sản xuất Trung Quốc với người mua qua các tuyến thương mại quốc tế lâu đời.",
    },
  },

  th: {
    cta: {
      requestQuote: "ขอใบเสนอราคา",
      contactUs: "ติดต่อเรา",
      viewProducts: "ดูสินค้า",
      explore: "สำรวจสินค้า",
      howItWorks: "วิธีการทำงาน",
    },
    supplyChain: {
      eyebrow: "ห่วงโซ่อุปทานจีน",
      heading: "ห่วงโซ่อุปทานที่เชื่อมต่อเป็นหนึ่งเดียว",
      tagline: "ตั้งแต่การผลิตจนถึงการขนส่ง ทุกขั้นตอนได้รับการประสานงานให้สินค้าของคุณเคลื่อนที่อย่างมีประสิทธิภาพและคาดการณ์ได้",
      items: [
        { title: "โรงงาน", description: "เข้าถึงพันธมิตรการผลิตที่ผ่านการตรวจสอบในศูนย์การผลิตหลักของจีน" },
        { title: "คลังสินค้า", description: "รวมหลายคำสั่งซื้อไว้ที่เดียวช่องทางเดียวก่อนจัดส่ง" },
        { title: "ควบคุมคุณภาพ", description: "ตรวจสอบสินค้าตามข้อกำหนดของคุณก่อนออกจากโรงงาน" },
        { title: "โลจิสติกส์", description: "ประสานงานขนส่งทางอากาศและทางทะเล พร้อมจัดการเอกสารครบวงจร" },
      ],
    },
    process: {
      eyebrow: "จากจีนสู่ทั่วโลก",
      heading: "ขั้นตอนการจัดหา",
      steps: ["โรงงาน", "ตรวจสอบ", "คลังสินค้า", "ท่าเรือ", "ขนส่ง", "ผู้ซื้อ"],
    },
    port: {
      eyebrow: "การส่งออกทั่วโลก",
      heading: "เชื่อมจีนกับตลาดโลก",
      body: "เราประสานการจัดหา การตรวจสอบ และการขนส่ง เพื่อให้คำสั่งซื้อจำนวนมากเคลื่อนจากโรงงานในจีนสู่ท่าเรือและต่อไปยังผู้ซื้อทั่วโลก",
    },
    trust: {
      eyebrow: "คุณภาพและการปฏิบัติตามข้อกำหนด",
      heading: "สร้างบนกระบวนการ ไม่ใช่คำสัญญา",
      tagline: "ทุกคำสั่งซื้อดำเนินตามขั้นตอนเดียวกันอย่างเป็นระบบ — รากฐานของการค้าระหว่างประเทศที่เชื่อถือได้",
      items: ["ซัพพลายเออร์ที่ผ่านการตรวจสอบ", "ตรวจสอบก่อนจัดส่ง", "เอกสารการส่งออก", "โลจิสติกส์แบบรวม"],
    },
    global: {
      eyebrow: "เครือข่ายทั่วโลก",
      heading: "จัดหาโดยไร้พรมแดน",
      body: "การดำเนินงานส่งออกของเราเชื่อมการผลิตของจีนกับผู้ซื้อผ่านเส้นทางการค้าระหว่างประเทศที่มั่นคง",
    },
  },

  ms: {
    cta: {
      requestQuote: "Minta Sebut Harga",
      contactUs: "Hubungi Kami",
      viewProducts: "Lihat Produk",
      explore: "Terokai Produk",
      howItWorks: "Cara Ia Berfungsi",
    },
    supplyChain: {
      eyebrow: "Rantaian Bekalan China",
      heading: "Satu Rantaian Bekalan Bersepadu",
      tagline:
        "Dari pembuatan hingga penghantaran, setiap peringkat diselaraskan supaya barang anda bergerak cekap dan boleh dijangka.",
      items: [
        { title: "Kilang", description: "Akses kepada pengeluar yang disahkan di pusat pengeluaran utama China." },
        { title: "Gudang", description: "Satukan beberapa pesanan di satu lokasi sebelum dihantar." },
        { title: "Kawalan Kualiti", description: "Periksa barang mengikut spesifikasi anda sebelum meninggalkan kilang." },
        { title: "Logistik", description: "Selaraskan penghantaran udara dan laut dengan dokumentasi diuruskan sepenuhnya." },
      ],
    },
    process: {
      eyebrow: "Dari China ke Dunia",
      heading: "Cara Perolehan Berfungsi",
      steps: ["Kilang", "Pemeriksaan", "Gudang", "Pelabuhan", "Penghantaran", "Pembeli"],
    },
    port: {
      eyebrow: "Eksport Global",
      heading: "Menghubungkan China dengan Pasaran Global",
      body: "Kami menyelaraskan perolehan, pemeriksaan dan penghantaran supaya pesanan pukal bergerak dari kilang China ke pelabuhan dan seterusnya kepada pembeli di seluruh dunia.",
    },
    trust: {
      eyebrow: "Kualiti & Pematuhan",
      heading: "Dibina atas Proses, Bukan Janji",
      tagline: "Setiap pesanan mengikut aliran kerja yang sama dan berdisiplin — asas perdagangan antarabangsa yang boleh dipercayai.",
      items: ["Pembekal Disahkan", "Pemeriksaan Pra-Penghantaran", "Dokumentasi Eksport", "Logistik Disatukan"],
    },
    global: {
      eyebrow: "Rangkaian Global",
      heading: "Perolehan Tanpa Sempadan",
      body: "Operasi eksport kami menghubungkan pembuatan China dengan pembeli melalui laluan perdagangan antarabangsa yang mantap.",
    },
  },
}

export function getSiteContent(locale: string): SiteContent {
  return SITE_CONTENT[locale] || SITE_CONTENT.en
}
