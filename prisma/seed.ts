import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("Seeding database...")

  // 检查数据库连接和表是否存在
  try {
    await prisma.$queryRaw`SELECT 1`
  } catch {
    console.error("Cannot connect to database. Check DATABASE_URL in .env")
    process.exit(1)
  }

  const adminEmail = "81570423@qq.com"
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } })

  if (existing) {
    console.log("Admin user already exists, skipping...")
  } else {
    const passwordHash = await bcrypt.hash("Admin123!", 12)
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        firstName: "Admin",
        lastName: "Commodities From China",
        role: "ADMIN",
      },
    })
    console.log("Admin user created:")
    console.log("  Email:    81570423@qq.com")
    console.log("  Password: Admin123!")
  }

  const categoryData = [
    { name: "Beauty", slug: "beauty", description: "Peptide skincare and beauty products", type: "BEAUTY", sortOrder: 1, isFeatured: true, seoTitle: "Beauty", seoDescription: "Skincare and beauty products", seoKeywords: "beauty, skincare" },
    { name: "Handmade Living", slug: "handmade-living", description: "Artisanal home objects and decor", type: "HOME", sortOrder: 2, isFeatured: true, seoTitle: "Handmade Living", seoDescription: "Artisanal home objects and decor", seoKeywords: "handmade, home decor" },
  ]

  const categoryIds: Record<string, string> = {}
  for (const cat of categoryData) {
    const existingCat = await prisma.category.findUnique({ where: { slug: cat.slug } })
    if (existingCat) {
      categoryIds[cat.slug] = existingCat.id
    } else {
      const created = await prisma.category.create({ data: cat })
      categoryIds[cat.slug] = created.id
      console.log(`Category created: ${cat.name}`)
    }
  }

  const productData: {
    name: string; slug: string; sku: string; brand: string;
    description: string; shortDescription: string;
    unitPrice: number; originalPrice: number | null;
    stock: number; status: "ACTIVE" | "DRAFT" | "INACTIVE" | "ARCHIVED";
    isFeatured: boolean; isBestSeller: boolean; isNew: boolean;
    categorySlug: string; imageUrl: string;
  }[] = [
    {
      name: "Peptide Hydration Serum",
      slug: "peptide-hydration-serum",
      sku: "OB-001",
      brand: "Commodities From China",
      description: "A lightweight, fast-absorbing serum packed with multi-weight hyaluronic acid and copper peptides to deeply hydrate and support skin barrier repair.",
      shortDescription: "Deep hydration serum with copper peptides and hyaluronic acid",
      unitPrice: 48.00,
      originalPrice: 58.00,
      stock: 150,
      status: "ACTIVE",
      isFeatured: true,
      isBestSeller: true,
      isNew: false,
      categorySlug: "beauty",
      imageUrl: "https://placehold.co/400x400/ivory/charcoal?text=Serum",
    },
    {
      name: "Vitamin C Brightening Cream",
      slug: "vitamin-c-brightening-cream",
      sku: "OB-002",
      brand: "Commodities From China",
      description: "A rich yet silky moisturizer featuring stabilized vitamin C and niacinamide to brighten skin tone, reduce dark spots, and improve overall radiance.",
      shortDescription: "Brightening moisturizer with vitamin C and niacinamide",
      unitPrice: 42.00,
      originalPrice: null,
      stock: 200,
      status: "ACTIVE",
      isFeatured: true,
      isBestSeller: false,
      isNew: false,
      categorySlug: "beauty",
      imageUrl: "https://placehold.co/400x400/ivory/charcoal?text=Cream",
    },
    {
      name: "Retinol Night Oil",
      slug: "retinol-night-oil",
      sku: "OB-003",
      brand: "Commodities From China",
      description: "A gentle yet effective overnight treatment combining encapsulated retinol with squalane and rosehip oil to smooth fine lines and improve skin texture while you sleep.",
      shortDescription: "Overnight retinol treatment with squalane and rosehip oil",
      unitPrice: 52.00,
      originalPrice: 62.00,
      stock: 100,
      status: "ACTIVE",
      isFeatured: false,
      isBestSeller: false,
      isNew: true,
      categorySlug: "beauty",
      imageUrl: "https://placehold.co/400x400/ivory/charcoal?text=Night+Oil",
    },
    {
      name: "Ceramide Barrier Balm",
      slug: "ceramide-barrier-balm",
      sku: "OB-004",
      brand: "Commodities From China",
      description: "An ultra-nourishing balm formulated with ceramides, panthenol, and shea butter to restore and strengthen the skin barrier for compromised or dry skin types.",
      shortDescription: "Nourishing barrier repair balm with ceramides and shea butter",
      unitPrice: 38.00,
      originalPrice: null,
      stock: 80,
      status: "DRAFT",
      isFeatured: false,
      isBestSeller: false,
      isNew: false,
      categorySlug: "beauty",
      imageUrl: "https://placehold.co/400x400/ivory/charcoal?text=Balm",
    },
    {
      name: "Handcrafted Soy Candle - Jasmine",
      slug: "handcrafted-soy-candle-jasmine",
      sku: "OB-101",
      brand: "Commodities From China",
      description: "Hand-poured soy wax candle with natural jasmine essential oil. Burns cleanly for 45+ hours in a hand-thrown ceramic vessel.",
      shortDescription: "Soy wax candle with natural jasmine essential oil",
      unitPrice: 28.00,
      originalPrice: 32.00,
      stock: 60,
      status: "ACTIVE",
      isFeatured: true,
      isBestSeller: false,
      isNew: false,
      categorySlug: "handmade-living",
      imageUrl: "https://placehold.co/400x400/ivory/charcoal?text=Candle",
    },
    {
      name: "Linen Tea Towel Set",
      slug: "linen-tea-towel-set",
      sku: "OB-102",
      brand: "Commodities From China",
      description: "Set of three stonewashed linen tea towels in neutral earth tones. Pre-washed for softness, each measures 18x28 inches.",
      shortDescription: "Set of 3 stonewashed linen tea towels",
      unitPrice: 34.00,
      originalPrice: null,
      stock: 120,
      status: "ACTIVE",
      isFeatured: false,
      isBestSeller: true,
      isNew: false,
      categorySlug: "handmade-living",
      imageUrl: "https://placehold.co/400x400/ivory/charcoal?text=Towel+Set",
    },
  ]

  for (const prod of productData) {
    const existingProduct = await prisma.product.findUnique({ where: { slug: prod.slug } })
    if (existingProduct) {
      console.log(`  Product exists: ${prod.name}`)
      continue
    }

    const { categorySlug, imageUrl, ...productFields } = prod
    const product = await prisma.product.create({
      data: productFields,
    })

    await prisma.productImage.create({
      data: {
        productId: product.id,
        url: imageUrl,
        alt: prod.name,
        sortOrder: 0,
        isPrimary: true,
      },
    })

    await prisma.productCategory.create({
      data: {
        productId: product.id,
        categoryId: categoryIds[categorySlug],
      },
    })

    console.log(`  Product created: ${prod.name}`)
  }

  await seedSiteSettings()

  const defaultMenus = [
    { label: "Home", url: "/", sortOrder: 1 },
    { label: "Products", url: "/products", sortOrder: 2 },
    { label: "Journal", url: "/blog", sortOrder: 3 },
    { label: "About", url: "/pages/about", sortOrder: 4 },
    { label: "Contact", url: "/pages/contact", sortOrder: 5 },
  ]

  for (const menu of defaultMenus) {
    const existingMenu = await prisma.menu.findFirst({ where: { label: menu.label } })
    if (existingMenu) continue
    await prisma.menu.create({ data: menu })
    console.log(`Menu created: ${menu.label}`)
  }

  await seedDefaultPages()
  await seedDefaultBlogPosts()

  console.log("Seeding complete.")
}

