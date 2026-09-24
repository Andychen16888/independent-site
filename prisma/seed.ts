import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"
import { pageTranslationsSeed } from "./seed-data/pages"
import { blogTranslationsSeed } from "./seed-data/blog"
import { faqTranslationsSeed } from "./seed-data/faq"
import { commodityCategoriesSeed, commodityProductsSeed } from "./seed-data/commodities"
import { commodityBlogPostsSeed } from "./seed-data/blog-commodity"
import { commodityFaqsSeed } from "./seed-data/faq-commodity"

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
    const rows = await prisma.menu.findMany({
      where: { url: menu.url },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    })
    if (rows.length === 0) {
      await prisma.menu.create({ data: menu })
      console.log(`Menu created: ${menu.label}`)
    } else if (rows.length > 1) {
      const extraIds = rows.slice(1).map((r) => r.id)
      await prisma.menu.deleteMany({ where: { id: { in: extraIds } } })
      console.log(`Menu cleaned: removed ${extraIds.length} duplicate(s) for ${menu.url}`)
    }
  }

  await seedDefaultPages()
  await seedPageTranslations()
  await seedCommodityCategories()
  await seedCommodityProducts()
  await seedDefaultBlogPosts()
  await seedCommodityBlogPosts()
  await seedBlogPostTranslations()
  await seedSiteFaqs()

  console.log("Seeding complete.")
}

async function seedSiteSettings() {
  const settings: Record<string, string> = {
    "site.name": "Commodities From China",
    "site.slogan": "Chinese supply, connected to your market",
    "site.description": "A China trading house connecting SOEs, listed companies and large enterprises with overseas buyers \u2014 exporting bulk commodities, metals and building materials to Southeast Asia, Africa and Belt & Road markets for 20 years.",
    "site.logo": "",
    "site.favicon": "",
    "site.language": "en",
    "site.currency": "USD",
    "site.promoBar": "20 Years of China Export Experience \u2014 Request a Quote Today",
    "seo.homeTitle": "Commodities From China | Bulk Commodities, Metals & Building Materials",
    "seo.homeDescription": "Chinese trading house exporting bulk commodities and building materials to Southeast Asia, Africa and Belt & Road markets. Carbon black, PVC, PP, PE, titanium dioxide, minerals, copper, aluminum, steel, cement clinker, glass and ceramics. 20 years of export experience, AAA credit, cheap service fees. Request a quote.",
    "seo.defaultKeywords": "bulk commodities china, commodity trading house, pvc resin wholesale, carbon black export, titanium dioxide, industrial minerals, cement clinker, steel export, b2b commodity supplier, belt and road trade",
    "content.featuredEyebrow": "Commodities We Export",
    "content.featuredHeading": "Bulk Products for Growing Markets",
    "content.featuredTagline": "Carbon black, PVC, polymers, minerals, metals and building materials for Southeast Asia, Africa and Belt & Road buyers.",
    "content.brandStory": JSON.stringify({
      eyebrow: "Our Story",
      title: "20 Years Connecting Chinese Industry with Global Buyers",
      paragraphs: [
        "We are a Chinese trading house that bridges the country's leading enterprises \u2014 state-owned groups, listed companies and large manufacturers \u2014 with overseas buyers in Southeast Asia, Africa and other Belt & Road markets.",
        "In two decades of exports we've built lasting business ties with well-known companies worldwide, earned an AAA credit rating, and kept our service fees lean. For commodities not listed here, just send us your requirement \u2014 we respond fast with quality, cost-effective supply.",
      ],
      ctaLabel: "Read Our Story",
      ctaHref: "/pages/about",
    }),
    "content.promo1": JSON.stringify({
      eyebrow: "Why Work With Us",
      title: "Your Cost-Effective Sourcing Partner",
      body: "We connect Chinese SOEs, listed companies and large enterprises with overseas buyers \u2014 charging lean service fees, responding fast, and delivering quality commodities at competitive prices.",
      features: [
        { title: "Cheap Service Fees", description: "Lean, transparent charges \u2014 you pay for the goods and freight, not inflated margins" },
        { title: "Factory Access at Scale", description: "Direct cooperation with Chinese state-owned, listed and major enterprises" },
        { title: "Fast Response to Any Inquiry", description: "Commodity not listed? Send your requirement and we respond quickly" },
        { title: "20 Years, AAA Credit", description: "Two decades of exports, trusted by well-known companies worldwide" },
      ],
      ctaLabel: "View All Products",
      ctaHref: "/products",
    }),
    "content.promo2": JSON.stringify({
      eyebrow: "Commodities We Export",
      title: "Bulk Products for Growing Markets",
      tagline: "Fast-growing commodity lines for importers and distributors across Southeast Asia, Africa and other Belt & Road economies.",
      collections: [
        { title: "Chemical & Polymer", description: "Carbon black, PVC, PP, PE, titanium dioxide and zinc oxide", href: "/categories/chemical-products" },
        { title: "Minerals & Powders", description: "Quartz sand, barite, talc, calcium carbonate and more", href: "/categories/minerals" },
        { title: "Metals", description: "Copper, aluminum and steel for industry and construction", href: "/categories/metal-products" },
        { title: "Building Materials", description: "Cement clinker, float glass and building ceramics", href: "/categories/building-materials" },
      ],
      ctaLabel: "View All Products",
      ctaHref: "/products",
    }),
    "content.testimonials": JSON.stringify([
      {
        name: "Siti Rahayu",
        location: "Jakarta, Indonesia",
        rating: 5,
        text: "We import carbon black and PVC resin for our plastic manufacturing lines. Consistent quality, honest pricing, and the team responds to every enquiry within hours.",
        product: "Carbon Black & PVC Resin",
      },
      {
        name: "Kevin Okafor",
        location: "Lagos, Nigeria",
        rating: 5,
        text: "They quoted our aluminum and steel order quickly, handled all export documentation, and the goods arrived exactly to spec. Their 20 years of experience show in every shipment.",
        product: "Aluminum & Steel",
      },
      {
        name: "Nguyen Thanh",
        location: "Ho Chi Minh City, Vietnam",
        rating: 5,
        text: "I requested a commodity that wasn't on their site \u2014 cement clinker for our trading business. They responded fast and sourced it from a major Chinese supplier.",
        product: "Cement Clinker",
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
        q: "Are you a manufacturer or a trading company?",
        a: "We are a China trading house, not a manufacturer. We connect Chinese state-owned enterprises, listed companies and large manufacturers with overseas buyers \u2014 especially small and mid-sized importers \u2014 and handle sourcing, contracts, inspection and export documentation for you.",
      },
      {
        q: "What are your service fees?",
        a: "Our service fees are deliberately low. You pay for the goods and the freight; trading fees are lean, transparent and quoted up front, so there are no surprise margins hidden in the price.",
      },
      {
        q: "The commodity I need isn't listed on your site. Can you still supply it?",
        a: "Yes. Send us the product name, grade, specification, quantity and destination port. Our supply relationships are much wider than the online catalog and we will confirm availability and pricing quickly.",
      },
      {
        q: "Do you work with small buyers?",
        a: "Absolutely. Our focus is connecting China's large enterprises with overseas small and mid-sized customers. No minimum importer size \u2014 we adapt volumes to your needs.",
      },
    ]),
  }

  for (const [key, value] of Object.entries(settings)) {
    const existing = await prisma.siteSetting.findUnique({ where: { key } })
    if (!existing) {
      await prisma.siteSetting.create({ data: { key, value } })
      console.log(`Site setting created: ${key}`)
      continue
    }
    if (isOldPositioningDefault(key, existing.value)) {
      await prisma.siteSetting.update({ where: { key }, data: { value } })
      console.log(`Site setting upgraded: ${key}`)
    }
  }
  console.log("Site settings seeded.")
}

