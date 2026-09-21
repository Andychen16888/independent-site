import { notFound } from "next/navigation"
import { prisma } from "@/lib/db/prisma"
import { getTranslations } from "next-intl/server"
import { Container } from "@/components/ui/Container"
import { Breadcrumb } from "@/components/ui/Breadcrumb"
import { ProductDetail } from "@/components/product/ProductDetail"
import { ProductCarousel } from "@/components/product/ProductCarousel"
import { generateMetadata as genMeta } from "@/lib/seo/generate-metadata"
import { getSiteSeo } from "@/lib/settings/settings"
import { breadcrumbSchema, productSchema, videoObjectSchema, articleSchema, faqPageSchema } from "@/lib/seo/structured-data"
import { fetchProductTranslations, applyProductLocalization, applyProductLocalizations } from "@/lib/i18n/product"
import type { Metadata } from "next"

interface Props {
  params: Promise<{ slug: string; locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = await params
  const product = await prisma.product.findFirst({
    where: { slug },
    select: { id: true, name: true, slug: true, shortDescription: true, description: true, brand: true, images: { take: 1 } },
  })
  if (!product) return {}
  const translationMap = await fetchProductTranslations([product.id], locale)
  const localized = applyProductLocalization(product, translationMap)
  const seo = await getSiteSeo()
  return genMeta({
    title: localized.name,
    description: (localized.shortDescription || localized.description || "").replace(/<[^>]*>/g, ""),
    keywords: `${localized.name}, ${localized.brand || ""}, ${seo.siteName}`,
    ogImage: product.images?.[0]?.url,
    ogType: "product",
    siteName: seo.siteName,
    siteDescription: seo.siteDescription,
    canonical: `/products/${product.slug}`,
    locale,
  })
}

export default async function ProductPage({ params }: Props) {
  const { slug, locale } = await params
  const t = await getTranslations("product")
  const tp = await getTranslations("products")
  const tc = await getTranslations("common")

  const product = await prisma.product.findFirst({
    where: { slug },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      videos: { orderBy: { sortOrder: "asc" } },
      parameters: true,
      faqs: { orderBy: { sortOrder: "asc" } },
      reviews: {
        include: { user: { select: { firstName: true, lastName: true } }, images: true },
        orderBy: { createdAt: "desc" },
      },
    },
  })

  if (!product) notFound()

  const translationMap = await fetchProductTranslations([product.id], locale)
  const localizedProduct = applyProductLocalization(product, translationMap)

  const reviewList = product.reviews.map((r) => ({
    id: r.id,
    rating: r.rating,
    title: r.title,
    content: r.content,
    isVerified: r.isVerified,
    user: { firstName: r.user.firstName, lastName: r.user.lastName },
    images: r.images.map((img) => ({ url: img.url })),
    createdAt: r.createdAt,
  }))
  const reviewTotal = reviewList.length
  const reviewStats = {
    average: reviewTotal ? reviewList.reduce((sum, r) => sum + r.rating, 0) / reviewTotal : 0,
    total: reviewTotal,
    distribution: reviewList.reduce((acc, r) => {
      acc[r.rating] = (acc[r.rating] || 0) + 1
      return acc
    }, {} as Record<number, number>),
  }

  const serializedProduct = {
    ...localizedProduct,
    unitPrice: product.unitPrice != null ? Number(product.unitPrice) : null,
    originalPrice: product.originalPrice ? Number(product.originalPrice) : null,
    reviews: reviewList,
    reviewStats,
  }

  const relatedProducts = (await prisma.product.findMany({
    where: { status: "ACTIVE", id: { not: product.id } },
    take: 10,
    orderBy: { createdAt: "desc" },
    include: { images: { take: 1 } },
  })).map((p) => ({
    ...p,
    unitPrice: p.unitPrice != null ? Number(p.unitPrice) : null,
    originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
  }))

  const relatedMap = await fetchProductTranslations(relatedProducts.map((p) => p.id), locale)
  const localizedRelated = applyProductLocalizations(relatedProducts, relatedMap)

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://commoditychina.com"
  const productUrl = `${baseUrl}/${locale}/products/${serializedProduct.slug}`

  const schemas = [
    breadcrumbSchema([
      { name: tc("home"), url: baseUrl },
      { name: tp("title"), url: `${baseUrl}/${locale}/products` },
      { name: serializedProduct.name, url: productUrl },
    ]),
    productSchema({
      ...serializedProduct,
      url: productUrl,
      currency: serializedProduct.currency,
      images: serializedProduct.images,
      reviews: serializedProduct.reviews,
    }),
    articleSchema({
      headline: serializedProduct.name,
      description: (serializedProduct.shortDescription || serializedProduct.description || "").replace(/<[^>]*>/g, ""),
      author: { name: serializedProduct.brand || serializedProduct.name },
      datePublished: serializedProduct.createdAt.toISOString(),
      image: serializedProduct.images?.[0]?.url,
      url: productUrl,
      articleSection: "Products",
      keywords: `${serializedProduct.name}, wholesale, electronics, kitchenware, ${serializedProduct.brand || ""}`,
    }),
    ...(serializedProduct.videos?.length
      ? serializedProduct.videos.map((v, i) => videoObjectSchema({
          name: v.title || `${serializedProduct.name} Video`,
          description: `Product demonstration and application guide for ${serializedProduct.name}`,
          contentUrl: v.url,
          uploadDate: serializedProduct.createdAt.toISOString(),
          duration: "PT2M",
        }))
      : []),
    ...(serializedProduct.faqs && serializedProduct.faqs.length > 0
      ? [faqPageSchema(
          serializedProduct.faqs.map((f) => ({ question: f.question, answer: f.answer }))
        )]
      : []),
  ]

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }}
      />
      <div>
        <Container>
          <Breadcrumb
            items={[
              { label: tc("home"), href: "/" },
              { label: tp("title"), href: "/products" },
              { label: serializedProduct.name },
            ]}
            className="mb-8"
          />
        </Container>

        <ProductDetail product={serializedProduct as any} />

        <ProductCarousel
          title={t("related.title")}
          subtitle={t("related.subtitle")}
          products={localizedRelated}
        />

        <Container className="pb-16">
          {serializedProduct.faqs && serializedProduct.faqs.length > 0 && (
            <div className="max-w-3xl mx-auto mt-16">
              <h2 className="heading-md mb-8 text-center">{t("faq.title")}</h2>
              <div className="space-y-6">
                {serializedProduct.faqs.map((faq, i) => (
                  <div key={i} className="border-b border-mist pb-6">
                    <h3 className="font-serif text-lg mb-2">{faq.question}</h3>
                    <p className="text-body">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Container>
      </div>
    </>
  )
}