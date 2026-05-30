import { Container } from "@/components/ui/Container"
import { Breadcrumb } from "@/components/ui/Breadcrumb"
import { ProductFilters } from "@/components/product/ProductFilters"
import { ProductGrid } from "@/components/product/ProductGrid"
import { generateMetadata } from "@/lib/seo/generate-metadata"
import { breadcrumbSchema } from "@/lib/seo/structured-data"
import { filterMockProducts } from "@/lib/mock/products"
import type { Metadata } from "next"

export const metadata: Metadata = generateMetadata({
  title: "All Products",
  description: "Browse our complete collection of premium peptide skincare and artisanal home decor. Discover the perfect blend of Eastern beauty rituals and mindful living.",
  keywords: "peptide skincare, beauty products, artisan home decor, oriental beauty shop, buy skincare online",
})

interface Props {
  searchParams: Promise<{ sort?: string; price?: string; q?: string }>
}

export default async function ProductsPage({ searchParams }: Props) {
  const { sort, price, q } = await searchParams
  const products = filterMockProducts({ sort, price, q })
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
      <div>
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
              <ProductGrid products={products} />
            </div>
          </div>
        </Container>
      </div>
    </>
  )
}