/**
 * Detects whether a stored setting still holds the pre-repositioning default
 * (electronics/kitchenware copy). If so the seed may safely overwrite it with
 * the new commodity-trading-house copy; any setting that has been customized
 * in the admin panel is left untouched.
 */
function isOldPositioningDefault(key: string, value: string): boolean {
  const jsonHas = (pred: (parsed: unknown) => boolean) => {
    try {
      return pred(JSON.parse(value))
    } catch {
      return false
    }
  }
  switch (key) {
    case "site.slogan":
      return value === "Sourced from China, delivered worldwide"
    case "site.description":
      return value.startsWith("Direct sourcing from trusted Chinese factories. Quality electronics")
    case "site.promoBar":
      return value === "New customers save 10%"
    case "seo.homeTitle":
      return value.includes("Wholesale Electronics & Daily Commodities")
    case "seo.homeDescription":
      return value.startsWith("Factory-direct sourcing from China for retail and wholesale B2B buyers")
    case "seo.defaultKeywords":
      return value.includes("led lighting wholesale")
    case "content.featuredEyebrow":
      return value === "Explore"
    case "content.featuredHeading":
      return value === "Our Collections"
    case "content.featuredTagline":
      return value === "Factory-direct sourcing, quality goods, worldwide delivery"
    case "content.brandStory":
      return jsonHas((o) => (o as { title?: string }).title === "From China to the World")
    case "content.promo1":
      return jsonHas((o) => (o as { title?: string }).title === "Quality Electronics")
    case "content.promo2":
      return jsonHas((o) => (o as { title?: string }).title === "Home & Kitchen")
    case "content.testimonials":
      return jsonHas((arr) => Array.isArray(arr) && (arr as { name?: string }[]).some((t) => t.name === "Sarah M."))
    case "content.faq":
      return jsonHas((arr) => Array.isArray(arr) && (arr as { q?: string }[]).some((f) => (f.q || "").includes("minimum order quantity")))
    default:
      return false
  }
}

