import { notFound } from "next/navigation"
import { Container } from "@/components/ui/Container"
import { Breadcrumb } from "@/components/ui/Breadcrumb"
import { ProductGrid } from "@/components/product/ProductGrid"
import { generateMetadata as genMeta } from "@/lib/seo/generate-metadata"
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
    description: "Discover our peptide-infused skincare collection. Each product combines cutting-edge biotechnology with traditional Asian botanicals for radiant, healthy skin.",
    style: "minimal-white",
    products: [
      { id: "1", name: "Peptide Hydration Serum", slug: "peptide-hydration-serum", unitPrice: 78, originalPrice: 98, stock: 15, isNew: true, isBestSeller: true, images: [] },
      { id: "2", name: "Overnight Recovery Mask", slug: "overnight-recovery-mask", unitPrice: 85, stock: 20, isBestSeller: true, images: [] },
      { id: "4", name: "Rice Bran Peptide Mask", slug: "rice-bran-peptide-mask", unitPrice: 45, stock: 30, isBestSeller: true, images: [] },
      { id: "7", name: "Ginseng Peptide Eye Cream", slug: "ginseng-peptide-eye-cream", unitPrice: 62, stock: 18, isBestSeller: true, images: [] },
    ],
  },
  {
    slug: "handmade-living",
    name: "Handmade Living",
    title: "Artisanal Home Objects",
    subtitle: "Handcrafted pieces that tell a story",
    description: "Curated objects from master artisans across Asia. Each piece brings warmth, tradition, and intention into your home.",
    style: "warm-wood",
    products: [
      { id: "3", name: "Artisan Tea Ceremony Set", slug: "artisan-tea-ceremony-set", unitPrice: 120, originalPrice: 150, stock: 8, isNew: true, images: [] },
      { id: "5", name: "Hand-thrown Ceramic Vase", slug: "hand-thrown-ceramic-vase", unitPrice: 95, stock: 5, isNew: true, images: [] },
      { id: "6", name: "Silk Sleep Set", slug: "silk-sleep-set", unitPrice: 165, stock: 10, images: [] },
      { id: "8", name: "Bamboo Carved Wall Art", slug: "bamboo-carved-wall-art", unitPrice: 140, originalPrice: 180, stock: 3, isNew: true, images: [] },
    ],
  },
]

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const category = categories.find((c) => c.slug === slug)
  if (!category) return {}
  return genMeta({
    title: category.name,
    description: category.description,
  })
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params
  const category = categories.find((c) => c.slug === slug)
  if (!category) notFound()

  const bgClass = category.style === "warm-wood"
    ? "bg-cream"
    : "bg-ivory"

  return (
    <div className="pt-24 md:pt-28">
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
  )
}
