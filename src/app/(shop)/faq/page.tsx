import { Container } from "@/components/ui/Container"
import { Breadcrumb } from "@/components/ui/Breadcrumb"
import { generateMetadata } from "@/lib/seo/generate-metadata"
import { breadcrumbSchema, faqPageSchema } from "@/lib/seo/structured-data"
import type { Metadata } from "next"

export const metadata: Metadata = generateMetadata({
  title: "FAQ",
  description: "Frequently asked questions about Oriental Beauty products, shipping, returns, and more. Find answers about peptide skincare, our ingredients, and international shipping.",
  keywords: "faq, skincare questions, shipping information, returns policy, peptide skincare faq",
})

const faqs = [
  {
    q: "What is peptide skincare?",
    a: "Peptide skincare uses short chains of amino acids that signal your skin to produce collagen and elastin. Our multi-weight peptide formulations penetrate at different depths for comprehensive visible results.",
  },
  {
    q: "Are your products cruelty-free?",
    a: "Yes, all Oriental Beauty products are 100% cruelty-free. We never test on animals and partner only with suppliers who share this commitment.",
  },
  {
    q: "How long does shipping take?",
    a: "Standard shipping takes 5-8 business days. Express shipping takes 2-3 business days. Free standard shipping is available on orders over $100.",
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
    a: "Our formulations are designed to be gentle and are free from parabens, sulfates, and synthetic fragrances. However, we recommend patch testing before full application.",
  },
  {
    q: "How do I join the affiliate program?",
    a: "Visit our Affiliate page and submit an application. We review applications within 2-3 business days and offer 5-15% commission on sales.",
  },
]

export default function FAQPage() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://orientalbeauty.com"

  const schemas = [
    breadcrumbSchema([
      { name: "Home", url: baseUrl },
      { name: "FAQ", url: `${baseUrl}/faq` },
    ]),
    faqPageSchema(faqs.map((f) => ({ question: f.q, answer: f.a }))),
  ]

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }}
      />
      <div className="pt-24 md:pt-28 min-h-screen">
        <Container>
          <div className="max-w-3xl mx-auto py-12 md:py-16">
            <Breadcrumb
              items={[{ label: "Home", href: "/" }, { label: "FAQ" }]}
              className="mb-6"
            />
            <span className="text-caption mb-4 block">Support</span>
            <h1 className="heading-xl mb-8">Frequently Asked Questions</h1>

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
          </div>
        </Container>
      </div>
    </>
  )
}
