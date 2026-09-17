import { notFound } from "next/navigation"
import { prisma } from "@/lib/db/prisma"
import { Container } from "@/components/ui/Container"
import { Breadcrumb } from "@/components/ui/Breadcrumb"
import { ProductDetail } from "@/components/product/ProductDetail"
import { ProductCarousel } from "@/components/product/ProductCarousel"
import { generateMetadata as genMeta } from "@/lib/seo/generate-metadata"
import { getSiteSeo } from "@/lib/settings/settings"
import { breadcrumbSchema, productSchema, videoObjectSchema, articleSchema, faqPageSchema } from "@/lib/seo/structured-data"
import type { Metadata } from "next"

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const product = await prisma.product.findFirst({
    where: { slug },
    select: { name: true, slug: true, shortDescription: true, description: true, brand: true, images: { take: 1 } },
  })
  if (!product) return {}
  const seo = await getSiteSeo()
  return genMeta({
    title: product.name,
    description: (product.shortDescription || product.description).replace(/<[^>]*>/g, ""),
    keywords: `${product.name}, ${product.brand || ""}, ${seo.siteName}`,
    ogImage: product.images?.[0]?.url,
    ogType: "product",
    siteName: seo.siteName,
    siteDescription: seo.siteDescription,
    canonical: `${process.env.NEXT_PUBLIC_SITE_URL || "https://commoditychina.com"}/products/${product.slug}`,
  })
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params
  const product = await prisma.product.findFirst({
    where: { slug },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      videos: { orderBy: { sortOrder: "asc" } },
      parameters: true,
      faqs: { orderBy: { sortOrder: "asc" } },
      reviews: {
        include: { user: { select: { firstName: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  })

  if (!product) notFound()

  const serializedProduct = {
    ...product,
    unitPrice: Number(product.unitPrice),
    originalPrice: product.originalPrice ? Number(product.originalPrice) : null,
  }

  const relatedProducts = (await prisma.product.findMany({
    where: { status: "ACTIVE", id: { not: product.id } },
    take: 10,
    orderBy: { createdAt: "desc" },
    include: { images: { take: 1 } },
  })).map((p) => ({
    ...p,
    unitPrice: Number(p.unitPrice),
    originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
  }))

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://commoditychina.com"
  const productUrl = `${baseUrl}/products/${serializedProduct.slug}`

  const schemas = [
    breadcrumbSchema([
      { name: "Home", url: baseUrl },
      { name: "All Products", url: `${baseUrl}/products` },
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
      description: (serializedProduct.shortDescription || serializedProduct.description).replace(/<[^>]*>/g, ""),
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
              { label: "Home", href: "/" },
              { label: "All Products", href: "/products" },
              { label: serializedProduct.name },
            ]}
            className="mb-8"
          />
        </Container>

        <ProductDetail product={serializedProduct as any} />

        <ProductCarousel
          title="Complete the Ritual"
          subtitle="Frequently bought together"
          products={relatedProducts}
        />

        <Container className="pb-16">
          {serializedProduct.faqs && serializedProduct.faqs.length > 0 && (
            <div className="max-w-3xl mx-auto mt-16">
              <h2 className="heading-md mb-8 text-center">Frequently Asked Questions</h2>
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
