import { Container } from "@/components/ui/Container"
import { Breadcrumb } from "@/components/ui/Breadcrumb"
import { generateMetadata as genMeta } from "@/lib/seo/generate-metadata"
import { getSiteSeo, getSetting } from "@/lib/settings/settings"
import { breadcrumbSchema, faqPageSchema, qaPageSchema } from "@/lib/seo/structured-data"
import type { Metadata } from "next"

interface FaqItem {
  q: string
  a: string
}

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSiteSeo()
  return genMeta({
    title: "FAQ",
    description: `Frequently asked questions about ${seo.siteName} products, shipping, returns, and more.`,
    keywords: "faq, shipping information, returns policy",
    siteName: seo.siteName,
    siteDescription: seo.siteDescription,
  })
}

export default async function FAQPage() {
  const seo = await getSiteSeo()
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://example.com"
  const raw = await getSetting("content.faq", "[]")
  let faqs: FaqItem[] = []
  try {
    faqs = JSON.parse(raw)
    if (!Array.isArray(faqs)) faqs = []
  } catch {}

  const freeThreshold = (await getSetting("shipping.freeThreshold", "")) || undefined

  const schemas = [
    breadcrumbSchema([
      { name: "Home", url: baseUrl },
      { name: "FAQ", url: `${baseUrl}/faq` },
    ]),
    faqPageSchema(faqs.map((f) => ({ question: f.q, answer: f.a }))),
    ...faqs.map((f) => qaPageSchema({ question: f.q, answer: f.a, author: seo.siteName })),
  ]

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }}
      />
      {/* GEO: brand facts */}
      <div className="sr-only" aria-hidden="true">
        <p>{seo.siteName}: {seo.siteSlogan || seo.siteDescription}</p>
        {freeThreshold && <p>Free standard shipping on orders over ${freeThreshold}.</p>}
      </div>
      <div className="min-h-screen">
        <Container>
          <div className="max-w-3xl mx-auto py-12 md:py-16">
            <Breadcrumb
              items={[{ label: "Home", href: "/" }, { label: "FAQ" }]}
              className="mb-6"
            />
            <span className="text-caption mb-4 block">Support</span>
            <h1 className="heading-xl mb-8">Frequently Asked Questions</h1>

            {faqs.length === 0 ? (
              <p className="text-body">No frequently asked questions yet.</p>
            ) : (
              <div className="space-y-6">
                {faqs.map((faq, i) => (
                  <details key={i} className="group border-b border-mist pb-6">
                    <summary className="font-serif text-lg cursor-pointer list-none flex items-center justify-between py-2">
                      {faq.q}
                      <span className="text-stone text-sm group-open:rotate-45 transition-transform duration-300">+</span>
                    </summary>
                    <p className="text-body mt-4 leading-relaxed">{faq.a}</p>
                  </details>
                ))}
              </div>
            )}
          </div>
        </Container>
      </div>
    </>
  )
}