async function seedSiteSettings() {
  const settings: Record<string, string> = {
    "site.name": "Commodities From China",
    "site.slogan": "Sourced from China, delivered worldwide",
    "site.description": "Sourced directly from China. Premium peptide skincare, artisanal home decor, and everyday commodities for retail and wholesale B2B buyers worldwide.",
    "site.logo": "",
    "site.favicon": "",
    "site.language": "en",
    "site.currency": "USD",
    "site.promoBar": "New customers save 10%",
    "contact.email": "info@commoditychina.com",
    "contact.phone": "+1-888-555-0100",
    "contact.whatsapp": "",
    "company.name": "Commodities From China Inc.",
    "company.address": "Guangzhou, Guangdong, China",
    "company.brief": "Direct sourcing from trusted Chinese suppliers. Premium peptide skincare, artisanal home decor, and everyday commodities for retail and wholesale buyers.",
    "footer.about": "Sourced directly from China. Premium peptide skincare, artisanal home decor, and everyday commodities for retail and wholesale B2B buyers worldwide.",
    "footer.copyright": "All rights reserved.",
    "social.facebook": "https://www.facebook.com/commoditychina",
    "social.instagram": "https://www.instagram.com/commoditychina",
    "social.linkedin": "",
    "social.youtube": "",
    "social.twitter": "https://twitter.com/commoditychina",
    "seo.homeTitle": "Commodities From China | Wholesale Skincare & Artisanal Home Decor",
    "seo.homeDescription": "Sourced directly from China for retail and wholesale B2B buyers. Premium peptide skincare, natural formulas, and artisanal home decor.",
    "seo.defaultKeywords": "peptide skincare, commodities from china, wholesale skincare, b2b wholesale, handmade ceramics, artisanal home decor",
    "content.featuredEyebrow": "Explore",
    "content.featuredHeading": "Our Collections",
    "content.featuredTagline": "Factory-direct sourcing, quality goods, worldwide delivery",
    "content.brandStory": JSON.stringify({
      eyebrow: "Our Story",
      title: "From China to the World",
      paragraphs: [
        "Commodities From China was founded on a simple belief — that quality goods should move directly from Chinese makers to buyers around the world, without unnecessary layers and markup.",
        "We partner with factories, farmers, and artisans across China who have perfected their craft over generations, from peptide skincare formulated in modern labs to ceramics shaped by hand.",
        "Whether you shop retail or buy wholesale in bulk, we deliver factory-direct quality with reliable global shipping and dedicated support.",
      ],
      ctaLabel: "Read Our Story",
      ctaHref: "/pages/about",
    }),
    "content.promo1": JSON.stringify({
      eyebrow: "The Science of Beauty",
      title: "Peptide Skincare",
      body: "Our peptide formulations combine cutting-edge biotechnology with centuries-old Asian botanical wisdom. Each product is designed to work in harmony with your skin's natural rhythms.",
      features: [
        { title: "Advanced Peptide Technology", description: "Multi-weight peptides that penetrate deeper for visible results" },
        { title: "Botanical Actives", description: "Fermented Asian botanicals — ginseng, green tea, and rice bran" },
        { title: "Minimalist Formulations", description: "Clean, effective ingredients. No parabens, sulfates, or synthetic fragrances" },
        { title: "Sustainable Luxury", description: "Refillable glass vessels and biodegradable packaging" },
      ],
      ctaLabel: "View All Skincare",
      ctaHref: "/categories/beauty",
    }),
    "content.promo2": JSON.stringify({
      eyebrow: "Craftsmanship",
      title: "Handmade Living",
      tagline: "Objects that bring warmth, story, and intention into your home",
      collections: [
        { title: "Ceramics", description: "Hand-thrown pottery from ancient kilns", href: "/categories/handmade-living?sub=ceramics" },
        { title: "Woodcraft", description: "Carved teak and bamboo art pieces", href: "/categories/handmade-living?sub=woodcraft" },
        { title: "Textiles", description: "Handwoven silk and linen home goods", href: "/categories/handmade-living?sub=textiles" },
        { title: "Decor", description: "Curated objects for mindful spaces", href: "/categories/handmade-living?sub=decor" },
      ],
      ctaLabel: "Explore All Collections",
      ctaHref: "/categories/handmade-living",
    }),
    "content.testimonials": JSON.stringify([
      {
        name: "Sarah M.",
        location: "New York",
        rating: 5,
        text: "The peptide serum transformed my skincare routine. My skin has never looked this radiant. It's the perfect balance of science and nature.",
        product: "Peptide Hydration Serum",
      },
      {
        name: "Emily R.",
        location: "Guangzhou",
        rating: 5,
        text: "I purchased a ceramic tea set from the Handmade collection and it's absolutely breathtaking. Each piece tells a story. It has become the centerpiece of my morning ritual.",
        product: "Artisan Tea Collection",
      },
      {
        name: "Jessica K.",
        location: "London",
        rating: 5,
        text: "Finally, a brand that understands true luxury — it's about ingredients that work and objects that matter. The overnight mask is pure magic.",
        product: "Overnight Recovery Mask",
      },
    ]),
    "content.instagram": JSON.stringify({
      handle: "@commoditychina",
      handleUrl: "https://www.instagram.com/commoditychina",
      tagline: "Tag us @commoditychina for a chance to be featured",
      posts: [],
    }),
    "content.faq": JSON.stringify([
      {
        q: "What is peptide skincare?",
        a: "Peptide skincare uses short chains of amino acids that signal your skin to produce collagen and elastin. Our multi-weight peptide formulations penetrate at different depths for comprehensive visible results.",
      },
      {
        q: "Are your products cruelty-free?",
        a: "Yes, all our products are 100% cruelty-free. We never test on animals and partner only with suppliers who share this commitment.",
      },
      {
        q: "How long does shipping take?",
        a: "Standard shipping takes 5-8 business days. Express shipping takes 2-3 business days. Free standard shipping is available on orders over the free-shipping threshold.",
      },
      {
        q: "What is your return policy?",
        a: "We offer a 30-day return window for unused products in original packaging. Free returns on domestic orders. Refunds are processed within 5-7 business days.",
      },
      {
        q: "Do you ship internationally?",
        a: "Yes, we ship worldwide. International orders may be subject to customs duties and taxes, which are the customer's responsibility.",
      },
      {
        q: "Are your products suitable for sensitive skin?",
        a: "Our formulations are designed to be gentle and free from parabens, sulfates, and synthetic fragrances. However, we recommend patch testing before full application.",
      },
    ]),
  }

  for (const [key, value] of Object.entries(settings)) {
    const existing = await prisma.siteSetting.findUnique({ where: { key } })
    if (existing) continue
    await prisma.siteSetting.create({ data: { key, value } })
  }
  console.log("Site settings seeded.")
}

