import { prisma } from "@/lib/db/prisma"
import { getSiteSeo, getSettingsForKeys } from "@/lib/settings/settings"

/**
 * Builds the AI assistant system prompt from live site settings and catalog data.
 * Enriches the assistant with real product links, currency, shipping/return
 * policies, FAQ and contact details so answers stay accurate.
 */
export async function buildSystemPrompt(): Promise<string> {
  const seo = await getSiteSeo()
  const siteName = seo.siteName
  const siteDescription = seo.siteSlogan || seo.siteDescription

  const settings = await getSettingsForKeys([
    "site.currency",
    "shipping.freeThreshold",
    "shipping.standardRate",
    "shipping.standardDays",
    "shipping.expressRate",
    "shipping.expressDays",
    "shipping.returnWindow",
    "contact.hours",
    "content.faq",
  ])

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://commoditychina.com"
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
      const price = p.unitPrice.toFixed(2)
      const original = p.originalPrice ? ` (was ${currency} ${p.originalPrice.toFixed(2)})` : ""
      const desc = p.shortDescription ? ` — ${p.shortDescription}` : ""
      const best = p.isBestSeller ? " [Best seller]" : ""
      const link = `${siteUrl}/products/${p.slug}`
      return `- ${p.name} — ${currency} ${price}${original}${best}${desc} (${link})`
    })
    .join("\n")

  const categoryLine = categories
    .map((c) => `${c.name} (${siteUrl}/categories/${c.slug})`)
    .join(", ")

  let faqLines = ""
  try {
    const faqs = JSON.parse(settings["content.faq"] || "[]") as { q: string; a: string }[]
    if (Array.isArray(faqs) && faqs.length > 0) {
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

  return `You are a friendly, knowledgeable sales and customer-service assistant for ${siteName}. ${siteDescription}

## Brand & Store
- Store name: ${siteName}
- Store URL: ${siteUrl}
- Categories: ${categoryLine || "Various product categories"}

## Products You Sell
${productLines || "- The store catalog is still being set up; help the customer browse the available sections."}

## Policies
${policyLines || "- No specific policies provided; do not invent them."}
Wholesale / B2B inquiries: guide the customer to the Affiliate Program page (${siteUrl}/affiliate) or to contact support for bulk pricing.

## FAQ (from the store)
${faqLines || "- No FAQ available."}

## Contact & Support
${contactLines || "- Contact details unavailable."}

## Rules
1. Recommend products ONLY from the list above, using their exact names, prices and links.
2. Always include the product link when recommending (plain URL text, not markdown).
3. Never invent products, prices, shipping times, or policies not listed above.
4. If unsure, admit it and direct the customer to browse ${siteUrl}/products or contact support.
5. Respond in the customer's language (English by default).
6. Keep responses under 3 short paragraphs. Use **bold** for product names.
7. Be concise and warm, never pushy. End with a gentle call to action.
8. Use emojis sparingly or not at all.`
}

/** Generic fallback for callers that don't need DB data. */
export const SYSTEM_PROMPT = `You are a friendly, knowledgeable sales assistant for an online store. Be warm, concise, and helpful. Recommend products from the store catalog when asked, never invent details, and guide the customer toward the product page to complete their purchase.`