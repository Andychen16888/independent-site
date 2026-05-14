import { notFound } from "next/navigation"
import { Container } from "@/components/ui/Container"
import { Breadcrumb } from "@/components/ui/Breadcrumb"
import { ProductDetail } from "@/components/product/ProductDetail"
import { ProductCarousel } from "@/components/product/ProductCarousel"
import { generateMetadata as genMeta } from "@/lib/seo/generate-metadata"
import { breadcrumbSchema, productSchema } from "@/lib/seo/structured-data"
import type { Metadata } from "next"

interface Props {
  params: Promise<{ slug: string }>
}

const products = [
  {
    id: "1", name: "Peptide Hydration Serum", slug: "peptide-hydration-serum",
    sku: "PEP-HYDR-001", brand: "Oriental Beauty",
    unitPrice: 78, originalPrice: 98, currency: "USD", stock: 15,
    description: "A lightweight, fast-absorbing peptide serum that delivers multi-weight peptides deep into the skin. Formulated with hyaluronic acid and niacinamide, this serum provides intense hydration while supporting collagen production.",
    shortDescription: "Advanced peptide hydration for radiant skin",
    images: [
      { url: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&q=80", alt: "Peptide Hydration Serum bottle" },
      { url: "https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?w=800&q=80", alt: "Serum dropper application" },
    ],
    videos: [{ url: "https://cdn.coverr.co/videos/coverr-skincare-product-presentation-5711/1080p.mp4", title: "Product Application Guide" }],
    parameters: [],
    faqs: [
      { question: "How often should I use this serum?", answer: "Apply twice daily, morning and evening, after cleansing and before moisturizer." },
      { question: "How long until I see results?", answer: "Most users notice improved skin texture and hydration within 2 weeks." },
    ],
    reviews: [
      { id: "1", rating: 5, title: "Amazing!", content: "My skin has never looked better", user: { firstName: "Sarah" }, createdAt: new Date("2026-04-20") },
      { id: "2", rating: 4, title: "Great product", content: "Really high quality", user: { firstName: "Emily" }, createdAt: new Date("2026-04-15") },
      { id: "3", rating: 5, title: "Worth every penny", content: "Best serum I've tried", user: { firstName: "Jessica" }, createdAt: new Date("2026-04-10") },
    ],
  },
  {
    id: "2", name: "Rice Bran Peptide Mask", slug: "rice-bran-peptide-mask",
    sku: "RICE-PEP-002", brand: "Oriental Beauty",
    unitPrice: 12, currency: "USD", stock: 100,
    description: "Inspired by traditional Japanese rice bran skincare, this innovative sheet mask combines fermented rice extract with our signature peptide complex.",
    shortDescription: "Brightening sheet mask with fermented rice and peptides",
    images: [
      { url: "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=800&q=80", alt: "Sheet mask on face" },
      { url: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800&q=80", alt: "Luxury skincare products" },
    ],
    videos: [], parameters: [], faqs: [], reviews: [],
  },
  {
    id: "3", name: "Ginseng Peptide Eye Cream", slug: "ginseng-peptide-eye-cream",
    sku: "GIN-PEP-003", brand: "Oriental Beauty",
    unitPrice: 62, originalPrice: 78, currency: "USD", stock: 30,
    description: "A luxurious eye cream that combines the adaptogenic power of Korean red ginseng with our advanced peptide technology.",
    shortDescription: "Anti-aging eye treatment with red ginseng and peptides",
    images: [
      { url: "https://images.unsplash.com/photo-1621607512214-68297480165e?w=800&q=80", alt: "Eye cream jar" },
    ],
    videos: [], parameters: [], faqs: [], reviews: [],
  },
  {
    id: "4", name: "Vitamin C Brightening Essence", slug: "vitamin-c-brightening-essence",
    sku: "VIT-C-004", brand: "Oriental Beauty",
    unitPrice: 55, currency: "USD", stock: 40,
    description: "A lightweight, water-like essence that delivers a stabilized form of Vitamin C alongside ferulic acid and vitamin E.",
    shortDescription: "Stabilized Vitamin C essence for radiant, even-toned skin",
    images: [
      { url: "https://images.unsplash.com/photo-1599305090598-fe179d501227?w=800&q=80", alt: "Vitamin C essence bottle" },
    ],
    videos: [], parameters: [], faqs: [], reviews: [],
  },
  {
    id: "5", name: "Raku Teacup Set", slug: "raku-teacup-set",
    sku: "CR-RAKU-001", brand: "Kyoto Craft House",
    unitPrice: 145, currency: "USD", stock: 8,
    description: "Handcrafted by master potter Takeshi Yamamoto in his Kyoto studio, each Raku teacup is individually fired using the ancient Raku technique.",
    shortDescription: "Set of 4 handcrafted Raku teacups from Kyoto",
    images: [
      { url: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=800&q=80", alt: "Raku teacup set" },
    ],
    videos: [{ url: "https://cdn.coverr.co/videos/coverr-pouring-tea-into-a-cup-5762/1080p.mp4", title: "Tea Ceremony" }],
    parameters: [], faqs: [], reviews: [],
  },
  {
    id: "6", name: "Celadon Lotus Vase", slug: "celadon-lotus-vase",
    sku: "CR-CEL-002", brand: "Korea Heritage Atelier",
    unitPrice: 230, originalPrice: 280, currency: "USD", stock: 3,
    description: "Inspired by the celadon masterpieces of the Goryeo Dynasty, this exquisite vase features a lotus motif carved under a sage-green celadon glaze.",
    shortDescription: "Korean celadon vase with hand-carved lotus motif",
    images: [
      { url: "https://images.unsplash.com/photo-1581783898377-1c85bf937427?w=800&q=80", alt: "Celadon vase" },
    ],
    videos: [], parameters: [], faqs: [], reviews: [],
  },
  {
    id: "7", name: "Bamboo Incense Holder", slug: "bamboo-incense-holder",
    sku: "HD-BAM-001", brand: "Bali Artisan Collective",
    unitPrice: 38, currency: "USD", stock: 50,
    description: "Carved from sustainably harvested bamboo by artisans in Ubud, Bali, this minimalist incense holder features a discreet drawer for storing incense sticks.",
    shortDescription: "Minimalist bamboo incense holder with storage drawer",
    images: [
      { url: "https://images.unsplash.com/photo-1602872030216-3ae6e5f3e5e5?w=800&q=80", alt: "Bamboo incense holder" },
    ],
    videos: [], parameters: [], faqs: [], reviews: [],
  },
  {
    id: "8", name: "Mulberry Silk Eye Mask", slug: "mulberry-silk-eye-mask",
    sku: "TX-SILK-001", brand: "Oriental Beauty",
    unitPrice: 48, originalPrice: 58, currency: "USD", stock: 35,
    description: "Crafted from 22-momme mulberry silk, this luxurious eye mask provides complete light blockage for deeper sleep and meditation.",
    shortDescription: "22-momme mulberry silk eye mask for restful sleep",
    images: [
      { url: "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=800&q=80", alt: "Silk eye mask on bed" },
    ],
    videos: [], parameters: [], faqs: [], reviews: [],
  },
]

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const product = products.find((p) => p.slug === slug)
  if (!product) return {}
  return genMeta({
    title: product.name,
    description: product.shortDescription || product.description,
    keywords: `${product.name}, ${product.brand}, peptide skincare, beauty, skincare products`,
    ogImage: product.images?.[0]?.url,
    ogType: "product",
    canonical: `${process.env.NEXT_PUBLIC_SITE_URL || "https://orientalbeauty.com"}/products/${product.slug}`,
  })
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params
  const product = products.find((p) => p.slug === slug)
  if (!product) notFound()

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://orientalbeauty.com"
  const productUrl = `${baseUrl}/products/${product.slug}`

  const schemas = [
    breadcrumbSchema([
      { name: "Home", url: baseUrl },
      { name: "All Products", url: `${baseUrl}/products` },
      { name: product.name, url: productUrl },
    ]),
    productSchema({
      ...product,
      url: productUrl,
      currency: product.currency,
      images: product.images,
      reviews: product.reviews,
    }),
  ]

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }}
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
              <h2 className="heading-md mb-8 text-center">Frequently Asked Questions</h2>
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
