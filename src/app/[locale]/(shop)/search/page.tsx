import { prisma } from "@/lib/db/prisma"
import { getTranslations } from "next-intl/server"
import { Container } from "@/components/ui/Container"
import { Breadcrumb } from "@/components/ui/Breadcrumb"
import { ProductGrid } from "@/components/product/ProductGrid"
import { generateMetadata as genMeta } from "@/lib/seo/generate-metadata"
import { fetchProductTranslations, applyProductLocalizations } from "@/lib/i18n/product"
import type { Metadata } from "next"

interface Props {
  params: Promise<{ slug: string; locale: string }>
  searchParams: Promise<{ q?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "search" })
  return genMeta({
    title: t("title"),
    description: t("description"),
    noindex: true,
    nofollow: true,
    locale,
  })
}

export default async function SearchPage({ params, searchParams }: Props) {
  const { locale } = await params
  const { q } = await searchParams
  const t = await getTranslations("search")
  const tc = await getTranslations("common")

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

  const translations = await fetchProductTranslations(products.map((p) => p.id), locale)
  const localizedProducts = applyProductLocalizations(products, translations)

  return (
    <div className="min-h-screen">
      <Container>
        <Breadcrumb
          items={[{ label: tc("home"), href: "/" }, { label: t("title") }]}
          className="mb-8"
        />
        <h1 className="heading-xl mb-4">
          {q ? t("resultsFor", { query: q }) : t("title")}
        </h1>
        <p className="text-body mb-12">
          {q
            ? t("showingResults", { count: products.length, query: q })
            : t("enterTerm")}
        </p>
        <ProductGrid products={localizedProducts} />
      </Container>
    </div>
  )
}