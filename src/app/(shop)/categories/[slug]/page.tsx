import { notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/db/prisma"
import { Container } from "@/components/ui/Container"
import { Breadcrumb } from "@/components/ui/Breadcrumb"
import { ProductGrid } from "@/components/product/ProductGrid"
import { generateMetadata as genMeta } from "@/lib/seo/generate-metadata"
import { getSiteSeo } from "@/lib/settings/settings"
import { breadcrumbSchema, productGroupSchema } from "@/lib/seo/structured-data"
import type { Metadata } from "next"

interface Props {
  params: Promise<{ slug: string }>
}

async function getCategoryWithSlug(slug: string) {
  return prisma.category.findUnique({ where: { slug, isActive: true } })
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const category = await getCategoryWithSlug(slug)
  if (!category) return {}

  const seo = await getSiteSeo()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://commoditychina.com"
  return genMeta({
    title: category.seoTitle || `${category.name} | Products`,
    description: category.seoDescription || category.description || `Shop ${category.name}`,
    keywords: category.seoKeywords || category.name,
    ogImage: category.image || undefined,
    siteName: seo.siteName,
    siteDescription: seo.siteDescription,
    canonical: `${siteUrl}/categories/${slug}`,
  })
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params
  const category = await getCategoryWithSlug(slug)
  if (!category) notFound()

  // Include products from all descendant categories (multi-level support).
  const withParents = await prisma.category.findMany({
    where: { isActive: true },
    select: { id: true, parentId: true, name: true, slug: true },
  })
  const roots = new Set<string>()
  roots.add(category.id)
  let changed = true
  while (changed) {
    changed = false
    for (const c of withParents) {
      if (c.parentId && roots.has(c.parentId) && !roots.has(c.id)) {
        roots.add(c.id)
        changed = true
      }
    }
  }

  const products = (
    await prisma.product.findMany({
      where: {
        status: "ACTIVE",
        deletedAt: null,
        categories: { some: { categoryId: { in: Array.from(roots) } } },
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      include: { images: { take: 1 } },
    })
  ).map((p) => ({
    ...p,
    unitPrice: Number(p.unitPrice),
    originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
  }))

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://commoditychina.com"
  const children = withParents.filter((c) => c.parentId === category.id)

  const schemas = [
    breadcrumbSchema([
      { name: "Home", url: baseUrl },
      { name: category.name, url: `${baseUrl}/categories/${slug}` },
    ]),
    productGroupSchema({
      name: category.name,
      description: category.description || category.name,
      url: `${baseUrl}/categories/${slug}`,
      image: category.image || undefined,
      products: products.map((p) => ({
        name: p.name,
        url: `${baseUrl}/products/${p.slug}`,
        price: Number(p.unitPrice),
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
        <div className="bg-ivory section-padding">
          <Container>
            <Breadcrumb
              items={[
                { label: "Home", href: "/" },
                { label: category.name },
              ]}
              className="mb-6"
            />
            {category.type && <span className="text-caption mb-4 block">{category.type}</span>}
            <h1 className="heading-xl mb-6">{category.name}</h1>
            {category.description && (
              <p className="text-body max-w-2xl">{category.description}</p>
            )}
            {children.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-6">
                {children.map((child) => (
                  <Link
                    key={child.id}
                    href={`/categories/${child.slug}`}
                    className="px-4 py-2 border border-mist text-xs tracking-widest uppercase text-stone hover:text-charcoal hover:border-charcoal transition-colors"
                  >
                    {child.name}
                  </Link>
                ))}
              </div>
            )}
          </Container>
        </div>

        <Container className="py-12 md:py-16">
          {products.length === 0 ? (
            <div className="text-center text-sm text-stone py-12">
              No products in this category yet.
            </div>
          ) : (
            <ProductGrid products={products} />
          )}
        </Container>
      </div>
    </>
  )
}