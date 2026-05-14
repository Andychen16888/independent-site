import { Container } from "@/components/ui/Container"
import { Breadcrumb } from "@/components/ui/Breadcrumb"
import { ProductFilters } from "@/components/product/ProductFilters"
import { ProductGrid } from "@/components/product/ProductGrid"
import { generateMetadata } from "@/lib/seo/generate-metadata"

export const metadata = generateMetadata({
  title: "All Products",
  description: "Browse our complete collection of peptide skincare and artisanal home decor.",
})

// This will come from server component data fetching via Prisma
const mockProducts = [
  {
    id: "1", name: "Peptide Hydration Serum", slug: "peptide-hydration-serum",
    unitPrice: 78, originalPrice: 98, stock: 15, isNew: true, isBestSeller: true, images: [],
  },
  {
    id: "2", name: "Overnight Recovery Mask", slug: "overnight-recovery-mask",
    unitPrice: 85, stock: 20, isBestSeller: true, images: [],
  },
  {
    id: "3", name: "Artisan Tea Ceremony Set", slug: "artisan-tea-ceremony-set",
    unitPrice: 120, originalPrice: 150, stock: 8, isNew: true, images: [],
  },
]

export default function ProductsPage() {
  return (
    <div className="pt-24 md:pt-28">
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
  )
}
