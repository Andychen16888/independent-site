import { Container } from "@/components/ui/Container"
import { Breadcrumb } from "@/components/ui/Breadcrumb"
import { ProductGrid } from "@/components/product/ProductGrid"
import { generateMetadata } from "@/lib/seo/generate-metadata"

export const metadata = generateMetadata({
  title: "Search Results",
  description: "Search our collection of peptide skincare and artisanal home decor.",
})

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams

  return (
    <div className="pt-24 md:pt-28 min-h-screen">
      <Container>
        <Breadcrumb
          items={[{ label: "Home", href: "/" }, { label: "Search" }]}
          className="mb-8"
        />
        <h1 className="heading-xl mb-4">
          {q ? `Results for "${q}"` : "Search"}
        </h1>
        <p className="text-body mb-12">
          {q ? `Showing results for "${q}"` : "Enter a search term to find products"}
        </p>
        <ProductGrid products={[]} />
      </Container>
    </div>
  )
}
