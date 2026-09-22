import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"
import { pageTranslationsSeed } from "./seed-data/pages"
import { blogTranslationsSeed } from "./seed-data/blog"
import { faqTranslationsSeed } from "./seed-data/faq"

const prisma = new PrismaClient()

const CONTENT_LOCALES = ["zh", "es", "pt", "fr", "de", "ru", "ar", "id", "vi", "th", "ms"]

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

  await seedSiteSettings()

  const defaultMenus = [
    { label: "Home", url: "/", sortOrder: 1 },
    { label: "Products", url: "/products", sortOrder: 2 },
    { label: "Journal", url: "/blog", sortOrder: 3 },
    { label: "FAQ", url: "/faq", sortOrder: 4 },
    { label: "About Us", url: "/pages/about", sortOrder: 5 },
    { label: "Contact Us", url: "/pages/contact", sortOrder: 6 },
  ]

  for (const menu of defaultMenus) {
    const existingMenu = await prisma.menu.findFirst({ where: { label: menu.label } })
    if (existingMenu) continue
    await prisma.menu.create({ data: menu })
    console.log(`Menu created: ${menu.label}`)
  }

  await seedDefaultPages()
  await seedPageTranslations()
  await seedDefaultBlogPosts()
  await seedBlogPostTranslations()
  await seedSiteFaqs()

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
      ctaLabel: "View All Products",
      ctaHref: "/products",
    }),
    "content.promo2": JSON.stringify({
      eyebrow: "Everyday Essentials",
      title: "Home & Kitchen",
      tagline: "Practical, durable kitchenware and household goods for daily life",
      collections: [
        { title: "Kitchenware", description: "Cookware, dinnerware, and prep tools", href: "/products" },
        { title: "Storage", description: "Food containers and organization solutions", href: "/products" },
        { title: "Textiles", description: "Towels, linens, and kitchen textiles", href: "/products" },
        { title: "Cleaning", description: "Household cleaning essentials", href: "/products" },
      ],
      ctaLabel: "Explore All Collections",
      ctaHref: "/products",
    }),
    "content.testimonials": JSON.stringify([
      {
        name: "Sarah M.",
        location: "New York",
        rating: 5,
        text: "We order LED lighting products in bulk from Commodities From China every quarter. Consistent quality, on-time delivery, and pricing that keeps us competitive.",
        product: "LED Lighting Range",
      },
      {
        name: "Emily R.",
        location: "Guangzhou",
        rating: 5,
        text: "The dinnerware set is excellent value for the wholesale price. My customers love the quality, and the supplier communication was fast and professional.",
        product: "Dinnerware Collection",
      },
      {
        name: "Jessica K.",
        location: "London",
        rating: 5,
        text: "Reliable sourcing partner. The power banks sell out quickly at our retail store. Finally a supplier that delivers what they promise at factory-direct prices.",
        product: "Portable Power Banks",
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

async function seedPageTranslations() {
  for (const [slug, perLocale] of Object.entries(pageTranslationsSeed)) {
    const page = await prisma.page.findUnique({
      where: { slug },
      select: { id: true },
    })
    if (!page) continue

    for (const locale of CONTENT_LOCALES) {
      const data = perLocale[locale]
      if (!data) continue
      await prisma.pageTranslation.upsert({
        where: { pageId_locale: { pageId: page.id, locale } },
        update: {},
        create: { pageId: page.id, locale, ...data },
      })
    }
  }
  console.log("Page translations seeded.")
}

async function seedBlogPostTranslations() {
  for (const [slug, perLocale] of Object.entries(blogTranslationsSeed)) {
    const post = await prisma.blogPost.findUnique({
      where: { slug },
      select: { id: true },
    })
    if (!post) continue

    for (const locale of CONTENT_LOCALES) {
      const data = perLocale[locale]
      if (!data) continue
      await prisma.blogPostTranslation.upsert({
        where: { blogPostId_locale: { blogPostId: post.id, locale } },
        update: {},
        create: { blogPostId: post.id, locale, ...data },
      })
    }
  }
  console.log("Blog post translations seeded.")
}

async function seedSiteFaqs() {
  const existing = await prisma.siteFaq.findFirst()
  if (existing) {
    console.log("Site FAQs already exist, skipping translations seed.")
    return
  }

  for (let i = 0; i < faqTranslationsSeed.length; i++) {
    const perLocale = faqTranslationsSeed[i]
    const english = perLocale.en
    if (!english) continue

    const faq = await prisma.siteFaq.create({
      data: {
        sortOrder: i,
        isActive: true,
      },
    })

    for (const [locale, data] of Object.entries(perLocale)) {
      await prisma.siteFaqTranslation.create({
        data: { siteFaqId: faq.id, locale, question: data.q, answer: data.a },
      })
    }
  }
  console.log("Site FAQs seeded.")
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
