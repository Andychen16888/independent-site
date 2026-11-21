import { prisma } from "@/lib/db/prisma"
import { getSiteSettings } from "@/lib/settings/settings"
import { getGroupedSiteImages } from "@/lib/settings/site-images"
import { getTranslations } from "next-intl/server"
import { fetchProductTranslations, applyProductLocalizations } from "@/lib/i18n/product"
import { fetchCategoryTranslations } from "@/lib/i18n/category"
import { fetchBannerTranslations } from "@/lib/i18n/banner"
import { HeroBanner } from "@/components/home/HeroBanner"
import { BrandStory } from "@/components/home/BrandStory"
import { FeaturedCategories } from "@/components/home/FeaturedCategories"
import { ProductCarousel } from "@/components/product/ProductCarousel"
import { localizeCategoryName } from "@/lib/i18n/category-labels"
import { categoryPath } from "@/lib/categories/slug"
import {
  DEFAULT_BRAND_STORY,
  DEFAULT_FEATURED_CATEGORIES,
  DEFAULT_HERO_SLIDES,
  type BrandStoryContent,
  type FeaturedCategory,
  type HeroSlide,
} from "@/lib/home-content"

export const revalidate = 3600

function parseJson<T>(value: string | undefined, fallback: T): T {
  if (!value) return fallback
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const useDbContent = locale === "en"
  const settings = await getSiteSettings()
  const t = await getTranslations("home")
  const siteImages = await getGroupedSiteImages()

  const mapProduct = (p: any) => ({
    ...p,
    unitPrice: p.unitPrice != null ? Number(p.unitPrice) : null,
    originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
  })

  const [banners, featuredCats, recommendedProductsRaw] = await Promise.all([
    prisma.banner.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
    prisma.category.findMany({
      where: { isActive: true, isFeatured: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: { _count: { select: { products: true } } },
    }),
    prisma.product
      .findMany({
        where: {
          status: "ACTIVE",
          deletedAt: null,
          OR: [{ isHomeFeatured: true }, { isBestSeller: true }],
        },
        orderBy: [{ isHomeFeatured: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
        take: 10,
        include: { images: { take: 1 } },
      })
      .then((products) => products.map(mapProduct)),
  ])

  const [productTranslations, categoryTranslations, bannerTranslations] = await Promise.all([
    fetchProductTranslations(recommendedProductsRaw.map((p) => p.id), locale),
    fetchCategoryTranslations(featuredCats.map((c) => c.id), locale),
    fetchBannerTranslations(banners.map((b) => b.id), locale),
  ])

  const recommendedProducts = applyProductLocalizations(recommendedProductsRaw, productTranslations)

  const defaultSlides = (t.raw("hero.slides") as Record<string, string>[]).map((s, i) => ({
    title: s.title,
    subtitle: s.subtitle,
    description: s.description,
    cta: s.cta,
    href: DEFAULT_HERO_SLIDES[i]?.href,
    bg: DEFAULT_HERO_SLIDES[i]?.bg,
    image: DEFAULT_HERO_SLIDES[i]?.image,
    align: DEFAULT_HERO_SLIDES[i]?.align,
  }))

  const heroSlides: HeroSlide[] = banners.length
    ? banners.map((b, i) => {
        const tr = bannerTranslations.get(b.id)
        const fb = defaultSlides[i]
        if (useDbContent) {
          return {
            title: b.title,
            subtitle: b.eyebrow || b.subtitle || undefined,
            description: b.description || undefined,
            cta: b.ctaText || undefined,
            href: b.link || undefined,
            image: b.image || fb?.image || undefined,
            align: b.alignment || "left",
          }
        }
        return {
          title: tr?.title || fb?.title || b.title,
          subtitle: tr?.eyebrow || tr?.subtitle || fb?.subtitle || b.eyebrow || b.subtitle || undefined,
          description: tr?.description || fb?.description || b.description || undefined,
          cta: tr?.ctaText || fb?.cta || b.ctaText || undefined,
          href: tr?.link || b.link || undefined,
          image: b.image || fb?.image || undefined,
          align: b.alignment || "left",
        }
      })
    : defaultSlides

  const featured: FeaturedCategory[] = featuredCats.map((c) => ({
    title: localizeCategoryName(locale, c.slug, c.name, categoryTranslations.get(c.id)),
    description: c.description || undefined,
    href: categoryPath(c.slug, c.name),
    image: c.image || undefined,
  }))

  const featuredFallback: FeaturedCategory[] = DEFAULT_FEATURED_CATEGORIES.map((d, i) => ({
    ...d,
    ...(((t.raw("featuredCategories.cards") as Record<string, string>[])[i] || {}) as object),
  }))

  const featuredCategories: FeaturedCategory[] = featured.length > 0 ? featured : featuredFallback

  const featuredEyebrow = useDbContent
    ? settings["content.featuredEyebrow"] || t("featuredCategories.eyebrow")
    : t("featuredCategories.eyebrow")
  const featuredHeading = useDbContent
    ? settings["content.featuredHeading"] || t("featuredCategories.heading")
    : t("featuredCategories.heading")
  const featuredTagline = useDbContent ? settings["content.featuredTagline"] || undefined : undefined

  const brandStoryRaw = t.raw("brandStory") as Record<string, unknown>
  const brandStoryFallback: BrandStoryContent = {
    ...DEFAULT_BRAND_STORY,
    ...(brandStoryRaw as object),
    ctaLabel: (brandStoryRaw.cta as string) || DEFAULT_BRAND_STORY.ctaLabel,
    ctaHref: DEFAULT_BRAND_STORY.ctaHref,
  }
  const brandStory = useDbContent
    ? parseJson<BrandStoryContent | null>(settings["content.brandStory"], null)
    : null

  return (
    <>
      <HeroBanner slides={heroSlides} images={siteImages.hero} />
      <BrandStory content={brandStory || brandStoryFallback} image={siteImages.about[0]} />
      {featuredCategories.length > 0 && (
        <FeaturedCategories
          categories={featuredCategories}
          eyebrow={featuredEyebrow}
          heading={featuredHeading}
          tagline={featuredTagline}
        />
      )}
      {recommendedProducts.length > 0 && (
        <ProductCarousel
          title={t("carouselFeatured.title")}
          subtitle={t("carouselFeatured.subtitle")}
          products={recommendedProducts}
        />
      )}
    </>
  )
}
