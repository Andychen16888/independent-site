import { getTranslations } from "next-intl/server"
import { GENERIC_SITE_URL } from "@/lib/settings/brand"
import { Container } from "@/components/ui/Container"
import { Breadcrumb } from "@/components/ui/Breadcrumb"
import { RfqForm } from "@/components/rfq/RfqForm"
import { generateMetadata as genMeta } from "@/lib/seo/generate-metadata"
import { getSiteSeo } from "@/lib/settings/settings"
import { breadcrumbSchema } from "@/lib/seo/structured-data"

export const revalidate = 3600

interface Props {
  params: Promise<{ locale: string }>
  /** Optional preselection: /quote?product=<id>&name=<product name> */
  searchParams: Promise<{ product?: string; name?: string }>
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "rfq" })
  const seo = await getSiteSeo()
  return genMeta({
    title: t("title"),
    description: t("subtitle"),
    siteName: seo.siteName,
    siteDescription: seo.siteDescription,
    canonical: "/quote",
    locale,
  })
}

export default async function QuotePage({ params, searchParams }: Props) {
  const { locale } = await params
  const { product, name } = await searchParams
  const t = await getTranslations({ locale, namespace: "rfq" })
  const tc = await getTranslations({ locale, namespace: "common" })

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || GENERIC_SITE_URL

  const schema = breadcrumbSchema([
    { name: tc("home"), url: baseUrl },
    { name: t("title"), url: `${baseUrl}/${locale}/quote` },
  ])

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <div className="bg-ivory border-b border-mist">
        <Container className="py-4">
          <Breadcrumb
            items={[
              { label: tc("home"), href: "/" },
              { label: t("title") },
            ]}
          />
        </Container>
      </div>

      <section className="section-padding bg-ivory">
        <Container>
          <div className="grid gap-12 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <h1 className="heading-lg mb-4">{t("title")}</h1>
              <p className="text-body mb-10 max-w-2xl">{t("subtitle")}</p>

              {/*
                A product id in the query string is only honoured when it is a
                real product. The form submits it and the API resolves the
                snapshot server-side, so a bogus id costs nothing here and is
                rejected with a clear message if it is ever sent.
              */}
              <RfqForm productId={product} productName={name} locale={locale} />
            </div>

            <aside className="lg:col-span-1">
              <div className="border border-mist bg-white p-6">
                <h2 className="heading-sm mb-3">{t("sidebarTitle")}</h2>
                <p className="text-sm leading-relaxed text-stone">{t("sidebarBody")}</p>
              </div>
            </aside>
          </div>
        </Container>
      </section>
    </div>
  )
}
