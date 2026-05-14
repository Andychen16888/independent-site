import { notFound } from "next/navigation"
import { Container } from "@/components/ui/Container"
import { Breadcrumb } from "@/components/ui/Breadcrumb"
import { ProductDetail } from "@/components/product/ProductDetail"
import { ProductCarousel } from "@/components/product/ProductCarousel"
import { generateMetadata as genMeta, generateProductSchema } from "@/lib/seo/generate-metadata"
import type { Metadata } from "next"

interface Props {
  params: Promise<{ slug: string }>
}

// This would come from Prisma in production
const products = [
  {
    id: "1", name: "Peptide Hydration Serum", slug: "peptide-hydration-serum",
    sku: "PEP-HYDR-001", brand: "Oriental Beauty",
    unitPrice: 78, originalPrice: 98, currency: "USD", stock: 15,
    description: "A lightweight, fast-absorbing peptide serum that delivers multi-weight peptides...",
    shortDescription: "Advanced peptide hydration for radiant skin",
    images: [], videos: [], parameters: [],
    faqs: [
      { question: "How often should I use this serum?", answer: "Apply twice daily, morning and evening, after cleansing." },
    ],
    reviews: [
      { id: "1", rating: 5, title: "Amazing!", content: "My skin has never looked better", user: { firstName: "Sarah" }, createdAt: new Date() },
    ],
  },
]

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const product = products.find((p) => p.slug === slug)
  if (!product) return {}
  return genMeta({
    title: product.name,
    description: product.shortDescription || product.description,
    keywords: `${product.name}, peptide skincare, ${product.brand}`,
  })
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params
  const product = products.find((p) => p.slug === slug)
  if (!product) notFound()

  const schema = generateProductSchema(product)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <div className="pt-24 md:pt-28">
        <Container>
          <Breadcrumb
            items={[
              { label: "Home", href: "/" },
              { label: "All Products", href: "/products" },
              { label: product.name },
            ]}
            className="mb-8"
          />
        </Container>

        <ProductDetail product={product as any} />

        <ProductCarousel
          title="Complete the Ritual"
          subtitle="Frequently bought together"
        />

        <Container className="pb-16">
          {product.faqs && product.faqs.length > 0 && (
            <div className="max-w-3xl mx-auto mt-16">
              <h2 className="heading-md mb-8 text-center">FAQ</h2>
              <div className="space-y-6">
                {product.faqs.map((faq, i) => (
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
