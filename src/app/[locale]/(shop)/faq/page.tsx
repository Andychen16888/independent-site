import { getTranslations } from "next-intl/server"
import { GENERIC_SITE_URL } from "@/lib/settings/brand"
import { Container } from "@/components/ui/Container"
import { Breadcrumb } from "@/components/ui/Breadcrumb"
import { generateMetadata as genMeta } from "@/lib/seo/generate-metadata"
import { getSiteSeo, getSetting } from "@/lib/settings/settings"
import { fetchLocalizedFaqs } from "@/lib/i18n/content"
import { breadcrumbSchema, faqPageSchema, qaPageSchema } from "@/lib/seo/structured-data"
import type { Metadata } from "next"

export const revalidate = 3600

interface FaqItem {
  q: string
  a: string
}

interface Props {
  params: Promise<{ slug: string; locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const seo = await getSiteSeo()
  const t = await getTranslations({ locale, namespace: "faq" })
  return genMeta({
    title: t("title"),
    description: t("metaDescription", { siteName: seo.siteName }),
    keywords: "faq, shipping information, returns policy",
    siteName: seo.siteName,
    siteDescription: seo.siteDescription,
    canonical: "/faq",
    locale,
  })
}

export default async function FAQPage({ params }: Props) {
  const { locale } = await params
  const seo = await getSiteSeo()
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || GENERIC_SITE_URL

  // FAQ content is stored per-locale via SiteFaq + SiteFaqTranslation tables.
  const faqs: FaqItem[] = (await fetchLocalizedFaqs(locale)).map((f) => ({ q: f.question, a: f.answer }))

  const freeThreshold = (await getSetting("shipping.freeThreshold", "")) || undefined
  const t = await getTranslations("faq")
  const tc = await getTranslations("common")

  const schemas = [
    breadcrumbSchema([
      { name: tc("home"), url: baseUrl },
      { name: t("title"), url: `${baseUrl}/${locale}/faq` },
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
        <p>{seo.siteName}: {seo.siteDescription}</p>
        {freeThreshold && <p>{t("freeShippingNote", { amount: `$${freeThreshold}` })}</p>}
      </div>
      <div className="min-h-screen">
        <Container>
          <div className="max-w-3xl mx-auto py-12 md:py-16">
            <Breadcrumb
              items={[{ label: tc("home"), href: "/" }, { label: t("title") }]}
              className="mb-6"
            />
            <span className="text-caption mb-4 block">{t("eyebrow")}</span>
            <h1 className="mb-8 font-sans font-semibold tracking-tight text-charcoal leading-[1.05] whitespace-nowrap text-[clamp(1.375rem,4.5vw,3rem)]">
              {t("title")}
            </h1>

            {faqs.length === 0 ? (
              <p className="text-body">{t("noFaqs")}</p>
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