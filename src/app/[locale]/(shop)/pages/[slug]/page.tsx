import { notFound } from "next/navigation"
import { prisma } from "@/lib/db/prisma"
import { getTranslations } from "next-intl/server"
import { Container } from "@/components/ui/Container"
import { Breadcrumb } from "@/components/ui/Breadcrumb"
import { SmartImage } from "@/components/ui/SmartImage"
import { SupplyChain } from "@/components/home/SupplyChain"
import { getGroupedSiteImages } from "@/lib/settings/site-images"
import { getSiteContent } from "@/config/site-content"
import { generateMetadata as genMeta } from "@/lib/seo/generate-metadata"
import { getSiteSeo } from "@/lib/settings/settings"
import { fetchPageTranslations, applyPageLocalization } from "@/lib/i18n/content"
import {
  breadcrumbSchema,
  articleSchema,
  aboutPageSchema,
  contactPageSchema,
} from "@/lib/seo/structured-data"
import type { Metadata } from "next"

interface Props {
  params: Promise<{ slug: string; locale: string }>
}

async function getPage(slug: string) {
  return prisma.page.findUnique({ where: { slug } })
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = await params
  const page = await getPage(slug)
  if (!page || !page.isPublished) return {}
  const [translations] = await Promise.all([
    fetchPageTranslations([page.id], locale),
  ])
  const pageL = applyPageLocalization(page, translations)
  const seo = await getSiteSeo()
  return genMeta({
    title: pageL.seoTitle || pageL.title,
    description: pageL.seoDescription || pageL.excerpt || "",
    keywords: pageL.seoKeywords || undefined,
    ogImage: page.coverImage || undefined,
    siteName: seo.siteName,
    siteDescription: seo.siteDescription,
    canonical: `/pages/${slug}`,
    locale,
  })
}

export default async function PageView({ params }: Props) {
  const { slug, locale } = await params
  const page = await getPage(slug)
  if (!page || !page.isPublished) notFound()
  const [translations] = await Promise.all([
    fetchPageTranslations([page.id], locale),
  ])
  const pageL = applyPageLocalization(page, translations)

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://commoditychina.com"
  const pageUrl = `${baseUrl}/${locale}/pages/${slug}`
  const tc = await getTranslations("common")
  const site = getSiteContent(locale)
  const siteImages = await getGroupedSiteImages()

  const isAbout = slug === "about"
  const isContact = slug === "contact"
  const heroAsset = isAbout ? siteImages.about[2] : isContact ? siteImages.about[3] : null

  const schemas = [
    breadcrumbSchema([
      { name: tc("home"), url: baseUrl },
      { name: pageL.title, url: pageUrl },
    ]),
    slug === "about"
      ? aboutPageSchema({ name: pageL.title, description: pageL.excerpt || "" })
      : slug === "contact"
        ? contactPageSchema({ name: pageL.title, description: pageL.excerpt || "" })
        : articleSchema({
            headline: pageL.title,
            description: pageL.excerpt || "",
            image: page.coverImage,
            author: { name: pageL.title },
            datePublished: page.createdAt.toISOString(),
            dateModified: (page.updatedAt || page.createdAt).toISOString(),
            url: pageUrl,
          }),
  ]

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }}
      />

      <div className="bg-ivory border-b border-mist">
        <Container className="py-4">
          <Breadcrumb
            items={[
              { label: tc("home"), href: "/" },
              { label: pageL.title },
            ]}
          />
        </Container>
      </div>

      {heroAsset ? (
        <section className="relative min-h-[320px] md:min-h-[420px] flex items-end overflow-hidden bg-navy">
          <SmartImage
            src={heroAsset.src}
            alt={heroAsset.alt}
            tone={heroAsset.tone}
            sizes="100vw"
            priority
            overlay
          />
          <Container className="relative pt-28 pb-12 md:pb-16">
            <h1 className="heading-xl text-white mb-4 max-w-3xl text-balance">{pageL.title}</h1>
            {pageL.excerpt && (
              <p className="text-white/80 leading-relaxed max-w-2xl text-sm md:text-base">
                {pageL.excerpt}
              </p>
            )}
          </Container>
        </section>
      ) : (
        <div className="bg-ivory section-padding">
          <Container>
            <h1 className="heading-xl">{pageL.title}</h1>
            {pageL.excerpt && <p className="text-body mt-4 max-w-2xl">{pageL.excerpt}</p>}
          </Container>
        </div>
      )}

      <Container className="py-12 md:py-16">
        {page.coverImage && (
          <div className="relative aspect-[21/9] rounded-lg overflow-hidden mb-10 border border-mist">
            <SmartImage src={page.coverImage} alt={pageL.title} sizes="100vw" />
          </div>
        )}
        <div
          className="page-prose max-w-3xl"
          dangerouslySetInnerHTML={{ __html: pageL.content || page.content }}
        />
      </Container>

      {isAbout && <SupplyChain content={site.supplyChain} images={siteImages.supplyChain} />}
    </div>
  )
}
