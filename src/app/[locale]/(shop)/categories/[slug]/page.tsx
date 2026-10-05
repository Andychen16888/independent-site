import { notFound, permanentRedirect } from "next/navigation"
import { Link } from "@/i18n/navigation"
import { prisma } from "@/lib/db/prisma"
import { getTranslations } from "next-intl/server"
import { Container } from "@/components/ui/Container"
import { Breadcrumb } from "@/components/ui/Breadcrumb"
import { ProductGrid } from "@/components/product/ProductGrid"
import { ProductFilters } from "@/components/product/ProductFilters"
import { generateMetadata as genMeta } from "@/lib/seo/generate-metadata"
import { getSiteSeo } from "@/lib/settings/settings"
import { breadcrumbSchema, productGroupSchema } from "@/lib/seo/structured-data"
import { fetchProductTranslations, applyProductLocalizations } from "@/lib/i18n/product"
import { fetchCategoryTranslations } from "@/lib/i18n/category"
import { localizeCategoryName } from "@/lib/i18n/category-labels"
import { categoryPath } from "@/lib/categories/slug"
import { collectCategoryBranch, listCategoryTree, resolveCategoryBySlug } from "@/lib/categories/query"
import {
  storefrontCategoryWhere,
  storefrontPriceWhere,
  storefrontProductOrderBy,
  toDisplayProduct,
} from "@/lib/products/storefront"
import type { Metadata } from "next"

interface Props {
  params: Promise<{ slug: string; locale: string }>
  searchParams: Promise<{ sort?: string; price?: string; q?: string }>
}

export const revalidate = 3600

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = await params
  const resolved = await resolveCategoryBySlug(slug)
  if (!resolved) return {}
  const { category, canonicalSlug } = resolved
  const tr = await fetchCategoryTranslations([category.id], locale)
  const categoryName = localizeCategoryName(locale, category.slug, category.name, tr.get(category.id))
  const seo = await getSiteSeo()
  return genMeta({
    title: category.seoTitle || `${categoryName} | Products`,
    description: category.seoDescription || category.description || `Shop ${categoryName}`,
    keywords: category.seoKeywords || categoryName,
    ogImage: category.image || undefined,
    siteName: seo.siteName,
    siteDescription: seo.siteDescription,
    canonical: categoryPath(canonicalSlug),
    locale,
  })
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug, locale } = await params
  const { sort, price, q } = await searchParams
  const t = await getTranslations("category")
  const tc = await getTranslations("common")
  const tp = await getTranslations("products")

  // Slugs entered as free text ("led lighting") are matched and then 301'd to
  // the canonical URL, so old links and sitemap URLs never 404.
  const resolved = await resolveCategoryBySlug(slug)
  if (!resolved) notFound()
  const { category, canonicalSlug, isCanonicalRequest } = resolved
  if (!isCanonicalRequest) {
    const qs = new URLSearchParams()
    for (const [key, value] of Object.entries({ sort, price, q })) {
      if (value) qs.set(key, value)
    }
    const suffix = qs.toString()
    permanentRedirect(`/${locale}${categoryPath(canonicalSlug)}${suffix ? `?${suffix}` : ""}`)
  }

  const allCategories = await listCategoryTree()
  // Products of the whole branch, filtered exactly like /products does.
  const branch = collectCategoryBranch(
    allCategories.filter((c) => c.isActive),
    category.id
  )
  const products = (
    await prisma.product.findMany({
      where: {
        AND: [
          storefrontCategoryWhere(Array.from(branch)),
          storefrontPriceWhere(price),
          ...(q
            ? [
                {
                  OR: [
                    { name: { contains: q, mode: "insensitive" as const } },
                    { description: { contains: q, mode: "insensitive" as const } },
                  ],
                },
              ]
            : []),
        ],
      },
      orderBy: storefrontProductOrderBy(sort),
      include: { images: { take: 1 } },
    })
  ).map(toDisplayProduct)

  const translations = await fetchProductTranslations(products.map((p) => p.id), locale)
  const localizedProducts = applyProductLocalizations(products, translations)

  const catTranslations = await fetchCategoryTranslations(
    allCategories.map((c) => c.id),
    locale
  )
  const categoryName = localizeCategoryName(
    locale,
    category.slug,
    category.name,
    catTranslations.get(category.id)
  )

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://commoditychina.com"
  const path = categoryPath(canonicalSlug)
  const categoryUrl = `${baseUrl}/${locale}${path}`
  const children = allCategories.filter((c) => c.parentId === category.id && c.isActive)
  const productCount = products.length

  const schemas = [
    breadcrumbSchema([
      { name: tc("home"), url: `${baseUrl}/${locale}` },
      { name: tp("title"), url: `${baseUrl}/${locale}/products` },
      { name: categoryName, url: categoryUrl },
    ]),
    productGroupSchema({
      name: categoryName,
      description: category.description || categoryName,
      url: categoryUrl,
      image: category.image || undefined,
      products: localizedProducts.map((p) => ({
        name: p.name,
        url: `${baseUrl}/${locale}/products/${p.slug}`,
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
                { label: tp("title"), href: "/products" },
                { label: categoryName },
              ]}
              className="mb-6"
            />
            <h1 className="heading-xl mb-6">{categoryName}</h1>
            {category.description && (
              <p className="text-body max-w-2xl">{category.description}</p>
            )}
            <p className="text-sm text-stone mt-4">
              {t("productCount", { count: productCount })}
            </p>
            {children.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-6">
                {children.map((child) => (
                  <Link
                    key={child.id}
                    href={categoryPath(child.slug, child.name)}
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
          {productCount === 0 ? (
            <div className="text-center text-sm text-stone py-12">
              {t("noProducts")}
            </div>
          ) : (
            <div className="grid md:grid-cols-[220px_1fr] gap-8 lg:gap-12">
              <aside className="hidden md:block">
                <ProductFilters basePath={path} />
              </aside>
              <div>
                <ProductGrid products={localizedProducts} />
              </div>
            </div>
          )}
        </Container>
      </div>
    </>
  )
}
