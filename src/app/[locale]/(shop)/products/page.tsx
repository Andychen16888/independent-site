import { prisma } from "@/lib/db/prisma"
import { getTranslations } from "next-intl/server"
import { Container } from "@/components/ui/Container"
import { Breadcrumb } from "@/components/ui/Breadcrumb"
import { ProductFilters } from "@/components/product/ProductFilters"
import { ProductGrid } from "@/components/product/ProductGrid"
import { generateMetadata as genMeta } from "@/lib/seo/generate-metadata"
import { breadcrumbSchema } from "@/lib/seo/structured-data"
import { fetchProductTranslations, applyProductLocalizations } from "@/lib/i18n/product"
import type { Metadata } from "next"

interface Props {
  params: Promise<{ slug: string; locale: string }>
  searchParams: Promise<{ sort?: string; price?: string; q?: string }>
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
  const { sort, price, q } = await searchParams
  const t = await getTranslations("products")
  const tc = await getTranslations("common")

  const where: any = { status: "ACTIVE" }

  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ]
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