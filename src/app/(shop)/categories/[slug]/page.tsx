import { notFound } from "next/navigation"
import { Container } from "@/components/ui/Container"
import { Breadcrumb } from "@/components/ui/Breadcrumb"
import { ProductGrid } from "@/components/product/ProductGrid"
import { generateMetadata as genMeta } from "@/lib/seo/generate-metadata"
import { breadcrumbSchema, productGroupSchema } from "@/lib/seo/structured-data"
import { mockProducts } from "@/lib/mock/products"
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
    productSlugs: ["peptide-hydration-serum", "rice-bran-peptide-mask", "ginseng-peptide-eye-cream", "vitamin-c-brightening-essence"] as const,
  },
  {
    slug: "handmade-living",
    name: "Handmade Living",
    title: "Artisanal Home Objects",
    subtitle: "Handcrafted pieces that tell a story",
    description: "Curated objects from master artisans across Asia. Each piece brings warmth, tradition, and intention into your home. Discover hand-thrown ceramics, natural fiber textiles, and mindful home accessories that transform your space into a sanctuary.",
    style: "warm-wood",
    ogImage: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=1200&q=80",
    productSlugs: ["raku-teacup-set", "celadon-lotus-vase", "bamboo-incense-holder", "mulberry-silk-eye-mask"] as const,
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

  const products = mockProducts.filter((p) =>
    (category.productSlugs as readonly string[]).includes(p.slug)
  )

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
      products: products.map((p) => ({
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
      <div>
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
          <ProductGrid products={products} />
        </Container>
      </div>
    </>
  )
}
