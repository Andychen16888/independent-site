import { Container } from "@/components/ui/Container"
import { Breadcrumb } from "@/components/ui/Breadcrumb"
import { ProductFilters } from "@/components/product/ProductFilters"
import { ProductGrid } from "@/components/product/ProductGrid"
import { generateMetadata } from "@/lib/seo/generate-metadata"
import { breadcrumbSchema } from "@/lib/seo/structured-data"
import type { Metadata } from "next"

export const metadata: Metadata = generateMetadata({
  title: "All Products",
  description: "Browse our complete collection of premium peptide skincare and artisanal home decor. Discover the perfect blend of Eastern beauty rituals and mindful living.",
  keywords: "peptide skincare, beauty products, artisan home decor, oriental beauty shop, buy skincare online",
})

const mockProducts = [
  {
    id: "1", name: "Peptide Hydration Serum", slug: "peptide-hydration-serum",
    unitPrice: 78, originalPrice: 98, stock: 15, isNew: true, isBestSeller: true, images: [],
  },
  {
    id: "2", name: "Rice Bran Peptide Mask", slug: "rice-bran-peptide-mask",
    unitPrice: 12, stock: 100, isNew: true, images: [],
  },
  {
    id: "3", name: "Ginseng Peptide Eye Cream", slug: "ginseng-peptide-eye-cream",
    unitPrice: 62, originalPrice: 78, stock: 18, isBestSeller: true, images: [],
  },
  {
    id: "4", name: "Vitamin C Brightening Essence", slug: "vitamin-c-brightening-essence",
    unitPrice: 55, stock: 30, isNew: true, images: [],
  },
  {
    id: "5", name: "Raku Teacup Set", slug: "raku-teacup-set",
    unitPrice: 145, stock: 8, isNew: true, isBestSeller: true, images: [],
  },
  {
    id: "6", name: "Celadon Lotus Vase", slug: "celadon-lotus-vase",
    unitPrice: 230, originalPrice: 280, stock: 3, isNew: true, images: [],
  },
  {
    id: "7", name: "Bamboo Incense Holder", slug: "bamboo-incense-holder",
    unitPrice: 38, stock: 50, images: [],
  },
  {
    id: "8", name: "Mulberry Silk Eye Mask", slug: "mulberry-silk-eye-mask",
    unitPrice: 48, originalPrice: 58, stock: 35, isBestSeller: true, images: [],
  },
]

export default function ProductsPage() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://orientalbeauty.com"

  const schemas = [
    breadcrumbSchema([
      { name: "Home", url: baseUrl },
      { name: "All Products", url: `${baseUrl}/products` },
    ]),
  ]

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }}
      />
      <div className="pt-[100px] md:pt-[116px]">
        <Container>
          <Breadcrumb
            items={[{ label: "Home", href: "/" }, { label: "All Products" }]}
            className="mb-8"
          />
          <h1 className="heading-xl mb-4">All Products</h1>
          <p className="text-body mb-12 max-w-2xl">
            Discover our complete collection, from peptide skincare to artisanal home objects.
          </p>

          <div className="grid md:grid-cols-[220px_1fr] gap-8 lg:gap-12">
            <aside className="hidden md:block">
              <ProductFilters />
            </aside>
            <div>
              <ProductGrid products={mockProducts} />
            </div>
          </div>
        </Container>
      </div>
    </>
  )
}