const defaultPages: { title: string; slug: string; excerpt: string; content: string; seoTitle: string; seoDescription: string; seoKeywords: string }[] = [
  {
    title: "About Us",
    slug: "about",
    excerpt: "Our story — sourcing quality goods from China for the world.",
    content: `<h1>From China to the World</h1><p>Our journey began in the factories, farms, and workshops of China — from modern skincare labs in Guangzhou to ceramics studios in Jingdezhen. We traveled the country to find makers who share one standard: quality you can trust.</p><p>We believe that buying well is simpler when good products move directly from maker to buyer. That's why we handle sourcing, quality control, and shipping ourselves — so you get factory-direct value every time.</p>`,
    seoTitle: "About Us",
    seoDescription: "Discover how Commodities From China sources quality skincare, home decor, and everyday goods directly from Chinese suppliers.",
    seoKeywords: "about us, our story, sourcing from china, b2b wholesale",
  },
  {
    title: "Contact Us",
    slug: "contact",
    excerpt: "Get in touch — we respond within 24 hours.",
    content: `<h1>Contact Us</h1><p>We'd love to hear from you — whether you're shopping retail or need a wholesale quote. Send us a message and we'll respond within 24 hours.</p><p>Email: info@commoditychina.com</p>`,
    seoTitle: "Contact Us",
    seoDescription: "Contact our support team for orders, products, and general inquiries.",
    seoKeywords: "contact, support",
  },
  {
    title: "Shipping & Returns",
    slug: "shipping",
    excerpt: "Shipping rates, delivery times, and return policy.",
    content: `<h1>Shipping & Returns</h1><h2>Shipping</h2><p>We offer worldwide shipping with tracking on all orders. Standard (5-8 business days): $5.99. Express (2-3 business days): $15.99. Free standard shipping on orders over $100.</p><h2>Returns</h2><p>30-day return window from delivery date. Products must be unused and in original packaging. Refunds are processed within 5-7 business days.</p>`,
    seoTitle: "Shipping & Returns",
    seoDescription: "Learn about our shipping policies, delivery times, and return process.",
    seoKeywords: "shipping, returns, delivery",
  },
  {
    title: "Privacy Policy",
    slug: "privacy",
    excerpt: "How we collect, use, and protect your information.",
    content: `<h1>Privacy Policy</h1><p>We respect your privacy and protect your personal information. Information you provide is used only to process orders, provide support, and improve our services.</p>`,
    seoTitle: "Privacy Policy",
    seoDescription: "Our privacy policy and how we protect your data.",
    seoKeywords: "privacy, policy",
  },
  {
    title: "Terms of Service",
    slug: "terms",
    excerpt: "Terms and conditions for using our services.",
    content: `<h1>Terms of Service</h1><p>By accessing and using this website, you agree to these terms. All content on this website, including images, text, and designs, is the property of the company and may not be reproduced without permission.</p>`,
    seoTitle: "Terms of Service",
    seoDescription: "Terms and conditions for using our services.",
    seoKeywords: "terms, conditions",
  },
]

