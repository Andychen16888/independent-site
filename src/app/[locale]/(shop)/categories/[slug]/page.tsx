import { notFound } from "next/navigation"
import { Link } from "@/i18n/navigation"
import { prisma } from "@/lib/db/prisma"
import { getTranslations } from "next-intl/server"
import { Container } from "@/components/ui/Container"
import { Breadcrumb } from "@/components/ui/Breadcrumb"
import { ProductGrid } from "@/components/product/ProductGrid"
import { generateMetadata as genMeta } from "@/lib/seo/generate-metadata"
import { getSiteSeo } from "@/lib/settings/settings"
import { breadcrumbSchema, productGroupSchema } from "@/lib/seo/structured-data"
import { fetchProductTranslations, applyProductLocalizations } from "@/lib/i18n/product"
import { fetchCategoryTranslations } from "@/lib/i18n/category"
import { localizeCategoryName } from "@/lib/i18n/category-labels"
import type { Metadata } from "next"

interface Props {
  params: Promise<{ slug: string; locale: string }>
}

export const revalidate = 3600

async function getCategoryWithSlug(slug: string) {
  return prisma.category.findUnique({ where: { slug, isActive: true } })
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = await params
  const category = await getCategoryWithSlug(slug)
  if (!category) return {}
  const tr = await fetchCategoryTranslations([category.id], locale)
  const categoryName = localizeCategoryName(locale, category.slug, category.name, tr.get(category.id))
  const seo = await getSiteSeo()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://commoditychina.com"
  return genMeta({
    title: category.seoTitle || `${categoryName} | Products`,
    description: category.seoDescription || category.description || `Shop ${categoryName}`,
    keywords: category.seoKeywords || categoryName,
    ogImage: category.image || undefined,
    siteName: seo.siteName,
    siteDescription: seo.siteDescription,
    canonical: `/categories/${slug}`,
    locale,
  })
}

export default async function CategoryPage({ params }: Props) {
  const { slug, locale } = await params
  const t = await getTranslations("category")
  const tc = await getTranslations("common")
  const category = await getCategoryWithSlug(slug)
  if (!category) notFound()
  const withParents = await prisma.category.findMany({
    where: { isActive: true },
    select: { id: true, parentId: true, name: true, slug: true },
  })
  const catTranslations = await fetchCategoryTranslations(
    [category.id, ...withParents.map((c) => c.id)],
    locale
  )
  const categoryName = localizeCategoryName(locale, category.slug, category.name, catTranslations.get(category.id))

  // Include products from all descendant categories (multi-level support).
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
    unitPrice: p.unitPrice != null ? Number(p.unitPrice) : null,
    originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
  }))

  const translations = await fetchProductTranslations(products.map((p) => p.id), locale)
  const localizedProducts = applyProductLocalizations(products, translations)

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://commoditychina.com"
  const children = withParents.filter((c) => c.parentId === category.id)

  const schemas = [
    breadcrumbSchema([
      { name: tc("home"), url: baseUrl },
      { name: categoryName, url: `${baseUrl}/categories/${slug}` },
    ]),
    productGroupSchema({
      name: categoryName,
      description: category.description || categoryName,
      url: `${baseUrl}/categories/${slug}`,
      image: category.image || undefined,
      products: localizedProducts.map((p) => ({
        name: p.name,
        url: `${baseUrl}/products/${p.slug}`,
        price: p.unitPrice != null ? Number(p.unitPrice) : null,
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
                { label: tc("home"), href: "/" },
                { label: categoryName },
              ]}
              className="mb-6"
            />
            <h1 className="heading-xl mb-6">{categoryName}</h1>
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
                    {localizeCategoryName(locale, child.slug, child.name, catTranslations.get(child.id))}
                  </Link>
                ))}
              </div>
            )}
          </Container>
        </div>

        <Container className="py-12 md:py-16">
          {localizedProducts.length === 0 ? (
            <div className="text-center text-sm text-stone py-12">
              {t("noProducts")}
            </div>
          ) : (
            <ProductGrid products={localizedProducts} />
          )}
        </Container>
      </div>
    </>
  )
}
