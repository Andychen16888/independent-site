import { prisma } from "@/lib/db/prisma"
import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import { Container } from "@/components/ui/Container"
import { Breadcrumb } from "@/components/ui/Breadcrumb"
import { ProductFilters } from "@/components/product/ProductFilters"
import { ProductGrid } from "@/components/product/ProductGrid"
import { generateMetadata as genMeta } from "@/lib/seo/generate-metadata"
import { breadcrumbSchema } from "@/lib/seo/structured-data"
import { fetchProductTranslations, applyProductLocalizations } from "@/lib/i18n/product"
import { localizeCategoryName } from "@/lib/i18n/category-labels"
import type { Metadata } from "next"

interface Props {
  params: Promise<{ slug: string; locale: string }>
  searchParams: Promise<{ sort?: string; price?: string; q?: string; category?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "products" })
  return genMeta({
    title: t("title"),
    description: t("metaDescription"),
    canonical: "/products",
    locale,
  })
}

export default async function ProductsPage({ params, searchParams }: Props) {
  const { locale } = await params
  const { sort, price, q, category } = await searchParams
  const t = await getTranslations("products")
  const tc = await getTranslations("common")

  const where: any = { status: "ACTIVE" }

  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ]
  }

  const categoriesRaw = await prisma.category.findMany({
    where: { isActive: true, parentId: null },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: { id: true, name: true, slug: true },
  })

  const categories = categoriesRaw.map((cat) => ({
    ...cat,
    displayName: localizeCategoryName(locale, cat.slug, cat.name),
  }))

  const activeCategory = category
    ? categories.find((c) => c.slug === category)
    : null

  if (activeCategory) {
    where.categories = { some: { categoryId: activeCategory.id } }
  }

  if (price) {
    const [minStr, maxStr] = price.split("-")
    const min = Number(minStr)
    const max = maxStr ? Number(maxStr) : Infinity
    where.unitPrice = { gte: min, ...(max !== Infinity ? { lte: max } : {}) }
  }

  let orderBy: any = { createdAt: "desc" }
  if (sort) {
    switch (sort) {
      case "price-asc":
        orderBy = { unitPrice: "asc" }
        break
      case "price-desc":
        orderBy = { unitPrice: "desc" }
        break
      case "newest":
        orderBy = { createdAt: "desc" }
        break
      case "bestseller":
        orderBy = { isBestSeller: "desc" }
        break
    }
  }

  const products = (await prisma.product.findMany({
    where,
    orderBy,
    include: { images: { take: 1 } },
  })).map((p) => ({
    ...p,
    unitPrice: Number(p.unitPrice),
    originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
  }))

  const translations = await fetchProductTranslations(products.map((p) => p.id), locale)
  const localizedProducts = applyProductLocalizations(products, translations)

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://commoditychina.com"

  const buildProductsHref = (categorySlug?: string) => {
    const qs = new URLSearchParams()
    if (sort) qs.set("sort", sort)
    if (price) qs.set("price", price)
    if (q) qs.set("q", q)
    if (categorySlug) qs.set("category", categorySlug)
    const suffix = qs.toString()
    return suffix ? `/products?${suffix}` : "/products"
  }

  const schemas = [
    breadcrumbSchema([
      { name: tc("home"), url: baseUrl },
      { name: t("title"), url: `${baseUrl}/${locale}/products` },
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
            items={[{ label: tc("home"), href: "/" }, { label: t("title") }]}
            className="mb-8"
          />
          <h1 className="heading-xl mb-4">{t("title")}</h1>
          <p className="text-body mb-12 max-w-2xl">
            {t("description")}
          </p>

          <div className="mb-8 border-b border-mist pb-4">
            <div className="flex flex-wrap gap-2">
              <Link
                href={buildProductsHref()}
                className={`px-4 py-2 text-xs md:text-sm border rounded-full transition-colors ${
                  !activeCategory
                    ? "bg-charcoal text-white border-charcoal"
                    : "bg-white text-stone border-mist hover:border-charcoal hover:text-charcoal"
                }`}
              >
                {tc("allProducts")}
              </Link>
              {categories.map((cat) => {
                const active = activeCategory?.slug === cat.slug
                return (
                  <Link
                    key={cat.id}
                    href={buildProductsHref(cat.slug)}
                    className={`px-4 py-2 text-xs md:text-sm border rounded-full transition-colors ${
                      active
                        ? "bg-charcoal text-white border-charcoal"
                        : "bg-white text-stone border-mist hover:border-charcoal hover:text-charcoal"
                    }`}
                  >
                    {cat.displayName}
                  </Link>
                )
              })}
            </div>
          </div>

          <div className="grid md:grid-cols-[220px_1fr] gap-8 lg:gap-12">
            <aside className="hidden md:block">
              <ProductFilters />
            </aside>
            <div>
              <ProductGrid products={localizedProducts} />
            </div>
          </div>
        </Container>
      </div>
    </>
  )
}
