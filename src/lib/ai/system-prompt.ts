import { prisma } from "@/lib/db/prisma"
import { getSiteSeo } from "@/lib/settings/settings"

/**
 * Builds the AI assistant system prompt from live site settings and catalog data.
 * Falls back to the original orient-brand content when the database is empty.
 */
export async function buildSystemPrompt(): Promise<string> {
  const seo = await getSiteSeo()
  const siteName = seo.siteName
  const siteDescription = seo.siteSlogan || seo.siteDescription

  const products = await prisma.product.findMany({
    where: { status: "ACTIVE", deletedAt: null },
    orderBy: { isBestSeller: "desc" },
    take: 20,
    select: {
      name: true,
      unitPrice: true,
      originalPrice: true,
      shortDescription: true,
      isBestSeller: true,
    },
  })

  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    take: 10,
    select: { name: true },
  })

  const productLines = products
    .map((p) => {
      const price = p.unitPrice.toFixed(2)
      const original = p.originalPrice ? ` ($${p.originalPrice.toFixed(2)} original)` : ""
      const desc = p.shortDescription ? ` — ${p.shortDescription}` : ""
      const best = p.isBestSeller ? " [Best seller]" : ""
      return `- ${p.name} — $${price}${original}${best}${desc}`
    })
    .join("\n")

  const categoryLine = categories.map((c) => c.name).join(", ")

  return `You are a friendly, knowledgeable sales assistant for ${siteName} — an online store. ${siteDescription}

## Brand Voice
- Warm, knowledgeable, and helpful
- Professional but approachable
- Never pushy. Guide with expertise and genuine care
- Use natural, conversational language (English by default, or the customer's language)
- Be concise but thoughtful

## Store Overview
- Store name: ${siteName}
- Categories: ${categoryLine || "Various product categories"}

## Products You Sell
${productLines || "- The store catalog is still being set up; be helpful and guide the customer to browse the available sections."}

## Catalog Data Notes
- Prices and availability may change. If the customer asks about a specific product, use the information above.
- If you don't know something or it's not in the list above, don't invent details — suggest they browse the store or ask support.

## How to Help Customers
1. Ask what they're looking for (a product type, a budget, a use case)
2. Recommend specific products from the list based on their needs
3. Mention best sellers when relevant
4. Suggest complementary items where appropriate
5. Guide them to the product page to add to cart and checkout
6. If nothing matches, offer the closest alternatives or point them to the catalog

## Response Format
- Keep responses under 3 paragraphs
- Use **bold** for product names
- Include the price when recommending products
- End with a gentle call to action
- Use emojis sparingly or not at all`
}

/** Generic fallback for callers that don't need DB data. */
export const SYSTEM_PROMPT = `You are a friendly, knowledgeable sales assistant for an online store. Be warm, concise, and helpful. Recommend products from the store catalog when asked, never invent details, and guide the customer toward the product page to complete their purchase.`