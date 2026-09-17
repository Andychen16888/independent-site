import { prisma } from "@/lib/db/prisma"
import { Container } from "@/components/ui/Container"
import { Breadcrumb } from "@/components/ui/Breadcrumb"
import { ProductGrid } from "@/components/product/ProductGrid"
import { generateMetadata } from "@/lib/seo/generate-metadata"

export const metadata = generateMetadata({
  title: "Search Results",
  description: "Search our collection of peptide skincare and artisanal home decor.",
  noindex: true,
  nofollow: true,
})

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const products = q
    ? (await prisma.product.findMany({
        where: {
          status: "ACTIVE",
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ],
        },
        orderBy: { createdAt: "desc" },
        include: { images: { take: 1 } },
      })).map((p) => ({
        ...p,
        unitPrice: Number(p.unitPrice),
        originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
      }))
    : []

  return (
    <div className="min-h-screen">
      <Container>
        <Breadcrumb
          items={[{ label: "Home", href: "/" }, { label: "Search" }]}
          className="mb-8"
        />
        <h1 className="heading-xl mb-4">
          {q ? `Results for "${q}"` : "Search"}
        </h1>
        <p className="text-body mb-12">
          {q
            ? `Showing ${products.length} result${products.length === 1 ? "" : "s"} for "${q}"`
            : "Enter a search term to find products"}
        </p>
        <ProductGrid products={products} />
      </Container>
    </div>
  )
}
