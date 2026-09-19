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
    { name: "Electronics", slug: "electronics", description: "LED lighting, power banks, audio gear, and everyday electronics", type: "ELECTRONICS", sortOrder: 1, isFeatured: true, seoTitle: "Electronics", seoDescription: "Wholesale electronics and LED products", seoKeywords: "electronics, led, wholesale" },
    { name: "Home & Kitchen", slug: "home-kitchen", description: "Daily-use kitchenware and household essentials", type: "HOME", sortOrder: 2, isFeatured: true, seoTitle: "Home & Kitchen", seoDescription: "Kitchenware and household essentials", seoKeywords: "kitchenware, home goods, household" },
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
      name: "LED Motion Sensor Night Light",
      slug: "led-motion-sensor-night-light",
      sku: "CC-001",
      brand: "Commodities From China",
      description: "A compact LED night light with built-in motion sensor and automatic dimming. Energy-efficient, USB-rechargeable, and ideal for hallways, bedrooms, and closets.",
      shortDescription: "Rechargeable LED motion sensor night light",
      unitPrice: 6.50,
      originalPrice: 8.00,
      stock: 1500,
      status: "ACTIVE",
      isFeatured: true,
      isBestSeller: true,
      isNew: false,
      categorySlug: "electronics",
      imageUrl: "https://placehold.co/400x400/ivory/charcoal?text=LED+Light",
    },
    {
      name: "Portable Power Bank 20000mAh",
      slug: "portable-power-bank-20000mah",
      sku: "CC-002",
      brand: "Commodities From China",
      description: "High-capacity 20000mAh power bank with dual USB output and fast-charge support. Slim aluminum body, LED indicator, and overcharge protection for reliable everyday power.",
      shortDescription: "20000mAh dual-port fast-charge power bank",
      unitPrice: 18.00,
      originalPrice: null,
      stock: 800,
      status: "ACTIVE",
      isFeatured: true,
      isBestSeller: false,
      isNew: false,
      categorySlug: "electronics",
      imageUrl: "https://placehold.co/400x400/ivory/charcoal?text=Power+Bank",
    },
    {
      name: "TWS Wireless Earbuds Pro",
      slug: "tws-wireless-earbuds-pro",
      sku: "CC-003",
      brand: "Commodities From China",
      description: "True wireless earbuds with Bluetooth 5.3, active noise cancellation, and up to 30 hours of total playback with the charging case. IPX5 water resistance for workouts and daily commutes.",
      shortDescription: "Bluetooth 5.3 ANC true wireless earbuds",
      unitPrice: 24.50,
      originalPrice: 30.00,
      stock: 600,
      status: "ACTIVE",
      isFeatured: false,
      isBestSeller: false,
      isNew: true,
      categorySlug: "electronics",
      imageUrl: "https://placehold.co/400x400/ivory/charcoal?text=Earbuds",
    },
    {
      name: "Stainless Steel Insulated Mug 500ml",
      slug: "stainless-steel-insulated-mug-500ml",
      sku: "CC-004",
      brand: "Commodities From China",
      description: "Double-wall vacuum-insulated stainless steel mug that keeps drinks hot for 12 hours or cold for 24. Leak-proof lid, powder-coated finish, and dishwasher-safe construction.",
      shortDescription: "Vacuum-insulated 500ml stainless steel travel mug",
      unitPrice: 9.80,
      originalPrice: null,
      stock: 400,
      status: "DRAFT",
      isFeatured: false,
      isBestSeller: false,
      isNew: false,
      categorySlug: "home-kitchen",
      imageUrl: "https://placehold.co/400x400/ivory/charcoal?text=Insulated+Mug",
    },
    {
      name: "Smart LED Strip Light Kit",
      slug: "smart-led-strip-light-kit",
      sku: "CC-005",
      brand: "Commodities From China",
      description: "5-meter RGB smart LED strip kit with app and voice control, 16 million colors, and music sync mode. Self-adhesive backing makes installation quick and clean.",
      shortDescription: "5m RGB app-controlled smart LED strip light",
      unitPrice: 12.90,
      originalPrice: 15.00,
      stock: 1200,
      status: "ACTIVE",
      isFeatured: true,
      isBestSeller: false,
      isNew: false,
      categorySlug: "electronics",
      imageUrl: "https://placehold.co/400x400/ivory/charcoal?text=LED+Strip",
    },
    {
      name: "Ceramic Dinnerware Set (16-piece)",
      slug: "ceramic-dinnerware-set-16-piece",
      sku: "CC-006",
      brand: "Commodities From China",
      description: "Complete 16-piece ceramic dinnerware set including dinner plates, salad plates, bowls, and mugs. Durable stoneware finish that is microwave and dishwasher safe.",
      shortDescription: "16-piece ceramic dinnerware set",
      unitPrice: 42.00,
      originalPrice: null,
      stock: 180,
      status: "ACTIVE",
      isFeatured: false,
      isBestSeller: true,
      isNew: false,
      categorySlug: "home-kitchen",
      imageUrl: "https://placehold.co/400x400/ivory/charcoal?text=Dinnerware",
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

  await seedProductTranslations()

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
    "site.description": "Direct sourcing from trusted Chinese factories. Quality electronics, kitchenware, and daily-use commodities for retail and wholesale B2B buyers worldwide.",
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
    "company.brief": "Direct sourcing from trusted Chinese suppliers. Quality electronics, kitchenware, and daily-use commodities for retail and wholesale buyers.",
    "footer.about": "Sourced directly from China. Quality electronics, kitchenware, and everyday commodities for retail and wholesale B2B buyers worldwide.",
    "footer.copyright": "All rights reserved.",
    "social.facebook": "https://www.facebook.com/commoditychina",
    "social.instagram": "https://www.instagram.com/commoditychina",
    "social.linkedin": "",
    "social.youtube": "",
    "social.twitter": "https://twitter.com/commoditychina",
    "seo.homeTitle": "Commodities From China | Wholesale Electronics & Daily Commodities",
    "seo.homeDescription": "Factory-direct sourcing from China for retail and wholesale B2B buyers. Quality electronics, LED lighting, kitchenware, and everyday commodities at wholesale prices.",
    "seo.defaultKeywords": "wholesale electronics, commodities from china, b2b wholesale, led lighting wholesale, factory-direct, kitchenware wholesale",
    "content.featuredEyebrow": "Explore",
    "content.featuredHeading": "Our Collections",
    "content.featuredTagline": "Factory-direct sourcing, quality goods, worldwide delivery",
    "content.brandStory": JSON.stringify({
      eyebrow: "Our Story",
      title: "From China to the World",
      paragraphs: [
        "Commodities From China was founded on a simple belief — that quality goods should move directly from Chinese makers to buyers around the world, without unnecessary layers and markup.",
        "We partner with manufacturers and suppliers across China who have mastered their craft over decades, from LED lighting produced in modern factories to kitchenware shaped by industrial precision.",
        "Whether you shop retail or buy wholesale in bulk, we deliver factory-direct quality with reliable global shipping and dedicated support.",
      ],
      ctaLabel: "Read Our Story",
      ctaHref: "/pages/about",
    }),
    "content.promo1": JSON.stringify({
      eyebrow: "Modern Manufacturing",
      title: "Quality Electronics",
      body: "From LED lighting and power banks to wireless audio — our electronics are manufactured to strict quality standards with global certifications. Built for retail, private label, and wholesale order quantities.",
      features: [
        { title: "Factory-Direct Pricing", description: "Bulk pricing with tiered discounts for wholesale orders" },
        { title: "Certified Quality", description: "CE, FCC, RoHS certified products with batch inspection" },
        { title: "Private Label Ready", description: "Custom branding and packaging for retail programs" },
        { title: "Reliable Supply", description: "Consistent stock and dependable shipping schedules" },
      ],
      ctaLabel: "View All Electronics",
      ctaHref: "/categories/electronics",
    }),
    "content.promo2": JSON.stringify({
      eyebrow: "Everyday Essentials",
      title: "Home & Kitchen",
      tagline: "Practical, durable kitchenware and household goods for daily life",
      collections: [
        { title: "Kitchenware", description: "Cookware, dinnerware, and prep tools", href: "/categories/home-kitchen?sub=kitchenware" },
        { title: "Storage", description: "Food containers and organization solutions", href: "/categories/home-kitchen?sub=storage" },
        { title: "Textiles", description: "Towels, linens, and kitchen textiles", href: "/categories/home-kitchen?sub=textiles" },
        { title: "Cleaning", description: "Household cleaning essentials", href: "/categories/home-kitchen?sub=cleaning" },
      ],
      ctaLabel: "Explore All Collections",
      ctaHref: "/categories/home-kitchen",
    }),
    "content.testimonials": JSON.stringify([
      {
        name: "Sarah M.",
        location: "New York",
        rating: 5,
        text: "We order LED lighting products in bulk from Commodities From China every quarter. Consistent quality, on-time delivery, and pricing that keeps us competitive.",
        product: "LED Motion Sensor Night Light",
      },
      {
        name: "Emily R.",
        location: "Guangzhou",
        rating: 5,
        text: "The dinnerware set is excellent value for the wholesale price. My customers love the quality, and the supplier communication was fast and professional.",
        product: "Ceramic Dinnerware Set",
      },
      {
        name: "Jessica K.",
        location: "London",
        rating: 5,
        text: "Reliable sourcing partner. The power banks sell out quickly at our retail store. Finally a supplier that delivers what they promise at factory-direct prices.",
        product: "Portable Power Bank 20000mAh",
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
        q: "What is the minimum order quantity (MOQ)?",
        a: "MOQs vary by product. Most electronics and kitchenware items can be ordered at retail quantities, while some bulk items have a minimum of 100 units. Contact us for detailed MOQ and tiered wholesale pricing.",
      },
      {
        q: "Can I order in bulk for wholesale or private label?",
        a: "Yes. We support wholesale orders with tiered discounts, and offer private label services including custom branding, packaging, and product labeling for qualified orders.",
      },
      {
        q: "How long does shipping take?",
        a: "Standard shipping takes 5-8 business days. Express shipping takes 2-3 business days. Free standard shipping is available on orders over the free-shipping threshold.",
      },
      {
        q: "What is your return policy?",
        a: "We offer a 30-day return window for unused products in original packaging. Defective items are replaced or refunded at no cost. Refunds are processed within 5-7 business days.",
      },
      {
        q: "Do you ship internationally?",
        a: "Yes, we ship worldwide. International orders may be subject to customs duties and taxes, which are the customer's responsibility. We provide tracking on all orders.",
      },
      {
        q: "Are your products certified?",
        a: "Most of our electronics carry CE, FCC, and RoHS certifications, and kitchenware meets food-safe standards. Certification documents are available upon request.",
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
    content: `<h1>From China to the World</h1><p>Our journey began in the factories and workshops of China — from electronics assembly lines in Shenzhen to kitchenware manufacturers in Guangzhou. We traveled the country to find makers who share one standard: quality you can trust.</p><p>We believe that buying well is simpler when good products move directly from maker to buyer. That's why we handle sourcing, quality control, and shipping ourselves — so you get factory-direct value every time.</p>`,
    seoTitle: "About Us",
    seoDescription: "Discover how Commodities From China sources quality electronics, kitchenware, and everyday goods directly from Chinese suppliers.",
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
    title: "How to Import from China: A Beginner's Guide",
    slug: "import-from-china-beginners-guide",
    excerpt: "Everything you need to know before your first shipment — from finding suppliers to clearing customs.",
    content: `<h1>How to Import from China: A Beginner's Guide</h1>

<h2>Why Source from China?</h2>

<p>China remains the world's largest manufacturer of consumer goods, offering unmatched scale, competitive pricing, and a complete supply chain — from electronics to everyday household items. For both retail entrepreneurs and established wholesalers, sourcing from China is the fastest path to factory-direct margins.</p>

<h2>Step 1: Define Your Product</h2>

<p>Know exactly what you want to buy. A tight product specification — including materials, dimensions, certifications, and quality expectations — makes every later step faster and less risky.</p>

<ul>
<li><strong>Write a detailed spec sheet</strong></li>
<li><strong>Set your target price range</strong></li>
<li><strong>Determine your target MOQ</strong></li>
<li><strong>List required certifications</strong></li>
</ul>

<h2>Step 2: Choose a Sourcing Route</h2>

<p>You can work with trade intermediaries, sourcing agents, or go directly to manufacturers. Direct factory relationships give you the best pricing but require more diligence.</p>

<h2>Step 3: Quality Control</h2>

<p>Never skip inspection. A third-party pre-shipment inspection catches defects before your money is tied up in freight. Samples should be tested before you commit to a production run.</p>

<h2>Step 4: Shipping and Customs</h2>

<p>Choose between air freight (fast, higher cost) and sea freight (slow, lower cost for large volumes). Understand Incoterms, HS codes, and duties — customs preparation prevents costly delays at the border.</p>

<blockquote>"The key to a successful import strategy is preparation: spec your product correctly, inspect your goods, and know your true landed cost before you order."</blockquote>

<h2>Why Work with a Sourcing Partner?</h2>

<p>A reliable sourcing partner, like Commodities From China, handles supplier vetting, quality control, and export logistics for you — so you get factory-direct pricing without the hassle of managing factories abroad.</p>`,
    author: "Content Editor",
    tags: "importing, sourcing, china, b2b, wholesale",
    publishedAt: "2026-04-15",
  },
  {
    title: "Quality Control 101: What Your Supplier Won't Tell You",
    slug: "quality-control-101",
    excerpt: "Practical steps to make sure your products match the sample — every single time.",
    content: `<h1>Quality Control 101: What Your Supplier Won't Tell You</h1>

<h2>Why Quality Control Matters</h2>

<p>Product returns, chargebacks, and lost customers all trace back to quality failures. A disciplined quality-control process protects your margins and your reputation. Here's what every importer should know.</p>

<h2>Step 1: Approve the Sample, Not the Promise</h2>

<p>Never place a production order based on a supplier's description. Get a physical or approved sample and lock the spec in writing, including tolerances for color, weight, and finish.</p>

<h2>Step 2: In-Process Inspections</h2>

<p>For your first production runs, schedule an inspection during manufacturing — not only after. Defects caught mid-run are cheap to fix; defects caught after shipment are expensive news.</p>

<h2>Step 3: Pre-Shipment Inspection</h2>

<p>A pre-shipment inspection against the AQL (Acceptable Quality Limit) standard catches most issues before goods leave the factory. Your contract should clearly state the inspection pass/fail criteria.</p>

<h2>Step 4: Document Everything</h2>

<p>Keep photos, certificates, and test reports from every batch. Documentation resolves disputes quickly and builds leverage with suppliers on rework or refunds.</p>

<blockquote>"Trust but verify. Samples set the benchmark, but only inspection guarantees delivery."</blockquote>

<h2>Our Approach</h2>

<p>At Commodities From China, every batch is inspected before shipment. Certified electronics and certified food-safe kitchenware can't be taken on faith — they're verified, documented, and traceable.</p>`,
    author: "Content Editor",
    tags: "quality control, inspection, manufacturing, b2b, suppliers",
    publishedAt: "2026-04-10",
  },
  {
    title: "Air Freight vs Sea Freight: Choosing the Right Shipping Method",
    slug: "air-freight-vs-sea-freight",
    excerpt: "Cost, speed, and reliability — how to pick the right logistics channel for your goods.",
    content: `<h1>Air Freight vs Sea Freight: Choosing the Right Shipping Method</h1>

<h2>Speed vs. Cost</h2>

<p>Your shipping choice balances two competing goals: getting products to market fast, and keeping landed costs low. Understanding the trade-offs helps you choose the right channel for each shipment.</p>

<h2>When to Use Air Freight</h2>

<p>Air freight costs more per unit but wins on speed — typically 3-7 days door-to-door. Choose air when you're:</p>

<ul>
<li><strong>Restocking best sellers</strong> — inventory downtime costs more than freight</li>
<li><strong>Shipping high-value items</strong> — electronics with high per-unit value</li>
<li><strong>Running promotions</strong> — deadlines that can't slip</li>
<li><strong>Sending small volumes</strong> — under 100 kg, air is often sensible</li>
</ul>

<h2>When to Use Sea Freight</h2>

<p>Sea freight is dramatically cheaper for large volumes. Choose sea when you're shipping more than a pallet of goods with a less urgent timeline — typically 25-40 days from port to port.</p>

<h2>Calculating Total Landed Cost</h2>

<p>Your landed cost includes freight, insurance, duties, customs clearance, and warehousing. Compare the full picture, not just the freight quote, before choosing a channel.</p>

<blockquote>"The cheapest shipping method is rarely the cheapest overall — always calculate total landed cost."</blockquote>`,
    author: "Content Editor",
    tags: "logistics, shipping, freight, international trade, b2b",
    publishedAt: "2026-04-05",
  },
  {
    title: "Understanding MOQ: How to Negotiate Minimum Order Quantities",
    slug: "understanding-moq-negotiation",
    excerpt: "What MOQ really means, and how to negotiate better terms with Chinese suppliers.",
    content: `<h1>Understanding MOQ: How to Negotiate Minimum Order Quantities</h1>

<h2>What Is an MOQ?</h2>

<p>Minimum order quantity (MOQ) is the smallest order a factory will produce. MOQs exist because factories set up tooling, materials, and production lines — and smaller batches mean higher cost per unit.</p>

<h2>Why Suppliers Set MOQs</h2>

<p>Understand the supplier's economics and negotiation gets easier. An MOQ typically covers setup costs, material minimums, and factory capacity allocation. It's not arbitrary — it's math.</p>

<h2>How to Negotiate a Better MOQ</h2>

<ul>
<li><strong>Order from existing catalog items</strong> — standard products have lower MOQs than custom designs</li>
<li><strong>Commit to repeat orders</strong> — a purchase plan wins lower initial MOQs</li>
<li><strong>Adjust the spec</strong> — flexible materials or colors can lower the minimum</li>
<li><strong>Consolidate variants</strong> — combine sizes into one production run</li>
<li><strong>Pay better terms</strong> — faster payment often trades for lower MOQ</li>
</ul>

<h2>MOQ Is a Tool, Not a Barrier</h2>

<p>For small buyers, working with a sourcing partner pools demand across many customers, unlocking low MOQs and factory-direct pricing that would otherwise be out of reach.</p>`,
    author: "Content Editor",
    tags: "moq, negotiation, sourcing, wholesale, b2b",
    publishedAt: "2026-03-28",
  },
  {
    title: "Why LED Lighting Is Transforming the Wholesale Market",
    slug: "why-led-lighting-transforming-wholesale",
    excerpt: "Energy efficiency, long lifespan, and falling prices — why LED products are a wholesale staple.",
    content: `<h1>Why LED Lighting Is Transforming the Wholesale Market</h1>

<h2>The LED Advantage</h2>

<p>LED lighting has become a mainstream wholesale category thanks to three compounding advantages: dramatically lower energy use, long service life, and rapidly falling production costs.</p>

<h2>Energy Efficiency That Sells Itself</h2>

<p>LED bulbs consume up to 80% less energy than incandescent equivalents and last 15 times longer. For commercial and residential buyers, the payback period is often measured in months — making LED an easy upsell for resellers.</p>

<h2>Smart Lighting, New Margins</h2>

<p>Smart LED products — strips, bulbs, and sensors with app and voice control — command premium margins. The ecosystem keeps expanding, from RGB strips to motion-sensing night lights, giving wholesalers a constant stream of new SKUs.</p>

<h2>Certifications Matter</h2>

<p>Legal, safe LED products carry CE, RoHS, and FCC certification. Buyers increasingly verify compliance before purchase, so importing from suppliers who document certification is a competitive advantage.</p>

<blockquote>"LED is no longer the future of lighting — it's the present. Wholesalers who carry certified LED products have a clear market advantage."</blockquote>`,
    author: "Content Editor",
    tags: "led, lighting, electronics, wholesale, energy",
    publishedAt: "2026-03-20",
  },
  {
    title: "Customs and Tariffs: A Practical Guide for Importers",
    slug: "customs-tariffs-importer-guide",
    excerpt: "HS codes, duties, and documentation — the practical basics every importer needs.",
    content: `<h1>Customs and Tariffs: A Practical Guide for Importers</h1>

<h2>The Customs Basics</h2>

<p>Every import crosses a border through customs — a process governed by classification, valuation, and documentation. Getting these right keeps shipments flowing and costs predictable.</p>

<h2>1. HS Codes</h2>

<p>The Harmonized System (HS) code classifies your product and determines the duty rate. Classifying correctly avoids overpaying duties or triggering inspections. When in doubt, use a customs broker.</p>

<h2>2. Valuation and Duties</h2>

<p>Duties are calculated on the customs value — typically the price you paid plus freight and insurance. Know the duty rate for your product class before you commit to a landed-cost budget.</p>

<h2>3. Key Documents</h2>

<p>Standard exports from China require a commercial invoice, packing list, and bill of lading. Depending on the product, add certificates of origin and compliance documents (CE, FCC, RoHS).</p>

<h2>4. Avoid the Common Pitfalls</h2>

<p>Under-declared values, missing certificates, and mismatched paperwork are the most common causes of customs delays. Consistency between invoice, packing list, and shipping documents is everything.</p>

<blockquote>"Duties and documentation aren't an afterthought — they're part of your landed cost. Plan for them before you place the order."</blockquote>`,
    author: "Content Editor",
    tags: "customs, tariffs, importing, international trade, logistics",
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

interface ProductTranslationData {
  name: string
  shortDescription: string
  description: string
  seoTitle: string
  seoDescription: string
}

const productTranslations: Record<string, Record<string, ProductTranslationData>> = {
  "led-motion-sensor-night-light": {
    zh: {
      name: "LED人体感应夜灯",
      shortDescription: "可充电LED人体感应夜灯",
      description: "一款紧凑型LED夜灯，内置人体感应器和自动调光功能。节能省电、USB可充电，适合走廊、卧室和衣柜使用。",
      seoTitle: "LED人体感应夜灯批发采购",
      seoDescription: "批发可充电LED人体感应夜灯，内置感应器、自动调光，节能省电，适合走廊卧室使用。",
    },
    es: {
      name: "Luz Nocturna LED con Sensor de Movimiento",
      shortDescription: "Luz nocturna LED recargable con sensor de movimiento",
      description: "Una lámpara nocturna LED compacta con sensor de movimiento integrado y atenuación automática. Eficiente, recargable por USB e ideal para pasillos, dormitorios y armarios.",
      seoTitle: "Luz Nocturna LED con Sensor de Movimiento al por mayor",
      seoDescription: "Luz nocturna LED recargable con sensor de movimiento y atenuación automática para pasillos y dormitorios.",
    },
    pt: {
      name: "Luminária LED com Sensor de Movimento",
      shortDescription: "Luminária LED recarregável com sensor de movimento",
      description: "Uma luminária noturna LED compacta com sensor de movimento integrado e escurecimento automático. Eficiente, recarregável via USB e ideal para corredores, quartos e armários.",
      seoTitle: "Luminária LED com Sensor de Movimento no atacado",
      seoDescription: "Luminária noturna LED recarregável com sensor de movimento para corredores e quartos.",
    },
    fr: {
      name: "Veilleuse LED avec Détecteur de Mouvement",
      shortDescription: "Veilleuse LED rechargeable à détecteur de mouvement",
      description: "Une veilleuse LED compacte avec détecteur de mouvement intégré et gradation automatique. Économe en énergie, rechargeable par USB et idéale pour les couloirs, chambres et placards.",
      seoTitle: "Veilleuse LED à Détecteur de Mouvement en gros",
      seoDescription: "Veilleuse LED rechargeable avec détecteur de mouvement et gradation automatique.",
    },
    de: {
      name: "LED Nachtlicht mit Bewegungssensor",
      shortDescription: "Wiederaufladbares LED Nachtlicht mit Bewegungssensor",
      description: "Ein kompaktes LED Nachtlicht mit integriertem Bewegungssensor und automatischer Dimmung. Energiesparend, per USB aufladbar und ideal für Flure, Schlafzimmer und Abstellräume.",
      seoTitle: "LED Nachtlicht mit Bewegungssensor im Großhandel",
      seoDescription: "Wiederaufladbares LED Nachtlicht mit Bewegungssensor und automatischer Dimmung.",
    },
    ru: {
      name: "LED-ночник с датчиком движения",
      shortDescription: "Перезаряжаемый LED-ночник с датчиком движения",
      description: "Компактный LED-ночник со встроенным датчиком движения и автоматическим затемнением. Энергоэффективный, заряжается через USB, идеален для коридоров, спален и гардеробных.",
      seoTitle: "LED-ночник с датчиком движения оптом",
      seoDescription: "Перезаряжаемый LED-ночник с датчиком движения и автоматическим затемнением.",
    },
    ar: {
      name: "مصباح ليلي LED مع مستشعر حركة",
      shortDescription: "مصباح ليلي LED قابل للشحن مع مستشعر حركة",
      description: "مصباح ليلي LED صغير مدمج مع مستشعر حركة مدمج وتعتيم تلقائي. موفر للطاقة وقابل للشحن عبر USB، مثالي للممرات وغرف النوم وخزائن الملابس.",
      seoTitle: "مصباح ليلي LED مع مستشعر حركة بالجملة",
      seoDescription: "مصباح ليلي LED قابل للشحن مع مستشعر حركة وتعتيم تلقائي.",
    },
  },
  "portable-power-bank-20000mah": {
    zh: {
      name: "20000mAh便携充电宝",
      shortDescription: "20000mAh双USB快充充电宝",
      description: "大容量20000mAh充电宝，支持双USB输出和快充。纤薄铝合金机身，LED电量显示，过充保护，日常供电可靠。",
      seoTitle: "20000mAh便携充电宝批发",
      seoDescription: "批发20000mAh双USB快充充电宝，铝合金机身，LED电量显示，过充保护。",
    },
    es: {
      name: "Batería Externa 20000mAh",
      shortDescription: "Batería portátil de 20000mAh con doble puerto USB y carga rápida",
      description: "Batería externa de alta capacidad de 20000mAh con salida USB dual y carga rápida. Cuerpo de aluminio fino, indicador LED y protección contra sobrecarga.",
      seoTitle: "Batería Externa 20000mAh al por mayor",
      seoDescription: "Batería portátil de 20000mAh con doble puerto USB y carga rápida para uso diario.",
    },
    pt: {
      name: "Power Bank 20000mAh",
      shortDescription: "Power bank portátil 20000mAh com porta USB dupla e carregamento rápido",
      description: "Power bank de alta capacidade de 20000mAh com saída USB dupla e suporte a carga rápida. Corpo em alumínio fino, indicador LED e proteção contra sobrecarga.",
      seoTitle: "Power Bank 20000mAh no atacado",
      seoDescription: "Power bank portátil 20000mAh com porta USB dupla e carregamento rápido.",
    },
    fr: {
      name: "Batterie Externe 20000mAh",
      shortDescription: "Batterie externe 20000mAh à double port USB et charge rapide",
      description: "Batterie externe haute capacité de 20000mAh avec sortie USB double et charge rapide. Corps en aluminium fin, indicateur LED et protection contre la surcharge.",
      seoTitle: "Batterie Externe 20000mAh en gros",
      seoDescription: "Batterie portable 20000mAh à double port USB et charge rapide.",
    },
    de: {
      name: "Powerbank 20000mAh",
      shortDescription: "Tragbare Powerbank mit 20000mAh, Dual-USB und Schnellladung",
      description: "High-Capacity-Powerbank mit 20000mAh, Dual-USB-Ausgang und Schnellladefunktion. Schlankes Aluminiumgehäuse, LED-Anzeige und Überladeschutz.",
      seoTitle: "Powerbank 20000mAh im Großhandel",
      seoDescription: "Tragbare Powerbank mit 20000mAh, Dual-USB und Schnellladefunktion.",
    },
    ru: {
      name: "Повербанк 20000 мАч",
      shortDescription: "Портативный повербанк 20000 мАч с двумя USB и быстрой зарядкой",
      description: "Повербанк высокой ёмкости 20000 мАч с двумя USB-портами и поддержкой быстрой зарядки. Тонкий алюминиевый корпус, LED-индикатор и защита от перезаряда.",
      seoTitle: "Повербанк 20000 мАч оптом",
      seoDescription: "Портативный повербанк 20000 мАч с двумя USB-портами и быстрой зарядкой.",
    },
    ar: {
      name: "بنك طاقة 20000mAh",
      shortDescription: "بنك طاقة محمول 20000mAh بمنفذي USB وشحن سريع",
      description: "بنك طاقة عالي السعة 20000mAh مع مخرجين USB ودعم الشحن السريع. جسم ألومنيوم رفيع، مؤشر LED وحماية من الشحن الزائد.",
      seoTitle: "بنك طاقة 20000mAh بالجملة",
      seoDescription: "بنك طاقة محمول 20000mAh بمنفذي USB وشحن سريع.",
    },
  },
  "tws-wireless-earbuds-pro": {
    zh: {
      name: "TWS专业无线蓝牙耳机",
      shortDescription: "蓝牙5.3主动降噪真无线耳机",
      description: "真无线耳机，蓝牙5.3，主动降噪，配合充电盒总续航可达30小时。IPX5防水，适合运动健身和日常通勤。",
      seoTitle: "TWS主动降噪无线耳机批发",
      seoDescription: "批发蓝牙5.3主动降噪真无线耳机，30小时总续航，IPX5防水。",
    },
    es: {
      name: "Auriculares Inalámbricos TWS Pro",
      shortDescription: "Auriculares inalámbricos con Bluetooth 5.3 y cancelación de ruido",
      description: "Auriculares verdaderamente inalámbricos con Bluetooth 5.3, cancelación activa de ruido y hasta 30 horas de reproducción total con el estuche de carga. Resistencia al agua IPX5.",
      seoTitle: "Auriculares TWS con cancelación de ruido al por mayor",
      seoDescription: "Auriculares inalámbricos Bluetooth 5.3 con cancelación de ruido y 30 horas de batería.",
    },
    pt: {
      name: "Fones de Ouvido Sem Fio TWS Pro",
      shortDescription: "Fones sem fio com Bluetooth 5.3 e cancelamento de ruído",
      description: "Fones verdadeiramente sem fio com Bluetooth 5.3, cancelamento ativo de ruído e até 30 horas de reprodução com o estojo de carregamento. Resistência à água IPX5.",
      seoTitle: "Fones TWS com cancelamento de ruído no atacado",
      seoDescription: "Fones de ouvido Bluetooth 5.3 com cancelamento de ruído e 30 horas de bateria.",
    },
    fr: {
      name: "Écouteurs Sans Fil TWS Pro",
      shortDescription: "Écouteurs Bluetooth 5.3 avec réduction de bruit active",
      description: "Écouteurs véritablement sans fil avec Bluetooth 5.3, réduction active du bruit et jusqu'à 30 heures d'écoute avec le boîtier de charge. Résistance à l'eau IPX5.",
      seoTitle: "Écouteurs TWS à réduction de bruit en gros",
      seoDescription: "Écouteurs sans fil Bluetooth 5.3 avec réduction de bruit et 30 heures d'autonomie.",
    },
    de: {
      name: "TWS Kabellose Ohrhörer Pro",
      shortDescription: "Kabellose Ohrhörer mit Bluetooth 5.3 und aktiver Geräuschunterdrückung",
      description: "Echte kabellose Ohrhörer mit Bluetooth 5.3, aktiver Geräuschunterdrückung und bis zu 30 Stunden Wiedergabe mit dem Ladecase. Wasserschutz IPX5.",
      seoTitle: "TWS Ohrhörer mit Geräuschunterdrückung im Großhandel",
      seoDescription: "Kabellose Bluetooth 5.3 Ohrhörer mit Geräuschunterdrückung und 30 Stunden Akku.",
    },
    ru: {
      name: "TWS Беспроводные наушники Pro",
      shortDescription: "Беспроводные наушники Bluetooth 5.3 с активным шумоподавлением",
      description: "Настоящие беспроводные наушники с Bluetooth 5.3, активным шумоподавлением и до 30 часов работы с зарядным кейсом. Влагозащита IPX5.",
      seoTitle: "TWS наушники с шумоподавлением оптом",
      seoDescription: "Беспроводные наушники Bluetooth 5.3 с шумоподавлением и 30 часами работы.",
    },
    ar: {
      name: "سماعات TWS اللاسلكية الاحترافية",
      shortDescription: "سماعات لاسلكية بتقنية Bluetooth 5.3 وإلغاء الضوضاء",
      description: "سماعات لاسلكية حقيقية مع Bluetooth 5.3 وإلغاء الضوضاء النشط وما يصل إلى 30 ساعة من التشغيل مع علبة الشحن. مقاومة للماء IPX5.",
      seoTitle: "سماعات TWS مع إلغاء الضوضاء بالجملة",
      seoDescription: "سماعات لاسلكية Bluetooth 5.3 مع إلغاء الضوضاء و30 ساعة من البطارية.",
    },
  },
  "smart-led-strip-light-kit": {
    zh: {
      name: "智能LED灯带套装",
      shortDescription: "5米RGB智能LED灯带，支持App和语音控制",
      description: "5米RGB智能LED灯带，支持App和语音控制，1600万色，音乐同步模式。背胶设计，安装快速整洁。",
      seoTitle: "智能RGB LED灯带批发",
      seoDescription: "批发5米RGB智能LED灯带，App和语音控制，1600万色，音乐同步。",
    },
    es: {
      name: "Tira LED Inteligente de 5m",
      shortDescription: "Tira LED RGB inteligente de 5 metros con control por app y voz",
      description: "Kit de tira LED RGB inteligente de 5 metros con control por app y voz, 16 millones de colores y modo de sincronización musical. Adhesivo en el reverso para una instalación rápida.",
      seoTitle: "Tira LED RGB inteligente al por mayor",
      seoDescription: "Tira LED RGB inteligente de 5 metros con control por app, 16 millones de colores y música.",
    },
    pt: {
      name: "Kit de Fita LED Inteligente",
      shortDescription: "Fita LED RGB inteligente de 5 m com controle por app e voz",
      description: "Kit de fita LED RGB inteligente de 5 metros com controle por app e voz, 16 milhões de cores e modo de sincronização musical. Adesivo atrás para instalação rápida.",
      seoTitle: "Fita LED RGB inteligente no atacado",
      seoDescription: "Fita LED RGB inteligente de 5 metros com controle por app e sincronização musical.",
    },
    fr: {
      name: "Ruban LED Intelligent 5m",
      shortDescription: "Ruban LED RGB intelligent de 5 m avec contrôle par appli et voix",
      description: "Ruban LED RGB intelligent de 5 mètres avec contrôle par appli et voix, 16 millions de couleurs et mode sync musicale. Adhésif au dos pour une installation rapide.",
      seoTitle: "Ruban LED RGB intelligent en gros",
      seoDescription: "Ruban LED RGB intelligent de 5 mètres avec contrôle par appli et 16 millions de couleurs.",
    },
    de: {
      name: "Smartes LED-Streifen-Set 5m",
      shortDescription: "Intelligentes RGB-LED-Band 5 m mit App- und Sprachsteuerung",
      description: "5 Meter smartes RGB-LED-Band mit App- und Sprachsteuerung, 16 Millionen Farben und Musik-Synchronmodus. Selbstklebend für eine schnelle, saubere Montage.",
      seoTitle: "Smartes RGB-LED-Band im Großhandel",
      seoDescription: "Intelligentes RGB-LED-Band 5 m mit App-Steuerung und Musik-Synchronmodus.",
    },
    ru: {
      name: "Умная LED-лента 5 м",
      shortDescription: "Умная RGB LED-лента 5 м с управлением через приложение и голосом",
      description: "Умная RGB LED-лента 5 метров с управлением через приложение и голосом, 16 миллионов цветов и режим синхронизации с музыкой. Самоклеящаяся основа для быстрого монтажа.",
      seoTitle: "Умная RGB LED-лента оптом",
      seoDescription: "Умная RGB LED-лента 5 м с управлением через приложение и синхронизацией с музыкой.",
    },
    ar: {
      name: "شريط LED ذكي 5م",
      shortDescription: "شريط LED RGB ذكي بطول 5 أمتار مع تحكم بالتطبيق والصوت",
      description: "شريط LED RGB ذكي بطول 5 أمتار مع تحكم بالتطبيق والصوت، 16 مليون لون ووضع مزامنة الموسيقى. لاصق من الخلف لتركيب سريع ونظيف.",
      seoTitle: "شريط LED RGB ذكي بالجملة",
      seoDescription: "شريط LED RGB ذكي بطول 5 أمتار مع تحكم بالتطبيق و16 مليون لون.",
    },
  },
  "ceramic-dinnerware-set-16-piece": {
    zh: {
      name: "陶瓷餐具套装（16件）",
      shortDescription: "16件套陶瓷餐具套装",
      description: "完整的16件套陶瓷餐具，包括餐盘、沙拉盘、碗和马克杯。耐用炻器釉面，可微波炉和洗碗机使用。",
      seoTitle: "16件套陶瓷餐具套装批发",
      seoDescription: "批发16件套陶瓷餐具，包含餐盘、沙拉盘、碗和马克杯，可微波炉和洗碗机使用。",
    },
    es: {
      name: "Vajilla de Cerámica (16 piezas)",
      shortDescription: "Vajilla de cerámica de 16 piezas",
      description: "Juego de vajilla de cerámica completo de 16 piezas con platos de comida, platos de ensalada, tazones y tazas. Acabado de gres duradero, apto para microondas y lavavajillas.",
      seoTitle: "Vajilla de cerámica de 16 piezas al por mayor",
      seoDescription: "Vajilla de cerámica de 16 piezas apta para microondas y lavavajillas.",
    },
    pt: {
      name: "Conjunto de Louça de Cerâmica (16 peças)",
      shortDescription: "Conjunto de louça de cerâmica com 16 peças",
      description: "Conjunto completo de louça de cerâmica com 16 peças, incluindo pratos de jantar, pratos de salada, tigelas e canecas. Acabamento em grés durável, próprio para micro-ondas e lava-louças.",
      seoTitle: "Conjunto de louça de cerâmica de 16 peças no atacado",
      seoDescription: "Conjunto de cerâmica de 16 peças próprio para micro-ondas e lava-louças.",
    },
    fr: {
      name: "Service de Table en Céramique (16 pièces)",
      shortDescription: "Service de table en céramique de 16 pièces",
      description: "Service de table en céramique complet de 16 pièces comprenant assiettes de dîner, assiettes à salade, bols et tasses. Fini en grès durable, compatible micro-ondes et lave-vaisselle.",
      seoTitle: "Service de table en céramique de 16 pièces en gros",
      seoDescription: "Service en céramique de 16 pièces compatible micro-ondes et lave-vaisselle.",
    },
    de: {
      name: "Keramik-Geschirrset (16-teilig)",
      shortDescription: "16-teiliges Keramik-Geschirrset",
      description: "Komplettes 16-teiliges Keramik-Geschirrset mit Esstellern, Salattellern, Schalen und Tassen. Langlebige Steinzeugoberfläche, mikrowellen- und spülmaschinengeeignet.",
      seoTitle: "16-teiliges Keramik-Geschirrset im Großhandel",
      seoDescription: "16-teiliges Keramik-Geschirrset, mikrowellen- und spülmaschinengeeignet.",
    },
    ru: {
      name: "Керамический сервиз (16 предметов)",
      shortDescription: "Керамический сервиз из 16 предметов",
      description: "Полный керамический сервиз из 16 предметов: обеденные тарелки, салатные тарелки, миски и кружки. Прочное покрытие из керамогранита, подходит для микроволновки и посудомоечной машины.",
      seoTitle: "Керамический сервиз из 16 предметов оптом",
      seoDescription: "Керамический сервиз из 16 предметов, подходит для микроволновки и посудомоечной машины.",
    },
    ar: {
      name: "طقم أواني خزفية (16 قطعة)",
      shortDescription: "طقم أواني خزفية من 16 قطعة",
      description: "طقم أواني خزفية كامل من 16 قطعة يشمل أطباق العشاء وأطباق السلطة والأوعية والأكواب. تشطيب خزفي متين، آمن للاستخدام في الميكروويف وغسالة الأطباق.",
      seoTitle: "طقم أواني خزفية من 16 قطعة بالجملة",
      seoDescription: "طقم خزفي من 16 قطعة آمن للاستخدام في الميكروويف وغسالة الأطباق.",
    },
  },
}

async function seedProductTranslations() {
  for (const [slug, perLocale] of Object.entries(productTranslations)) {
    const product = await prisma.product.findUnique({
      where: { slug },
      select: { id: true },
    })
    if (!product) continue

    for (const [locale, data] of Object.entries(perLocale)) {
      await prisma.productTranslation.upsert({
        where: { productId_locale: { productId: product.id, locale } },
        update: {},
        create: { productId: product.id, locale, ...data },
      })
    }
  }
  console.log("Product translations seeded.")
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
