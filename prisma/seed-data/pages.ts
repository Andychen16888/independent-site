// Page (About/Contact/Shipping/Privacy/Terms) translations for all supported locales.
// En keys are kept for reference; the "en" base lives in the Page model itself.

export interface PageTranslationSeed {
  title: string
  excerpt: string
  content: string
  seoTitle: string
  seoDescription: string
  seoKeywords: string
}

export const pageTranslationsSeed: Record<string, Record<string, PageTranslationSeed>> = {
  about: {
    zh: {
      title: "关于我们",
      excerpt: "我们的故事——从中国为全球采购优质商品。",
      content:
        "<h1>从中国走向世界</h1><p>我们的旅程始于中国的工厂与车间——从深圳的电子装配线到广州的厨具制造商。我们走遍全国，寻找秉承同一标准的生产者：值得信赖的品质。</p><p>我们相信，当好产品直接从生产者到达买家手中，购买会变得更简单。因此我们亲自负责采购、质量控制和运输——让您每次都能获得工厂直供的价值。</p>",
      seoTitle: "关于我们",
      seoDescription: "了解Commodities From China如何直接从中国供应商采购优质电子产品、厨具与日常用品。",
      seoKeywords: "关于我们, 我们的故事, 中国采购, B2B批发",
    },
    es: {
      title: "Sobre Nosotros",
      excerpt: "Nuestra historia: productos de calidad de China para el mundo.",
      content:
        "<h1>De China al Mundo</h1><p>Nuestro viaje comenzó en las fábricas y talleres de China: desde las líneas de ensamblaje electrónico en Shenzhen hasta los fabricantes de utensilios de cocina en Guangzhou. Recorrimos el país en busca de creadores que compartan un estándar: calidad en la que se puede confiar.</p><p>Creemos que comprar bien es más simple cuando los buenos productos van directo del fabricante al comprador. Por eso gestionamos nosotros mismos el abastecimiento, el control de calidad y el envío, para que siempre obtenga valor directo de fábrica.</p>",
      seoTitle: "Sobre Nosotros",
      seoDescription: "Descubra cómo Commodities From China obtiene productos electrónicos, utensilios de cocina y artículos cotidianos de calidad directamente de proveedores chinos.",
      seoKeywords: "sobre nosotros, nuestra historia, abastecimiento desde china, venta mayorista b2b",
    },
    pt: {
      title: "Sobre Nós",
      excerpt: "Nossa história — produtos de qualidade da China para o mundo.",
      content:
        "<h1>Da China para o Mundo</h1><p>Nossa jornada começou nas fábricas e oficinas da China, das linhas de montagem de eletrônicos em Shenzhen aos fabricantes de utensílios de cozinha em Guangzhou. Percorremos o país para encontrar produtores que compartilham um padrão: qualidade em que você pode confiar.</p><p>Acreditamos que comprar bem é mais simples quando bons produtos vão direto do produtor ao comprador. Por isso cuidamos nós mesmos do fornecimento, do controle de qualidade e do envio, para que você sempre tenha valor direto de fábrica.</p>",
      seoTitle: "Sobre Nós",
      seoDescription: "Descubra como a Commodities From China obtém eletrônicos, utensílios de cozinha e produtos do dia a dia de qualidade diretamente de fornecedores chineses.",
      seoKeywords: "sobre nós, nossa história, fornecimento da china, atacado b2b",
    },
    fr: {
      title: "À Propos de Nous",
      excerpt: "Notre histoire — des produits de qualité de la Chine vers le monde.",
      content:
        "<h1>De la Chine au Monde</h1><p>Notre voyage a commencé dans les usines et les ateliers de Chine, des chaînes d'assemblage électronique de Shenzhen aux fabricants d'ustensiles de cuisine de Guangzhou. Nous avons parcouru le pays pour trouver des fabricants partageant un même standard : une qualité de confiance.</p><p>Nous croyons qu'acheter mieux est plus simple lorsque de bons produits vont directement du producteur à l'acheteur. C'est pourquoi nous gérons nous-mêmes l'approvisionnement, le contrôle qualité et l'expédition, pour un vrai prix direct usine à chaque fois.</p>",
      seoTitle: "À Propos de Nous",
      seoDescription: "Découvrez comment Commodities From China s'approvisionne en électronique, ustensiles de cuisine et articles du quotidien de qualité directement auprès de fournisseurs chinois.",
      seoKeywords: "à propos, notre histoire, approvisionnement depuis la chine, vente en gros b2b",
    },
    de: {
      title: "Über Uns",
      excerpt: "Unsere Geschichte – Qualitätsware aus China für die Welt.",
      content:
        "<h1>Von China in die Welt</h1><p>Unsere Reise begann in den Fabriken und Werkstätten Chinas – von den Elektronik-Montagelinien in Shenzhen bis zu den Küchengeräteherstellern in Guangzhou. Wir bereisten das Land, um Hersteller zu finden, die einen Standard teilen: Qualität, der man vertrauen kann.</p><p>Wir glauben, dass gutes Einkaufen einfacher ist, wenn gute Produkte direkt vom Hersteller zum Käufer gelangen. Deshalb übernehmen wir Beschaffung, Qualitätskontrolle und Versand selbst – für zuverlässigen fabrikdirekten Wert.</p>",
      seoTitle: "Über Uns",
      seoDescription: "Erfahren Sie, wie Commodities From China Qualitätselektronik, Küchenutensilien und Alltagsartikel direkt von chinesischen Lieferanten bezieht.",
      seoKeywords: "über uns, unsere geschichte, beschaffung aus china, b2b großhandel",
    },
    ru: {
      title: "О нас",
      excerpt: "Наша история — качественные товары из Китая для всего мира.",
      content:
        "<h1>Из Китая — всему миру</h1><p>Наш путь начался на заводах и в мастерских Китая — от сборочных линий электроники в Шэньчжэне до производителей кухонной утвари в Гуанчжоу. Мы объехали страну в поисках производителей, разделяющих один стандарт: качество, которому можно доверять.</p><p>Мы верим, что выгодные покупки становятся проще, когда хорошие товары идут напрямую от производителя к покупателю. Поэтому мы сами занимаемся закупками, контролем качества и доставкой — и вы всегда получаете ценность напрямую с фабрики.</p>",
      seoTitle: "О нас",
      seoDescription: "Узнайте, как Commodities From China поставляет качественную электронику, кухонную утварь и товары повседневного спроса напрямую от китайских поставщиков.",
      seoKeywords: "о нас, наша история, поставки из китая, оптовая торговля b2b",
    },
    ar: {
      title: "من نحن",
      excerpt: "قصتنا — جلب بضائع عالية الجودة من الصين إلى العالم.",
      content:
        "<h1>من الصين إلى العالم</h1><p>بدأت رحلتنا في مصانع الصين وورشها — من خطوط تجميع الإلكترونيات في شنتشن إلى مصنعي أدوات المطبخ في قوانغتشو. جُبنا البلاد بحثًا عن صُنّاع يلتزمون بمعيار واحد: جودة تثق بها.</p><p>نؤمن أن الشراء الجيد يصبح أسهل عندما تنتقل المنتجات الجيدة مباشرة من الصانع إلى المشتري. ولهذا نتولى بأنفسنا التوريد ومراقبة الجودة والشحن — لتحصل دائمًا على قيمة مباشرة من المصنع.</p>",
      seoTitle: "من نحن",
      seoDescription: "اكتشف كيف تورّد Commodities From China الإلكترونيات وأدوات المطبخ والسلع اليومية عالية الجودة مباشرة من موردين صينيين.",
      seoKeywords: "من نحن, قصتنا, التوريد من الصين, بيع الجملة b2b",
    },
    id: {
      title: "Tentang Kami",
      excerpt: "Kisah kami — barang berkualitas dari China untuk dunia.",
      content:
        "<h1>Dari China ke Dunia</h1><p>Perjalanan kami dimulai di pabrik dan bengkel China, dari lini perakitan elektronik di Shenzhen hingga produsen peralatan dapur di Guangzhou. Kami menjelajahi negeri ini untuk menemukan produsen yang berbagi satu standar: kualitas yang bisa dipercaya.</p><p>Kami percaya bahwa berbelanja dengan baik lebih mudah ketika produk bagus berpindah langsung dari produsen ke pembeli. Itulah mengapa kami menangani sendiri pengadaan, kontrol kualitas, dan pengiriman — sehingga Anda selalu mendapatkan nilai langsung dari pabrik.</p>",
      seoTitle: "Tentang Kami",
      seoDescription: "Temukan cara Commodities From China mendapat elektronik, peralatan dapur, dan kebutuhan sehari-hari berkualitas langsung dari pemasok China.",
      seoKeywords: "tentang kami, kisah kami, pengadaan dari china, grosir b2b",
    },
    vi: {
      title: "Về Chúng Tôi",
      excerpt: "Câu chuyện của chúng tôi — hàng chất lượng từ Trung Quốc ra thế giới.",
      content:
        "<h1>Từ Trung Quốc Ra Thế Giới</h1><p>Hành trình của chúng tôi bắt đầu tại các nhà máy và xưởng sản xuất của Trung Quốc — từ dây chuyền lắp ráp điện tử ở Thâm Quyến đến nhà sản xuất dụng cụ nhà bếp ở Quảng Châu. Chúng tôi đi khắp đất nước để tìm những nhà sản xuất chia sẻ một tiêu chuẩn: chất lượng bạn có thể tin cậy.</p><p>Chúng tôi tin rằng mua sắm tốt sẽ đơn giản hơn khi sản phẩm tốt được chuyển trực tiếp từ nhà sản xuất đến người mua. Vì vậy chúng tôi tự đảm nhận khâu tìm nguồn, kiểm soát chất lượng và vận chuyển — để bạn luôn nhận được giá trị trực tiếp từ nhà máy.</p>",
      seoTitle: "Về Chúng Tôi",
      seoDescription: "Khám phá cách Commodities From China mua điện tử, dụng cụ nhà bếp và hàng tiêu dùng chất lượng trực tiếp từ nhà cung cấp Trung Quốc.",
      seoKeywords: "về chúng tôi, câu chuyện của chúng tôi, nguồn hàng từ trung quốc, bán buôn b2b",
    },
    th: {
      title: "เกี่ยวกับเรา",
      excerpt: "เรื่องราวของเรา — สินค้าคุณภาพจากจีนสู่ทั่วโลก",
      content:
        "<h1>จากจีนสู่ทั่วโลก</h1><p>การเดินทางของเราเริ่มต้นจากโรงงานและเวิร์กช็อปในจีน ตั้งแต่สายการประกอบอิเล็กทรอนิกส์ในเซินเจิ้น ไปจนถึงผู้ผลิตเครื่องครัวในกว่างโจว เราเดินทางทั่วประเทศเพื่อค้นหาผู้ผลิตที่ยึดมาตรฐานเดียว นั่นคือคุณภาพที่คุณวางใจได้</p><p>เราเชื่อว่าการซื้อที่ดีจะง่ายขึ้นเมื่อสินค้าดีย้ายจากผู้ผลิตตรงสู่ผู้ซื้อ นั่นคือเหตุผลที่เราจัดการด้านการจัดหา การควบคุมคุณภาพ และการจัดส่งด้วยตัวเอง เพื่อให้คุณได้รับคุณค่าจากโรงงานโดยตรงทุกครั้ง</p>",
      seoTitle: "เกี่ยวกับเรา",
      seoDescription: "ค้นพบวิธีการที่ Commodities From China จัดหาอิเล็กทรอนิกส์ เครื่องครัว และสินค้าอุปโภคบริโภคคุณภาพโดยตรงจากซัพพลายเออร์จีน",
      seoKeywords: "เกี่ยวกับเรา, เรื่องราวของเรา, การจัดหาจากจีน, ค้าส่ง b2b",
    },
    ms: {
      title: "Tentang Kami",
      excerpt: "Kisah kami — barangan berkualiti dari China untuk dunia.",
      content:
        "<h1>Dari China ke Seluruh Dunia</h1><p>Perjalanan kami bermula di kilang dan bengkel China — daripada barisan pemasangan elektronik di Shenzhen kepada pengeluar peralatan dapur di Guangzhou. Kami menjelajah negara ini mencari pengeluar yang berkongsi satu standard: kualiti yang boleh anda percayai.</p><p>Kami percaya bahawa pembelian yang baik lebih mudah apabila produk yang baik bergerak terus daripada pengeluar kepada pembeli. Itulah sebabnya kami menguruskan sendiri sumber, kawalan kualiti dan penghantaran — supaya anda sentiasa mendapat nilai terus dari kilang.</p>",
      seoTitle: "Tentang Kami",
      seoDescription: "Ketahui cara Commodities From China mendapatkan elektronik, peralatan dapur dan barangan harian berkualiti terus daripada pembekal China.",
      seoKeywords: "tentang kami, kisah kami, sumber dari china, borong b2b",
    },
  },
  contact: {
    zh: {
      title: "联系我们",
      excerpt: "联系我们——我们会在24小时内回复。",
      content:
        "<h1>联系我们</h1><p>无论您是零售购物还是需要批发报价，我们都乐意倾听。给我们发送消息，我们会在24小时内回复。</p><p>邮箱：info@commoditychina.com</p>",
      seoTitle: "联系我们",
      seoDescription: "联系我们的客服团队，咨询订单、产品及各类问题。",
      seoKeywords: "联系, 支持, 客服",
    },
    es: {
      title: "Contáctenos",
      excerpt: "Póngase en contacto — respondemos en un plazo de 24 horas.",
      content:
        "<h1>Contáctenos</h1><p>Nos encantaría saber de usted, ya sea que compre al por menor o necesite una cotización al por mayor. Envíenos un mensaje y le responderemos en un plazo de 24 horas.</p><p>Correo electrónico: info@commoditychina.com</p>",
      seoTitle: "Contáctenos",
      seoDescription: "Contacte a nuestro equipo de soporte para pedidos, productos y consultas generales.",
      seoKeywords: "contacto, soporte",
    },
    pt: {
      title: "Fale Conosco",
      excerpt: "Entre em contato — respondemos em até 24 horas.",
      content:
        "<h1>Fale Conosco</h1><p>Adoraríamos ouvi-lo, seja comprando no varejo ou precisando de um orçamento no atacado. Envie-nos uma mensagem e responderemos em até 24 horas.</p><p>E-mail: info@commoditychina.com</p>",
      seoTitle: "Fale Conosco",
      seoDescription: "Entre em contato com nossa equipe de suporte para pedidos, produtos e dúvidas gerais.",
      seoKeywords: "contato, suporte",
    },
    fr: {
      title: "Contactez-nous",
      excerpt: "Contactez-nous — nous répondons sous 24 heures.",
      content:
        "<h1>Contactez-nous</h1><p>Nous serions ravis de vous lire, que vous achetiez au détail ou que vous ayez besoin d'un devis en gros. Envoyez-nous un message et nous vous répondrons sous 24 heures.</p><p>E-mail : info@commoditychina.com</p>",
      seoTitle: "Contactez-nous",
      seoDescription: "Contactez notre équipe d'assistance pour vos commandes, produits et demandes générales.",
      seoKeywords: "contact, assistance",
    },
    de: {
      title: "Kontakt",
      excerpt: "Nehmen Sie Kontakt auf — wir antworten innerhalb von 24 Stunden.",
      content:
        "<h1>Kontakt</h1><p>Wir würden gerne von Ihnen hören — ob Sie im Einzelhandel einkaufen oder ein Großhandelsangebot benötigen. Senden Sie uns eine Nachricht und wir antworten innerhalb von 24 Stunden.</p><p>E-Mail: info@commoditychina.com</p>",
      seoTitle: "Kontakt",
      seoDescription: "Kontaktieren Sie unser Support-Team für Bestellungen, Produkte und allgemeine Anfragen.",
      seoKeywords: "kontakt, support",
    },
    ru: {
      title: "Свяжитесь с нами",
      excerpt: "Обратитесь к нам — мы отвечаем в течение 24 часов.",
      content:
        "<h1>Свяжитесь с нами</h1><p>Мы будем рады услышать вас — покупаете ли вы в розницу или вам нужен оптовый расчёт. Отправьте нам сообщение, и мы ответим в течение 24 часов.</p><p>Эл. почта: info@commoditychina.com</p>",
      seoTitle: "Свяжитесь с нами",
      seoDescription: "Свяжитесь с нашей службой поддержки по вопросам заказов, товаров и общим запросам.",
      seoKeywords: "контакты, поддержка",
    },
    ar: {
      title: "اتصل بنا",
      excerpt: "تواصل معنا — نرد خلال 24 ساعة.",
      content:
        "<h1>اتصل بنا</h1><p>يسعدنا أن نسمع منك — سواء كنت تتسوق بالتجزئة أو تحتاج إلى عرض أسعار بالجملة. أرسل لنا رسالة وسنرد خلال 24 ساعة.</p><p>البريد الإلكتروني: info@commoditychina.com</p>",
      seoTitle: "اتصل بنا",
      seoDescription: "تواصل مع فريق الدعم لدينا للطلبات والمنتجات والاستفسارات العامة.",
      seoKeywords: "اتصال, دعم",
    },
    id: {
      title: "Hubungi Kami",
      excerpt: "Hubungi kami — kami merespons dalam 24 jam.",
      content:
        "<h1>Hubungi Kami</h1><p>Kami senang mendengar dari Anda, baik Anda berbelanja eceran atau membutuhkan penawaran grosir. Kirim pesan kepada kami dan kami akan merespons dalam waktu 24 jam.</p><p>Email: info@commoditychina.com</p>",
      seoTitle: "Hubungi Kami",
      seoDescription: "Hubungi tim dukungan kami untuk pesanan, produk, dan pertanyaan umum.",
      seoKeywords: "hubungi, dukungan",
    },
    vi: {
      title: "Liên Hệ Chúng Tôi",
      excerpt: "Liên hệ với chúng tôi — chúng tôi phản hồi trong vòng 24 giờ.",
      content:
        "<h1>Liên Hệ Chúng Tôi</h1><p>Chúng tôi rất muốn được lắng nghe bạn — dù bạn mua lẻ hay cần báo giá bán buôn. Gửi tin nhắn cho chúng tôi và chúng tôi sẽ phản hồi trong vòng 24 giờ.</p><p>Email: info@commoditychina.com</p>",
      seoTitle: "Liên Hệ Chúng Tôi",
      seoDescription: "Liên hệ đội ngũ hỗ trợ của chúng tôi để được tư vấn về đơn hàng, sản phẩm và các câu hỏi chung.",
      seoKeywords: "liên hệ, hỗ trợ",
    },
    th: {
      title: "ติดต่อเรา",
      excerpt: "ติดต่อเรา — เราตอบกลับภายใน 24 ชั่วโมง",
      content:
        "<h1>ติดต่อเรา</h1><p>เรายินดีเป็นอย่างยิ่งที่ได้ยินจากคุณ ไม่ว่าคุณจะซื้อขายปลีกหรือต้องการใบเสนอราคาส่ง ส่งข้อความถึงเรา แล้วเราจะตอบกลับภายใน 24 ชั่วโมง</p><p>อีเมล: info@commoditychina.com</p>",
      seoTitle: "ติดต่อเรา",
      seoDescription: "ติดต่อทีมสนับสนุนของเราเกี่ยวกับคำสั่งซื้อ สินค้า และคำถามทั่วไป",
      seoKeywords: "ติดต่อ, การสนับสนุน",
    },
    ms: {
      title: "Hubungi Kami",
      excerpt: "Hubungi kami — kami membalas dalam masa 24 jam.",
      content:
        "<h1>Hubungi Kami</h1><p>Kami amat berbesar hati mendengar daripada anda — sama ada membeli secara runcit atau memerlukan sebut harga borong. Hantar mesej kepada kami dan kami akan membalas dalam masa 24 jam.</p><p>E-mel: info@commoditychina.com</p>",
      seoTitle: "Hubungi Kami",
      seoDescription: "Hubungi pasukan sokongan kami untuk tempahan, produk dan pertanyaan umum.",
      seoKeywords: "hubungi, sokongan",
    },
  },
  shipping: {
    zh: {
      title: "运费与退换货",
      excerpt: "运费、配送时间与退换货政策。",
      content:
        "<h1>运费与退换货</h1><h2>配送</h2><p>我们提供全球配送，所有订单均可追踪。标准配送（5-8个工作日）：$5.99。快递配送（2-3个工作日）：$15.99。订单满$100免标准运费。</p><h2>退换货</h2><p>自收货之日起30天内可退换。商品必须未使用且保持原包装。退款在5-7个工作日内处理。</p>",
      seoTitle: "运费与退换货",
      seoDescription: "了解我们的配送政策、送达时间及退换货流程。",
      seoKeywords: "运费, 退换货, 配送",
    },
    es: {
      title: "Envíos y Devoluciones",
      excerpt: "Tarifas de envío, plazos de entrega y política de devoluciones.",
      content:
        "<h1>Envíos y Devoluciones</h1><h2>Envíos</h2><p>Ofrecemos envíos a todo el mundo con seguimiento para todos los pedidos. Estándar (5-8 días hábiles): $5.99. Express (2-3 días hábiles): $15.99. Envío estándar gratuito en pedidos superiores a $100.</p><h2>Devoluciones</h2><p>Puede devolver dentro de los 30 días posteriores a la fecha de entrega. Los productos deben estar sin usar y en su empaque original. Los reembolsos se procesan en un plazo de 5 a 7 días hábiles.</p>",
      seoTitle: "Envíos y Devoluciones",
      seoDescription: "Conozca nuestras políticas de envío, plazos de entrega y proceso de devolución.",
      seoKeywords: "envíos, devoluciones, entrega",
    },
    pt: {
      title: "Envio e Devoluções",
      excerpt: "Tarifas de envio, prazos de entrega e política de devolução.",
      content:
        "<h1>Envio e Devoluções</h1><h2>Envio</h2><p>Oferecemos envio para todo o mundo com rastreamento em todos os pedidos. Padrão (5-8 dias úteis): $5.99. Expresso (2-3 dias úteis): $15.99. Envio padrão grátis em pedidos acima de $100.</p><h2>Devoluções</h2><p>Devoluções em até 30 dias da data de entrega. Os produtos devem estar sem uso e na embalagem original. Os reembolsos são processados em até 5-7 dias úteis.</p>",
      seoTitle: "Envio e Devoluções",
      seoDescription: "Conheça nossas políticas de envio, prazos de entrega e processo de devolução.",
      seoKeywords: "envio, devoluções, entrega",
    },
    fr: {
      title: "Livraison et Retours",
      excerpt: "Tarifs de livraison, délais et politique de retour.",
      content:
        "<h1>Livraison et Retours</h1><h2>Livraison</h2><p>Nous proposons une livraison dans le monde entier avec suivi pour toutes les commandes. Standard (5 à 8 jours ouvrés) : 5,99 $US. Express (2 à 3 jours ouvrés) : 15,99 $US. Livraison standard gratuite pour les commandes de plus de 100 $US.</p><h2>Retours</h2><p>Retour possible sous 30 jours à compter de la date de livraison. Les produits doivent être inutilisés et dans leur emballage d'origine. Les remboursements sont traités sous 5 à 7 jours ouvrés.</p>",
      seoTitle: "Livraison et Retours",
      seoDescription: "Découvrez nos politiques de livraison, nos délais et notre processus de retour.",
      seoKeywords: "livraison, retours",
    },
    de: {
      title: "Versand & Rückgabe",
      excerpt: "Versandkosten, Lieferzeiten und Rückgabepolitik.",
      content:
        "<h1>Versand & Rückgabe</h1><h2>Versand</h2><p>Wir liefern weltweit mit Sendungsverfolgung für alle Bestellungen. Standard (5–8 Werktage): 5,99 $US. Express (2–3 Werktage): 15,99 $US. Kostenloser Standardversand ab 100 $US Bestellwert.</p><h2>Rückgabe</h2><p>Rückgabe bis 30 Tage nach Zustelldatum. Produkte müssen unbenutzt und in der Originalverpackung sein. Rückerstattungen werden innerhalb von 5–7 Werktagen bearbeitet.</p>",
      seoTitle: "Versand & Rückgabe",
      seoDescription: "Erfahren Sie mehr über unsere Versandrichtlinien, Lieferzeiten und den Rückgabeprozess.",
      seoKeywords: "versand, rückgabe, lieferung",
    },
    ru: {
      title: "Доставка и возврат",
      excerpt: "Стоимость доставки, сроки и политика возврата.",
      content:
        "<h1>Доставка и возврат</h1><h2>Доставка</h2><p>Мы обеспечиваем доставку по всему миру с отслеживанием всех заказов. Стандартная (5–8 рабочих дней): $5.99. Экспресс (2–3 рабочих дня): $15.99. Бесплатная стандартная доставка при заказе от $100.</p><h2>Возврат</h2><p>Возврат в течение 30 дней с даты получения. Товары должны быть неиспользованными и в оригинальной упаковке. Возврат средств обрабатывается в течение 5–7 рабочих дней.</p>",
      seoTitle: "Доставка и возврат",
      seoDescription: "Узнайте о наших правилах доставки, сроках и процессе возврата.",
      seoKeywords: "доставка, возврат",
    },
    ar: {
      title: "الشحن والإرجاع",
      excerpt: "رسوم الشحن وأوقات التسليم وسياسة الإرجاع.",
      content:
        "<h1>الشحن والإرجاع</h1><h2>الشحن</h2><p>نوفر شحنًا عالميًا مع تتبع لجميع الطلبات. الشحن القياسي (5-8 أيام عمل): 5.99 دولار. الشحن السريع (2-3 أيام عمل): 15.99 دولار. شحن قياسي مجاني للطلبات التي تزيد عن 100 دولار.</p><h2>الإرجاع</h2><p>يمكن الإرجاع خلال 30 يومًا من تاريخ التسليم. يجب أن تكون المنتجات غير مستخدمة وفي العبوة الأصلية. تتم معالجة المبالغ المستردة خلال 5-7 أيام عمل.</p>",
      seoTitle: "الشحن والإرجاع",
      seoDescription: "تعرف على سياسات الشحن وأوقات التسليم وعملية الإرجاع لدينا.",
      seoKeywords: "الشحن, الإرجاع, التسليم",
    },
    id: {
      title: "Pengiriman & Pengembalian",
      excerpt: "Biaya pengiriman, waktu pengiriman, dan kebijakan pengembalian.",
      content:
        "<h1>Pengiriman & Pengembalian</h1><h2>Pengiriman</h2><p>Kami menawarkan pengiriman ke seluruh dunia dengan pelacakan untuk semua pesanan. Standar (5-8 hari kerja): $5.99. Ekspres (2-3 hari kerja): $15.99. Gratis ongkir standar untuk pesanan di atas $100.</p><h2>Pengembalian</h2><p>Jendela pengembalian 30 hari sejak tanggal pengiriman. Produk harus belum dipakai dan dalam kemasan asli. Pengembalian dana diproses dalam waktu 5-7 hari kerja.</p>",
      seoTitle: "Pengiriman & Pengembalian",
      seoDescription: "Pelajari kebijakan pengiriman, waktu pengiriman, dan proses pengembalian kami.",
      seoKeywords: "pengiriman, pengembalian",
    },
    vi: {
      title: "Vận Chuyển & Đổi Trả",
      excerpt: "Phí vận chuyển, thời gian giao hàng và chính sách đổi trả.",
      content:
        "<h1>Vận Chuyển & Đổi Trả</h1><h2>Vận chuyển</h2><p>Chúng tôi giao hàng toàn cầu với mã theo dõi cho tất cả đơn hàng. Tiêu chuẩn (5-8 ngày làm việc): $5.99. Hỏa tốc (2-3 ngày làm việc): $15.99. Miễn phí vận chuyển tiêu chuẩn cho đơn hàng trên $100.</p><h2>Đổi trả</h2><p>Được đổi trả trong vòng 30 ngày kể từ ngày giao hàng. Sản phẩm phải chưa sử dụng và còn nguyên bao bì. Hoàn tiền được xử lý trong vòng 5-7 ngày làm việc.</p>",
      seoTitle: "Vận Chuyển & Đổi Trả",
      seoDescription: "Tìm hiểu chính sách vận chuyển, thời gian giao hàng và quy trình đổi trả của chúng tôi.",
      seoKeywords: "vận chuyển, đổi trả",
    },
    th: {
      title: "การจัดส่งและการคืนสินค้า",
      excerpt: "ค่าจัดส่ง ระยะเวลาในการจัดส่ง และนโยบายการคืนสินค้า",
      content:
        "<h1>การจัดส่งและการคืนสินค้า</h1><h2>การจัดส่ง</h2><p>เราจัดส่งทั่วโลกพร้อมติดตามสถานะคำสั่งซื้อทั้งหมด ส่งมาตรฐาน (5-8 วันทำการ): 5.99 ดอลลาร์ ส่งด่วน (2-3 วันทำการ): 15.99 ดอลลาร์ ส่งมาตรฐานฟรีสำหรับคำสั่งซื้อเกิน 100 ดอลลาร์</p><h2>การคืนสินค้า</h2><p>สามารถคืนสินค้าได้ภายใน 30 วันนับจากวันจัดส่ง สินค้าต้องอยู่ในสภาพไม่ใช้แล้วและอยู่ในบรรจุภัณฑ์เดิม เงินคืนจะดำเนินการภายใน 5-7 วันทำการ</p>",
      seoTitle: "การจัดส่งและการคืนสินค้า",
      seoDescription: "เรียนรู้เกี่ยวกับนโยบายการจัดส่ง ระยะเวลาในการจัดส่ง และขั้นตอนการคืนสินค้า",
      seoKeywords: "การจัดส่ง, การคืนสินค้า",
    },
    ms: {
      title: "Penghantaran & Pulangan",
      excerpt: "Kos penghantaran, masa penghantaran dan polisi pemulangan.",
      content:
        "<h1>Penghantaran & Pulangan</h1><h2>Penghantaran</h2><p>Kami menawarkan penghantaran seluruh dunia dengan penjejakan untuk semua pesanan. Standard (5-8 hari bekerja): $5.99. Ekspres (2-3 hari bekerja): $15.99. Percuma penghantaran standard untuk pesanan melebihi $100.</p><h2>Pulangan</h2><p>Tetingkap pulangan 30 hari dari tarikh penghantaran. Produk mesti tidak digunakan dan dalam pembungkusan asal. Bayaran balik diproses dalam 5-7 hari bekerja.</p>",
      seoTitle: "Penghantaran & Pulangan",
      seoDescription: "Ketahui polisi penghantaran, masa penghantaran dan proses pemulangan kami.",
      seoKeywords: "penghantaran, pulangan",
    },
  },
  privacy: {
    zh: {
      title: "隐私政策",
      excerpt: "我们如何收集、使用和保护您的信息。",
      content:
        "<h1>隐私政策</h1><p>我们尊重您的隐私并保护您的个人信息。您提供的信息仅用于处理订单、提供支持和完善我们的服务。</p>",
      seoTitle: "隐私政策",
      seoDescription: "我们的隐私政策以及我们如何保护您的数据。",
      seoKeywords: "隐私, 政策",
    },
    es: {
      title: "Política de Privacidad",
      excerpt: "Cómo recopilamos, usamos y protegemos su información.",
      content:
        "<h1>Política de Privacidad</h1><p>Respetamos su privacidad y protegemos su información personal. La información que nos proporciona se utiliza únicamente para procesar pedidos, brindar soporte y mejorar nuestros servicios.</p>",
      seoTitle: "Política de Privacidad",
      seoDescription: "Nuestra política de privacidad y cómo protegemos sus datos.",
      seoKeywords: "privacidad, política",
    },
    pt: {
      title: "Política de Privacidade",
      excerpt: "Como coletamos, usamos e protegemos suas informações.",
      content:
        "<h1>Política de Privacidade</h1><p>Respeitamos sua privacidade e protegemos suas informações pessoais. As informações fornecidas são usadas apenas para processar pedidos, fornecer suporte e melhorar nossos serviços.</p>",
      seoTitle: "Política de Privacidade",
      seoDescription: "Nossa política de privacidade e como protegemos seus dados.",
      seoKeywords: "privacidade, política",
    },
    fr: {
      title: "Politique de Confidentialité",
      excerpt: "Comment nous collectons, utilisons et protégeons vos informations.",
      content:
        "<h1>Politique de Confidentialité</h1><p>Nous respectons votre vie privée et protégeons vos informations personnelles. Les informations que vous fournissez ne servent qu'au traitement des commandes, à l'assistance et à l'amélioration de nos services.</p>",
      seoTitle: "Politique de Confidentialité",
      seoDescription: "Notre politique de confidentialité et la protection de vos données.",
      seoKeywords: "confidentialité, politique",
    },
    de: {
      title: "Datenschutzrichtlinie",
      excerpt: "Wie wir Ihre Informationen erfassen, verwenden und schützen.",
      content:
        "<h1>Datenschutzrichtlinie</h1><p>Wir respektieren Ihre Privatsphäre und schützen Ihre persönlichen Daten. Die von Ihnen bereitgestellten Informationen werden ausschließlich zur Bearbeitung von Bestellungen, zur Unterstützung und zur Verbesserung unserer Dienste verwendet.</p>",
      seoTitle: "Datenschutzrichtlinie",
      seoDescription: "Unsere Datenschutzrichtlinie und wie wir Ihre Daten schützen.",
      seoKeywords: "datenschutz, richtlinie",
    },
    ru: {
      title: "Политика конфиденциальности",
      excerpt: "Как мы собираем, используем и защищаем вашу информацию.",
      content:
        "<h1>Политика конфиденциальности</h1><p>Мы уважаем вашу конфиденциальность и защищаем ваши персональные данные. Предоставленная вами информация используется только для обработки заказов, оказания поддержки и улучшения наших услуг.</p>",
      seoTitle: "Политика конфиденциальности",
      seoDescription: "Наша политика конфиденциальности и способы защиты ваших данных.",
      seoKeywords: "конфиденциальность, политика",
    },
    ar: {
      title: "سياسة الخصوصية",
      excerpt: "كيفية جمع معلوماتك واستخدامها وحمايتها.",
      content:
        "<h1>سياسة الخصوصية</h1><p>نحترم خصوصيتك ونحمي معلوماتك الشخصية. تُستخدم المعلومات التي تقدمها فقط لمعالجة الطلبات وتقديم الدعم وتحسين خدماتنا.</p>",
      seoTitle: "سياسة الخصوصية",
      seoDescription: "سياسة الخصوصية الخاصة بنا وكيفية حماية بياناتك.",
      seoKeywords: "خصوصية, سياسة",
    },
    id: {
      title: "Kebijakan Privasi",
      excerpt: "Cara kami mengumpulkan, menggunakan, dan melindungi informasi Anda.",
      content:
        "<h1>Kebijakan Privasi</h1><p>Kami menghormati privasi Anda dan melindungi informasi pribadi Anda. Informasi yang Anda berikan hanya digunakan untuk memproses pesanan, memberikan dukungan, dan meningkatkan layanan kami.</p>",
      seoTitle: "Kebijakan Privasi",
      seoDescription: "Kebijakan privasi kami dan cara kami melindungi data Anda.",
      seoKeywords: "privasi, kebijakan",
    },
    vi: {
      title: "Chính Sách Bảo Mật",
      excerpt: "Cách chúng tôi thu thập, sử dụng và bảo vệ thông tin của bạn.",
      content:
        "<h1>Chính Sách Bảo Mật</h1><p>Chúng tôi tôn trọng quyền riêng tư và bảo vệ thông tin cá nhân của bạn. Thông tin bạn cung cấp chỉ được dùng để xử lý đơn hàng, hỗ trợ và cải thiện dịch vụ.</p>",
      seoTitle: "Chính Sách Bảo Mật",
      seoDescription: "Chính sách bảo mật của chúng tôi và cách chúng tôi bảo vệ dữ liệu của bạn.",
      seoKeywords: "bảo mật, chính sách",
    },
    th: {
      title: "นโยบายความเป็นส่วนตัว",
      excerpt: "วิธีการที่เรารวบรวม ใช้ และปกป้องข้อมูลของคุณ",
      content:
        "<h1>นโยบายความเป็นส่วนตัว</h1><p>เราเคารพความเป็นส่วนตัวของคุณและปกป้องข้อมูลส่วนบุคคลของคุณ ข้อมูลที่คุณให้ไว้จะถูกใช้เพื่อประมวลผลคำสั่งซื้อ ให้การสนับสนุน และปรับปรุงบริการของเรเท่านั้น</p>",
      seoTitle: "นโยบายความเป็นส่วนตัว",
      seoDescription: "นโยบายความเป็นส่วนตัวของเราและวิธีที่เราปกป้องข้อมูลของคุณ",
      seoKeywords: "ความเป็นส่วนตัว, นโยบาย",
    },
    ms: {
      title: "Dasar Privasi",
      excerpt: "Cara kami mengumpul, menggunakan dan melindungi maklumat anda.",
      content:
        "<h1>Dasar Privasi</h1><p>Kami menghormati privasi anda dan melindungi maklumat peribadi anda. Maklumat yang anda berikan hanya digunakan untuk memproses pesanan, memberikan sokongan dan menambah baik perkhidmatan kami.</p>",
      seoTitle: "Dasar Privasi",
      seoDescription: "Dasar privasi kami dan cara kami melindungi data anda.",
      seoKeywords: "privasi, dasar",
    },
  },
  terms: {
    zh: {
      title: "服务条款",
      excerpt: "使用我们服务的条款与条件。",
      content:
        "<h1>服务条款</h1><p>访问和使用本网站即表示您同意这些条款。本网站所有内容（包括图片、文字和设计）均为本公司财产，未经许可不得复制。</p>",
      seoTitle: "服务条款",
      seoDescription: "使用我们服务的条款与条件。",
      seoKeywords: "条款, 条件",
    },
    es: {
      title: "Términos de Servicio",
      excerpt: "Términos y condiciones para el uso de nuestros servicios.",
      content:
        "<h1>Términos de Servicio</h1><p>Al acceder y utilizar este sitio web, usted acepta estos términos. Todo el contenido de este sitio web, incluidas imágenes, texto y diseños, es propiedad de la empresa y no puede reproducirse sin permiso.</p>",
      seoTitle: "Términos de Servicio",
      seoDescription: "Términos y condiciones para el uso de nuestros servicios.",
      seoKeywords: "términos, condiciones",
    },
    pt: {
      title: "Termos de Serviço",
      excerpt: "Termos e condições para o uso de nossos serviços.",
      content:
        "<h1>Termos de Serviço</h1><p>Ao acessar e usar este site, você concorda com estes termos. Todo o conteúdo deste site, incluindo imagens, texto e designs, é propriedade da empresa e não pode ser reproduzido sem permissão.</p>",
      seoTitle: "Termos de Serviço",
      seoDescription: "Termos e condições para o uso de nossos serviços.",
      seoKeywords: "termos, condições",
    },
    fr: {
      title: "Conditions d'utilisation",
      excerpt: "Termes et conditions d'utilisation de nos services.",
      content:
        "<h1>Conditions d'utilisation</h1><p>En accédant à ce site et en l'utilisant, vous acceptez ces conditions. Tout le contenu de ce site, y compris les images, le texte et les designs, est la propriété de l'entreprise et ne peut être reproduit sans autorisation.</p>",
      seoTitle: "Conditions d'utilisation",
      seoDescription: "Termes et conditions d'utilisation de nos services.",
      seoKeywords: "conditions, termes",
    },
    de: {
      title: "Nutzungsbedingungen",
      excerpt: "Bedingungen für die Nutzung unserer Dienste.",
      content:
        "<h1>Nutzungsbedingungen</h1><p>Mit dem Zugriff auf diese Website und deren Nutzung stimmen Sie diesen Bedingungen zu. Alle Inhalte dieser Website, einschließlich Bildern, Text und Designs, sind Eigentum des Unternehmens und dürfen ohne Genehmigung nicht reproduziert werden.</p>",
      seoTitle: "Nutzungsbedingungen",
      seoDescription: "Bedingungen für die Nutzung unserer Dienste.",
      seoKeywords: "bedingungen, konditionen",
    },
    ru: {
      title: "Условия использования",
      excerpt: "Условия использования наших услуг.",
      content:
        "<h1>Условия использования</h1><p>Доступ и использование этого сайта означает ваше согласие с данными условиями. Весь контент сайта, включая изображения, текст и дизайн, является собственностью компании и не может быть воспроизведён без разрешения.</p>",
      seoTitle: "Условия использования",
      seoDescription: "Условия использования наших услуг.",
      seoKeywords: "условия, положения",
    },
    ar: {
      title: "شروط الخدمة",
      excerpt: "الشروط والأحكام لاستخدام خدماتنا.",
      content:
        "<h1>شروط الخدمة</h1><p>بدخولك واستخدامك لهذا الموقع فإنك توافق على هذه الشروط. جميع محتويات هذا الموقع، بما في ذلك الصور والنصوص والتصاميم، هي ملك للشركة ولا يجوز إعادة إنتاجها دون إذن.</p>",
      seoTitle: "شروط الخدمة",
      seoDescription: "الشروط والأحكام لاستخدام خدماتنا.",
      seoKeywords: "شروط, أحكام",
    },
    id: {
      title: "Syarat Layanan",
      excerpt: "Syarat dan ketentuan untuk menggunakan layanan kami.",
      content:
        "<h1>Syarat Layanan</h1><p>Dengan mengakses dan menggunakan situs web ini, Anda menyetujui syarat-syarat ini. Semua konten di situs web ini, termasuk gambar, teks, dan desain, adalah milik perusahaan dan tidak boleh direproduksi tanpa izin.</p>",
      seoTitle: "Syarat Layanan",
      seoDescription: "Syarat dan ketentuan untuk menggunakan layanan kami.",
      seoKeywords: "syarat, ketentuan",
    },
    vi: {
      title: "Điều Khoản Dịch Vụ",
      excerpt: "Các điều khoản và điều kiện khi sử dụng dịch vụ của chúng tôi.",
      content:
        "<h1>Điều Khoản Dịch Vụ</h1><p>Khi truy cập và sử dụng trang web này, bạn đồng ý với các điều khoản này. Toàn bộ nội dung trên trang web, bao gồm hình ảnh, văn bản và thiết kế, là tài sản của công ty và không được sao chép khi chưa được phép.</p>",
      seoTitle: "Điều Khoản Dịch Vụ",
      seoDescription: "Các điều khoản và điều kiện khi sử dụng dịch vụ của chúng tôi.",
      seoKeywords: "điều khoản, điều kiện",
    },
    th: {
      title: "ข้อกำหนดการให้บริการ",
      excerpt: "ข้อกำหนดและเงื่อนไขสำหรับการใช้บริการของเรา",
      content:
        "<h1>ข้อกำหนดการให้บริการ</h1><p>การเข้าถึงและใช้เว็บไซต์นี้หมายความว่าคุณยอมรับข้อกำหนดเหล่านี้ เนื้อหาทั้งหมดบนเว็บไซต์นี้ รวมถึงรูปภาพ ข้อความ และการออกแบบ เป็นทรัพย์สินของบริษัทและไม่อนุญาตให้ทำซ้ำโดยไม่ได้รับอนุญาต</p>",
      seoTitle: "ข้อกำหนดการให้บริการ",
      seoDescription: "ข้อกำหนดและเงื่อนไขสำหรับการใช้บริการของเรา",
      seoKeywords: "ข้อกำหนด, เงื่อนไข",
    },
    ms: {
      title: "Terma Perkhidmatan",
      excerpt: "Terma dan syarat untuk menggunakan perkhidmatan kami.",
      content:
        "<h1>Terma Perkhidmatan</h1><p>Dengan mengakses dan menggunakan laman web ini, anda bersetuju dengan terma ini. Semua kandungan di laman web ini, termasuk imej, teks dan reka bentuk, adalah hak milik syarikat dan tidak boleh diterbitkan semula tanpa kebenaran.</p>",
      seoTitle: "Terma Perkhidmatan",
      seoDescription: "Terma dan syarat untuk menggunakan perkhidmatan kami.",
      seoKeywords: "terma, syarat",
    },
  },
}