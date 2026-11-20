import { prisma } from "@/lib/db/prisma"
import { GENERIC_SITE_URL } from "@/lib/settings/brand"
import { getSiteSeo, getSettingsForKeys } from "@/lib/settings/settings"
import { categoryPath } from "@/lib/categories/slug"

/**
 * Builds the AI assistant system prompt from live site settings and catalog data.
 * Enriches the assistant with real product links, currency, shipping/return
 * policies, FAQ and contact details so answers stay accurate.
 */
export async function buildSystemPrompt(): Promise<string> {
  const seo = await getSiteSeo()
  const siteName = seo.siteName
  const siteDescription = seo.siteDescription

  const settings = await getSettingsForKeys([
    "site.currency",
    "shipping.freeThreshold",
    "shipping.standardRate",
    "shipping.standardDays",
    "shipping.expressRate",
    "shipping.expressDays",
    "shipping.returnWindow",
    "contact.hours",
  ])

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || GENERIC_SITE_URL
  const currency = settings["site.currency"] || "USD"

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: { status: "ACTIVE", deletedAt: null },
      orderBy: [{ isBestSeller: "desc" }, { createdAt: "desc" }],
      take: 24,
      select: {
        name: true,
        slug: true,
        brand: true,
        unitPrice: true,
        originalPrice: true,
        shortDescription: true,
        isBestSeller: true,
      },
    }),
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      take: 12,
      select: { name: true, slug: true },
    }),
  ])

  const productLines = products
    .map((p) => {
      const price = p.unitPrice != null ? `${currency} ${p.unitPrice.toFixed(2)}` : "price on request"
      const original = p.originalPrice ? ` (was ${currency} ${p.originalPrice.toFixed(2)})` : ""
      const desc = p.shortDescription ? ` — ${p.shortDescription}` : ""
      const best = p.isBestSeller ? " [Best seller]" : ""
      const link = `${siteUrl}/products/${p.slug}`
      return `- ${p.name} — ${price}${original}${best}${desc} (${link})`
    })
    .join("\n")

  const categoryLine = categories
    .map((c) => `${c.name} (${siteUrl}${categoryPath(c.slug, c.name)})`)
    .join(", ")

  let faqLines = ""
  try {
    const faqRows = await prisma.siteFaq.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: { translations: true },
    })
    const faqs = faqRows
      .map((row) => {
        const en = row.translations.find((t) => t.locale === "en")
        const any = row.translations[0]
        return { q: en?.question || any?.question || "", a: en?.answer || any?.answer || "" }
      })
      .filter((f) => f.q)
    if (faqs.length > 0) {
      faqLines = faqs
        .slice(0, 5)
        .map((f) => `Q: ${f.q}\nA: ${f.a}`)
        .join("\n\n")
    }
  } catch {}

  const policyLines = [
    settings["shipping.freeThreshold"]
      ? `- Free standard shipping on orders over ${currency} ${settings["shipping.freeThreshold"]}.`
      : "",
    settings["shipping.standardDays"]
      ? `- Standard delivery: ~${settings["shipping.standardDays"]} days.`
      : "",
    settings["shipping.expressDays"] ? `- Express delivery: ~${settings["shipping.expressDays"]} days.` : "",
    settings["shipping.returnWindow"]
      ? `- Returns accepted within ${settings["shipping.returnWindow"]} days.`
      : "",
  ]
    .filter(Boolean)
    .join("\n")

  const contactLines = [
    seo.contactEmail ? `- Email: ${seo.contactEmail}` : "",
    seo.contactPhone ? `- Phone: ${seo.contactPhone}` : "",
    settings["contact.hours"] ? `- Business hours: ${settings["contact.hours"]}` : "",
  ]
    .filter(Boolean)
    .join("\n")

  return `You are a knowledgeable sourcing and trade assistant for ${siteName}. ${siteDescription}

## Brand & Positioning
- ${siteName} is a Chinese trading house, not a manufacturer: it connects Chinese state-owned enterprises, listed companies and large enterprises with overseas buyers — especially small and mid-sized importers in Southeast Asia, Africa and Belt & Road markets.
- 20 years of export experience, AAA credit rating, long-standing business ties with well-known companies worldwide, and deliberately low service fees (customers pay for goods and freight, not inflated margins).
- If a customer asks about a commodity NOT listed on the site or in the catalog below, respond helpfully: invite them to send the product name, grade, specification, quantity and destination port via the contact form, email or this chat, and explain that we confirm availability and pricing quickly.
- Core lines: carbon black, PVC resin, PP, PE, titanium dioxide, zinc oxide, quartz sand, barite, talc, calcium carbonate, barium sulfate, iron oxide pigments, wollastonite, fluorite, copper, aluminum, steel, cement clinker, float glass and building ceramics.
- Store URL: ${siteUrl}

## Categories
- ${categoryLine || "Various product categories"}

## Products You Sell
${productLines || "- The catalog is still being set up; guide the customer to browse ${siteUrl}/products or send their requirement for a commodity not listed."}

## Policies
${policyLines || "- No specific policies provided; do not invent them."}
Wholesale / B2B inquiries: guide the customer to request a quote via the contact form or email — we quote product price plus freight with lean service fees.

## FAQ (from the store)
${faqLines || "- No FAQ available."}

## Contact & Support
${contactLines || "- Contact details unavailable."}

## Rules
1. Recommend products ONLY from the list above, using their exact names, prices and links.
2. Always include the product link when recommending (plain URL text, not markdown).
3. Never invent products, prices, shipping times, or policies not listed above.
4. For commodities NOT listed, never claim to have them in stock — instead offer a fast quote, and ask for grade, quantity and destination port.
5. If unsure, admit it and direct the customer to browse ${siteUrl}/products or contact support.
6. Respond in the customer's language (English by default).
7. Keep responses under 3 short paragraphs. Use **bold** for product names.
8. Be concise and professional, never pushy. End with a gentle call to action.
9. Use emojis sparingly or not at all.`
}

/** Generic fallback for callers that don't need DB data. */
export const SYSTEM_PROMPT = `You are a friendly, knowledgeable sales assistant for an online store. Be warm, concise, and helpful. Recommend products from the store catalog when asked, never invent details, and guide the customer toward the product page to complete their purchase.`