async function seedDefaultPages() {
  for (const page of defaultPages) {
    const existing = await prisma.page.findUnique({ where: { slug: page.slug } })
    if (existing) continue
    await prisma.page.create({
      data: { ...page, isPublished: true },
    })
    console.log(`Page created: ${page.slug}`)
  }
}

const defaultBlogPosts: { title: string; slug: string; excerpt: string; content: string; author: string; tags: string; publishedAt: string }[] = [
  {
    title: "The Art of Peptide Layering",
    slug: "art-of-peptide-layering",
    excerpt: "Discover how to build an effective peptide skincare routine with our step-by-step guide.",
    content: `<h1>The Art of Peptide Layering</h1>

<h2>Why Layering Matters</h2>

<p>Layering your skincare correctly can make the difference between radiant, youthful skin and a routine that never reaches its full potential. At Commodities From China, we've perfected a peptide-layering system that maximizes absorption and efficacy.</p>

<h2>The Science of Peptides</h2>

<p>Peptides are short chains of amino acids that act as signaling molecules for your skin. When applied topically, they communicate with your cells to:</p>

<ul>
<li><strong>Boost collagen production</strong></li>
<li><strong>Improve skin elasticity</strong></li>
<li><strong>Reduce fine lines and wrinkles</strong></li>
<li><strong>Strengthen the skin barrier</strong></li>
</ul>

<h2>Our Peptide Layering Method</h2>

<h3>Step 1: Cleanse</h3>
<p>Start with a gentle, pH-balanced cleanser to prepare your skin for maximum peptide absorption.</p>

<h3>Step 2: Peptide Essence</h3>
<p>Apply our <strong>Multi-Peptide Essence</strong> to damp skin. The low molecular weight peptides penetrate deeply to signal collagen production at the cellular level.</p>

<h3>Step 3: Peptide Serum</h3>
<p>Layer our <strong>Peptide Hydration Serum</strong> over the essence. This medium-weight formula delivers peptides to the mid-layers of your skin.</p>

<h3>Step 4: Moisturize</h3>
<p>Seal everything in with our <strong>Peptide Rich Moisturizer</strong>, which supports the skin barrier and locks in hydration.</p>

<blockquote>"The key to peptide layering is going from thinnest to thickest consistency, allowing each layer to absorb before applying the next."</blockquote>

<h2>Pro Tips</h2>

<ul>
<li><strong>Pat, don't rub</strong> — Gentle pressing motions help peptides absorb better</li>
<li><strong>Wait 60 seconds</strong> between each layer for optimal absorption</li>
<li><strong>Use twice daily</strong> for visible results within 4-6 weeks</li>
</ul>`,
    author: "Content Editor",
    tags: "skincare, peptides, routine, anti-aging, collagen",
    publishedAt: "2026-04-15",
  },
  {
    title: "Meet the Artisan: Master Potter Kazuo Tanaka",
    slug: "meet-artisan-kazuo-tanaka",
    excerpt: "A glimpse into the life and craft of a third-generation ceramic master from Kyoto.",
    content: `<h1>Meet the Artisan: Master Potter Kazuo Tanaka</h1>

<h2>A Legacy of Clay</h2>

<p>In the ancient pottery district of Kyoto, surrounded by the scent of wet clay and wood smoke, Master Kazuo Tanaka has been shaping ceramic art for over four decades. His hands — weathered and wise — carry the knowledge of three generations of potters.</p>

<h2>The Kiln That Breathes</h2>

<p>Tanaka-san's workshop centers around a traditional <strong>noborigama</strong> (climbing kiln) that reaches temperatures of 1,300°C. Each firing takes five days and requires constant attention, day and night.</p>

<blockquote>"The kiln is alive. It breathes, it sighs, it tells you when the pieces are ready."</blockquote>

<h2>The Signature Collection</h2>

<p>For our Handmade Living collection, Tanaka-san creates:</p>

<ul>
<li><strong>Tea ceremony bowls</strong> — Each one unique in shape and glaze pattern</li>
<li><strong>Sake vessels</strong> — Thin-walled with a crystalline finish</li>
<li><strong>Serving platters</strong> — Large-format pieces for shared meals</li>
</ul>

<h2>The Philosophy of Wabi-Sabi</h2>

<p>Tanaka-san's work embodies <strong>wabi-sabi</strong> — the Japanese aesthetic of finding beauty in imperfection. No two pieces are identical. The slight asymmetry, the natural drip of glaze, the mark of the potter's finger — these are not flaws, but signatures of authenticity.</p>`,
    author: "Content Editor",
    tags: "artisan, ceramics, japan, wabi-sabi, kyoto",
    publishedAt: "2026-04-10",
  },
  {
    title: "Fermented Beauty: Why East Asian Skincare Works",
    slug: "fermented-beauty",
    excerpt: "The science behind fermentation in skincare and why it delivers visible results.",
    content: `<h1>Fermented Beauty: Why East Asian Skincare Works</h1>

<h2>Ancient Wisdom, Modern Science</h2>

<p>Fermentation has been a cornerstone of East Asian beauty for centuries. From sake washes in Japan to fermented rice water in Korea, this traditional technique is now backed by modern dermatological science.</p>

<h2>Why Fermentation?</h2>

<p>The fermentation process breaks down ingredients into smaller molecules, making them:</p>

<ul>
<li><strong>Easier to absorb</strong> — Smaller particle size penetrates deeper</li>
<li><strong>More potent</strong> — Fermentation releases beneficial metabolites</li>
<li><strong>Gentler on skin</strong> — The process reduces potential irritants</li>
<li><strong>Rich in antioxidants</strong> — Fermented ingredients have higher antioxidant activity</li>
</ul>

<h2>Key Fermented Ingredients</h2>

<h3>1. Fermented Rice</h3>
<p>Rich in amino acids, vitamins B and E, and minerals. Brightens skin tone and improves texture.</p>

<h3>2. Fermented Green Tea</h3>
<p>Contains higher levels of polyphenols and antioxidants than non-fermented tea. Reduces inflammation and protects against environmental damage.</p>

<h3>3. Fermented Ginseng</h3>
<p>Enhances blood circulation to the skin, promoting a natural, healthy glow.</p>

<h2>Our Approach</h2>

<p>At Commodities From China, we combine traditional fermentation techniques with modern peptide technology. Our ingredients are fermented for 72 hours using traditional methods, then combined with multi-weight peptides for maximum efficacy.</p>`,
    author: "Content Editor",
    tags: "skincare, science, fermentation, korean beauty, japanese beauty",
    publishedAt: "2026-04-05",
  },
  {
    title: "Creating a Mindful Home Sanctuary",
    slug: "mindful-home-sanctuary",
    excerpt: "How to curate a space that nurtures calm, creativity, and connection.",
    content: `<h1>Creating a Mindful Home Sanctuary</h1>

<h2>The Art of Intentional Living</h2>

<p>Your home should be your sanctuary — a space that nurtures calm, creativity, and connection. Drawing from Eastern principles of harmony and balance, here's how to create a space that truly supports your wellbeing.</p>

<h2>1. Choose Objects with Intention</h2>

<p>Every object in your home should have a purpose or bring you joy. Our <strong>Handmade Living</strong> collection is curated with this philosophy — each piece is crafted to be both functional and beautiful.</p>

<h2>2. Embrace Natural Materials</h2>

<p>Wood, ceramic, linen, bamboo — natural materials bring warmth and texture to your space. They age gracefully and develop character over time.</p>

<h2>3. Create Ritual Spaces</h2>

<p>Designate areas for your daily rituals:</p>
<ul>
<li><strong>Morning tea corner</strong> — A quiet space for your first cup</li>
<li><strong>Skincare altar</strong> — Where you perform your beauty ritual</li>
<li><strong>Meditation nook</strong> — A cushion and a simple shelf</li>
</ul>

<h2>4. Less is More</h2>

<p>Follow the Japanese principle of <strong>ma</strong> (negative space). Leave room for emptiness — it's not about what you add, but what you choose to leave out.</p>

<blockquote>"The beauty of a room is not in what is there, but in what is not."</blockquote>`,
    author: "Content Editor",
    tags: "home, mindfulness, decor, interior design, wabi-sabi",
    publishedAt: "2026-03-28",
  },
  {
    title: "Ingredient Spotlight: Ginseng in Skincare",
    slug: "ingredient-spotlight-ginseng",
    excerpt: "Why this ancient root is a powerhouse ingredient in modern peptide formulations.",
    content: `<h1>Ingredient Spotlight: Ginseng in Skincare</h1>

<h2>The Root of Radiance</h2>

<p>Ginseng (<em>Panax ginseng</em>) has been revered in East Asian medicine for thousands of years. In skincare, it's a powerhouse ingredient that delivers visible, transformative results.</p>

<h2>Why Ginseng Works</h2>

<p>Ginseng contains <strong>ginsenosides</strong> — unique compounds that:</p>

<ul>
<li><strong>Stimulate blood circulation</strong> — Bringing oxygen and nutrients to skin cells</li>
<li><strong>Boost collagen synthesis</strong> — Reducing fine lines and wrinkles</li>
<li><strong>Protect against UV damage</strong> — Acting as a natural antioxidant</li>
<li><strong>Energize dull skin</strong> — Promoting a radiant, healthy complexion</li>
</ul>

<h2>Our Double-Fermented Ginseng</h2>

<p>We use a proprietary double-fermentation process that increases the bioavailability of ginsenosides by 300%. This means your skin can absorb and utilize more of the active compounds.</p>

<h2>The Results</h2>

<p>In clinical trials, 89% of users showed improvement in fine lines and crow's feet within 8 weeks of consistent use.</p>`,
    author: "Content Editor",
    tags: "skincare, ingredients, ginseng, anti-aging, korean beauty",
    publishedAt: "2026-03-20",
  },
  {
    title: "The Tea Ceremony as Daily Ritual",
    slug: "tea-ceremony-daily-ritual",
    excerpt: "How the Japanese tea ceremony can transform your daily routine into a mindful practice.",
    content: `<h1>The Tea Ceremony as Daily Ritual</h1>

<h2>Finding Peace in a Cup</h2>

<p>The Japanese tea ceremony — <strong>chanoyu</strong> — is more than just preparing and drinking tea. It's a meditative practice that cultivates presence, gratitude, and connection.</p>

<h2>The Four Principles</h2>

<h3>1. Harmony (Wa)</h3>
<p>The harmony between host and guest, between the tools and the space, between the tea and the moment.</p>

<h3>2. Respect (Kei)</h3>
<p>Respect for the utensils, the tea, and each person present. Every movement is deliberate and meaningful.</p>

<h3>3. Purity (Sei)</h3>
<p>Purification — of the utensils, the space, and the mind. Wiping the tea bowl is a gesture of clearing the spirit.</p>

<h3>4. Tranquility (Jaku)</h3>
<p>The ultimate goal — a state of calm awareness that arises when the first three principles are embodied.</p>

<h2>Creating Your Own Ritual</h2>

<p>You don't need a dedicated tea room to practice chanoyu. Here's how to bring the spirit of the tea ceremony into your daily life:</p>

<ol>
<li><strong>Choose a special vessel</strong> — Our <strong>Artisan Tea Ceremony Set</strong> makes any cup of tea feel sacred</li>
<li><strong>Set aside 15 minutes</strong> — No phones, no distractions</li>
<li><strong>Focus on each movement</strong> — The sound of water, the warmth of the cup, the aroma of the tea</li>
<li><strong>Drink with gratitude</strong> — Acknowledge the hands that crafted your cup and grew your tea</li>
</ol>`,
    author: "Content Editor",
    tags: "tea, ritual, japanese, mindfulness, ceremony",
    publishedAt: "2026-03-15",
  },
]

async function seedDefaultBlogPosts() {
  for (const post of defaultBlogPosts) {
    const existing = await prisma.blogPost.findUnique({ where: { slug: post.slug } })
    if (existing) continue
    await prisma.blogPost.create({
      data: {
        ...post,
        publishedAt: new Date(post.publishedAt),
        isPublished: true,
      },
    })
    console.log(`Blog post created: ${post.slug}`)
  }
}

main()
  .catch((e) => {
    if (e.code === "P2021") {
      console.error("\n  Database tables not found. Run `npm run db:push` first to create tables.\n")
    } else {
      console.error("Seed error:", e)
    }
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
