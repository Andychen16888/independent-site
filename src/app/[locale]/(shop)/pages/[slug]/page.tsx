import { notFound } from "next/navigation"
import { prisma } from "@/lib/db/prisma"
import { getTranslations } from "next-intl/server"
import { Container } from "@/components/ui/Container"
import { Breadcrumb } from "@/components/ui/Breadcrumb"
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
      <div className="bg-ivory section-padding">
        <Container>
          <Breadcrumb
            items={[
              { label: tc("home"), href: "/" },
              { label: pageL.title },
            ]}
            className="mb-6"
          />
          <h1 className="heading-xl">{pageL.title}</h1>
          {pageL.excerpt && <p className="text-body mt-4 max-w-2xl">{pageL.excerpt}</p>}
        </Container>
      </div>

      <Container className="py-12 md:py-16">
        {page.coverImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={page.coverImage} alt="" className="w-full max-h-96 object-cover mb-10" />
        )}
        <div
          className="page-prose max-w-3xl"
          dangerouslySetInnerHTML={{ __html: pageL.content || page.content }}
        />
      </Container>
    </div>
  )
}