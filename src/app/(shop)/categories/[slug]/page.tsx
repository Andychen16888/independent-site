import { notFound } from "next/navigation"
import { Container } from "@/components/ui/Container"
import { Breadcrumb } from "@/components/ui/Breadcrumb"
import { ProductGrid } from "@/components/product/ProductGrid"
import { generateMetadata as genMeta } from "@/lib/seo/generate-metadata"
import { breadcrumbSchema, productGroupSchema } from "@/lib/seo/structured-data"
import type { Metadata } from "next"

interface Props {
  params: Promise<{ slug: string }>
}

const categories = [
  {
    slug: "beauty",
    name: "Beauty",
    title: "Peptide Skincare",
    subtitle: "Advanced formulations rooted in Eastern botanical wisdom",
    description: "Discover our premium peptide-infused skincare collection. Each product combines cutting-edge biotechnology with traditional Asian botanicals for radiant, healthy skin. From hydrating serums to brightening essences, our beauty range is designed for the modern woman who values clean, effective skincare.",
    style: "minimal-white",
    ogImage: "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=1200&q=80",
    products: [
      { id: "1", name: "Peptide Hydration Serum", slug: "peptide-hydration-serum", unitPrice: 78, originalPrice: 98, stock: 15, isNew: true, isBestSeller: true, images: [{ url: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&q=80" }] },
      { id: "4", name: "Rice Bran Peptide Mask", slug: "rice-bran-peptide-mask", unitPrice: 12, stock: 100, isNew: true, images: [{ url: "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=400&q=80" }] },
      { id: "7", name: "Ginseng Peptide Eye Cream", slug: "ginseng-peptide-eye-cream", unitPrice: 62, originalPrice: 78, stock: 18, isBestSeller: true, images: [{ url: "https://images.unsplash.com/photo-1621607512214-68297480165e?w=400&q=80" }] },
      { id: "4b", name: "Vitamin C Brightening Essence", slug: "vitamin-c-brightening-essence", unitPrice: 55, stock: 30, isNew: true, images: [{ url: "https://images.unsplash.com/photo-1599305090598-fe179d501227?w=400&q=80" }] },
    ],
  },
  {
    slug: "handmade-living",
    name: "Handmade Living",
    title: "Artisanal Home Objects",
    subtitle: "Handcrafted pieces that tell a story",
    description: "Curated objects from master artisans across Asia. Each piece brings warmth, tradition, and intention into your home. Discover hand-thrown ceramics, natural fiber textiles, and mindful home accessories that transform your space into a sanctuary.",
    style: "warm-wood",
    ogImage: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=1200&q=80",
    products: [
      { id: "5", name: "Raku Teacup Set", slug: "raku-teacup-set", unitPrice: 145, stock: 8, isNew: true, isBestSeller: true, images: [{ url: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=400&q=80" }] },
      { id: "6", name: "Celadon Lotus Vase", slug: "celadon-lotus-vase", unitPrice: 230, originalPrice: 280, stock: 3, isNew: true, images: [{ url: "https://images.unsplash.com/photo-1581783898377-1c85bf937427?w=400&q=80" }] },
      { id: "7b", name: "Bamboo Incense Holder", slug: "bamboo-incense-holder", unitPrice: 38, stock: 50, images: [{ url: "https://images.unsplash.com/photo-1602872030216-3ae6e5f3e5e5?w=400&q=80" }] },
      { id: "8b", name: "Mulberry Silk Eye Mask", slug: "mulberry-silk-eye-mask", unitPrice: 48, originalPrice: 58, stock: 35, isBestSeller: true, images: [{ url: "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=400&q=80" }] },
    ],
  },
]

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const category = categories.find((c) => c.slug === slug)
  if (!category) return {}
  return genMeta({
    title: `${category.title} | ${category.name}`,
    description: category.description,
    keywords: `${category.name}, ${slug}, peptide skincare, handmade, artisan, oriental beauty`,
    ogImage: category.ogImage,
    canonical: `${process.env.NEXT_PUBLIC_SITE_URL || "https://orientalbeauty.com"}/categories/${slug}`,
  })
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params
  const category = categories.find((c) => c.slug === slug)
  if (!category) notFound()

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://orientalbeauty.com"
  const bgClass = category.style === "warm-wood" ? "bg-cream" : "bg-ivory"

  const schemas = [
    breadcrumbSchema([
      { name: "Home", url: baseUrl },
      { name: category.name, url: `${baseUrl}/categories/${category.slug}` },
    ]),
    productGroupSchema({
      name: category.title,
      description: category.description,
      url: `${baseUrl}/categories/${category.slug}`,
      image: category.ogImage,
      products: category.products.map((p) => ({
        name: p.name,
        url: `${baseUrl}/products/${p.slug}`,
        price: p.unitPrice,
        image: p.images?.[0]?.url,
        sku: p.slug,
      })),
    }),
  ]

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }}
      />
      <div className="pt-[100px] md:pt-[116px]">
        <div className={`${bgClass} section-padding`}>
          <Container>
            <Breadcrumb
              items={[
                { label: "Home", href: "/" },
                { label: category.name },
              ]}
              className="mb-6"
            />
            <span className="text-caption mb-4 block">{category.subtitle}</span>
            <h1 className="heading-xl mb-6">{category.title}</h1>
            <p className="text-body max-w-2xl">{category.description}</p>
          </Container>
        </div>

        <Container className="py-12 md:py-16">
          <ProductGrid products={category.products} />
        </Container>
      </div>
    </>
  )
}
