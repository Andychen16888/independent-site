import { notFound } from "next/navigation"
import { prisma } from "@/lib/db/prisma"
import { Container } from "@/components/ui/Container"
import { Breadcrumb } from "@/components/ui/Breadcrumb"
import { generateMetadata as genMeta } from "@/lib/seo/generate-metadata"
import { getSiteSeo } from "@/lib/settings/settings"
import {
  breadcrumbSchema,
  articleSchema,
  aboutPageSchema,
  contactPageSchema,
} from "@/lib/seo/structured-data"
import type { Metadata } from "next"

interface Props {
  params: Promise<{ slug: string }>
}

async function getPage(slug: string) {
  return prisma.page.findUnique({ where: { slug } })
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const page = await getPage(slug)
  if (!page || !page.isPublished) return {}
  const seo = await getSiteSeo()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://example.com"
  return genMeta({
    title: page.seoTitle || page.title,
    description: page.seoDescription || page.excerpt || "",
    keywords: page.seoKeywords || undefined,
    ogImage: page.coverImage || undefined,
    siteName: seo.siteName,
    siteDescription: seo.siteDescription,
    canonical: `${siteUrl}/pages/${slug}`,
  })
}

export default async function PageView({ params }: Props) {
  const { slug } = await params
  const page = await getPage(slug)
  if (!page || !page.isPublished) notFound()

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://example.com"
  const pageUrl = `${baseUrl}/pages/${slug}`

  const schemas = [
    breadcrumbSchema([
      { name: "Home", url: baseUrl },
      { name: page.title, url: pageUrl },
    ]),
    slug === "about"
      ? aboutPageSchema({ name: page.title, description: page.excerpt || "" })
      : slug === "contact"
        ? contactPageSchema({ name: page.title, description: page.excerpt || "" })
        : articleSchema({
            headline: page.title,
            description: page.excerpt || "",
            image: page.coverImage,
            author: { name: page.title },
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
              { label: "Home", href: "/" },
              { label: page.title },
            ]}
            className="mb-6"
          />
          <h1 className="heading-xl">{page.title}</h1>
          {page.excerpt && <p className="text-body mt-4 max-w-2xl">{page.excerpt}</p>}
        </Container>
      </div>

      <Container className="py-12 md:py-16">
        {page.coverImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={page.coverImage} alt="" className="w-full max-h-96 object-cover mb-10" />
        )}
        <div
          className="page-prose max-w-3xl"
          dangerouslySetInnerHTML={{ __html: page.content }}
        />
      </Container>
    </div>
  )
}