const defaultPages: { title: string; slug: string; excerpt: string; content: string; seoTitle: string; seoDescription: string; seoKeywords: string }[] = [
  {
    title: "About Us",
    slug: "about",
    excerpt: "A Chinese trading house connecting large enterprises with overseas buyers for 20 years.",
    content: `<h1>About Us</h1><p>We are a China trading house with 20 years of export experience. Our business connects the country's leading enterprises \u2014 state-owned groups, listed companies and large manufacturers \u2014 with overseas buyers, especially small and mid-sized importers in Southeast Asia, Africa and other Belt &amp; Road markets.</p><p>We keep our service fees lean, respond quickly to every inquiry \u2014 including commodities not listed on our site \u2014 and deliver quality, cost-effective goods backed by an AAA credit rating and long-standing relationships with well-known companies worldwide.</p>`,
    seoTitle: "About Us",
    seoDescription: "A Chinese trading house with 20 years of export experience connecting state-owned enterprises, listed companies and large manufacturers with overseas buyers.",
    seoKeywords: "about us, commodity trading house, china export, b2b trading",
  },
  {
    title: "Contact Us",
    slug: "contact",
    excerpt: "Get in touch — we respond within 24 hours.",
    content: `<h1>Contact Us</h1><p>We'd love to hear from you — whether you're shopping retail or need a wholesale quote. Send us a message and we'll respond within 24 hours.</p>`,
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
    if (!existing) {
      await prisma.page.create({
        data: { ...page, isPublished: true },
      })
      console.log(`Page created: ${page.slug}`)
      continue
    }
    if (
      page.slug === "about" &&
      existing.excerpt === "Our story — sourcing quality goods from China for the world."
    ) {
      await prisma.page.update({
        where: { slug: page.slug },
        data: {
          title: page.title,
          excerpt: page.excerpt,
          content: page.content,
          seoTitle: page.seoTitle,
          seoDescription: page.seoDescription,
          seoKeywords: page.seoKeywords,
        },
      })
      console.log("About page upgraded to commodity positioning.")
    }
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
      const where = { blogPostId_locale: { blogPostId: post.id, locale } }
      const existing = await prisma.blogPostTranslation.findUnique({ where })
      if (!existing) {
        await prisma.blogPostTranslation.create({
          data: { blogPostId: post.id, locale, ...data },
        })
        continue
      }
      // Preserve admin-edited title/excerpt/SEO, but backfill a missing article body.
      if (data.content && !existing.content) {
        await prisma.blogPostTranslation.update({ where, data: { content: data.content } })
      }
    }
  }
  console.log("Blog post translations seeded.")
}

async function seedCommodityCategories() {
  for (const cat of commodityCategoriesSeed) {
    const existing = await prisma.category.findUnique({ where: { slug: cat.slug } })
    if (existing) {
      if (existing.isFeatured !== true || existing.isActive !== true) {
        await prisma.category.update({
          where: { slug: cat.slug },
          data: { isFeatured: true, isActive: true },
        })
      }
      continue
    }
    await prisma.category.create({ data: { ...cat } })
    console.log(`Category created: ${cat.slug}`)
  }
}

async function seedCommodityProducts() {
  const slugToId = new Map<string, string>()
  for (const c of commodityCategoriesSeed) {
    const row = await prisma.category.findUnique({ where: { slug: c.slug }, select: { id: true } })
    if (row) slugToId.set(c.slug, row.id)
  }

  for (const p of commodityProductsSeed) {
    const existing = await prisma.product.findUnique({ where: { slug: p.slug } })
    if (existing) continue

    const categoryId = slugToId.get(p.categorySlug)
    await prisma.product.create({
      data: {
        name: p.name,
        slug: p.slug,
        sku: p.sku,
        shortDescription: p.shortDescription,
        description: p.description,
        unitPrice: p.unitPrice,
        originalPrice: p.originalPrice,
        currency: "USD",
        stock: 0,
        status: "ACTIVE",
        isFeatured: p.isFeatured,
        isBestSeller: p.isBestSeller,
        isNew: p.isNew,
        isHomeFeatured: p.isHomeFeatured,
        sortOrder: p.sortOrder,
        tags: p.tags,
        seoTitle: p.seoTitle,
        seoDescription: p.seoDescription,
        seoKeywords: p.seoKeywords,
        categories: categoryId ? { create: [{ categoryId }] } : undefined,
      },
    })
    console.log(`Product created: ${p.slug}`)
  }
}

async function seedCommodityBlogPosts() {
  for (const post of commodityBlogPostsSeed) {
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

async function seedSiteFaqs() {
  const allFaqs = [...faqTranslationsSeed, ...commodityFaqsSeed]

  let createdCount = 0
  for (let i = 0; i < allFaqs.length; i++) {
    const perLocale = allFaqs[i]
    const english = perLocale.en
    if (!english) continue

    const exists = await prisma.siteFaqTranslation.findFirst({
      where: { locale: "en", question: english.q },
      select: { id: true },
    })
    if (exists) continue

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
    createdCount++
  }
  console.log(`Site FAQs ensured. ${createdCount} new FAQ(s) created.`)
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
