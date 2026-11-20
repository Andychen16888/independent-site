import { prisma } from "@/lib/db/prisma"
import { getSiteSettings, getSiteSeo } from "@/lib/settings/settings"
import { getGroupedSiteImages } from "@/lib/settings/site-images"
import { getTranslations } from "next-intl/server"
import { fetchProductTranslations, applyProductLocalizations } from "@/lib/i18n/product"
import { fetchCategoryTranslations } from "@/lib/i18n/category"
import { fetchBannerTranslations } from "@/lib/i18n/banner"
import { HeroBanner } from "@/components/home/HeroBanner"
import { BrandStory } from "@/components/home/BrandStory"
import { FeaturedCategories } from "@/components/home/FeaturedCategories"
import { SupplyChain } from "@/components/home/SupplyChain"
import { ProcessFlow } from "@/components/home/ProcessFlow"
import { PortBanner } from "@/components/home/PortBanner"
import { TrustQuality } from "@/components/home/TrustQuality"
import { GlobalNetwork } from "@/components/home/GlobalNetwork"
import { PromoFeatureSection } from "@/components/home/FactoryDirect"
import { Testimonials } from "@/components/home/Testimonials"
import { InstagramFeed } from "@/components/home/InstagramFeed"
import { NewsletterSection } from "@/components/home/NewsletterSection"
import { SEOSection, type SEOLink } from "@/components/home/SEOSection"
import { ProductCarousel } from "@/components/product/ProductCarousel"
import { getSiteContent, type SiteContent } from "@/config/site-content"
import { localizeCategoryName } from "@/lib/i18n/category-labels"
import { categoryPath } from "@/lib/categories/slug"
import {
  DEFAULT_FEATURED_CATEGORIES,
  DEFAULT_HERO_SLIDES,
  DEFAULT_BRAND_STORY,
  DEFAULT_PROMO,
  DEFAULT_TESTIMONIALS,
  DEFAULT_INSTAGRAM,
  type HeroSlide,
  type FeaturedCategory,
  type PromoContent,
  type BrandStoryContent,
  type Testimonial,
  type InstagramConfig,
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
  const tl = await getTranslations("home.links")
  const site = getSiteContent(locale)
  const dbContent = <T,>(key: string) => parseJson<Partial<T> | null>(settings[key], null)
  const cta = { ...site.cta, ...(dbContent<SiteContent["cta"]>("content.cta") || {}) }
  const supplyChainContent = {
    ...site.supplyChain,
    ...(dbContent<SiteContent["supplyChain"]>("content.supplyChain") || {}),
  }
  const processContent = { ...site.process, ...(dbContent<SiteContent["process"]>("content.process") || {}) }
  const portContent = { ...site.port, ...(dbContent<SiteContent["port"]>("content.port") || {}) }
  const trustContent = { ...site.trust, ...(dbContent<SiteContent["trust"]>("content.trust") || {}) }
  const globalContent = { ...site.global, ...(dbContent<SiteContent["global"]>("content.global") || {}) }
  const siteImages = await getGroupedSiteImages()

  const [banners, featuredCats, bestSellers, homeFeatured] = await Promise.all([
    prisma.banner.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
    prisma.category.findMany({
      where: { isActive: true, isFeatured: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: { _count: { select: { products: true } } },
    }),
    prisma.product.findMany({
      where: { status: "ACTIVE", deletedAt: null, isBestSeller: true },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { images: { take: 1 } },
    }),
    prisma.product.findMany({
      where: { status: "ACTIVE", deletedAt: null, isHomeFeatured: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      take: 10,
      include: { images: { take: 1 } },
    }),
  ])

  const mapProduct = (p: any) => ({
    ...p,
    unitPrice: p.unitPrice != null ? Number(p.unitPrice) : null,
    originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
  })

  const bestSellerMapped = bestSellers.map(mapProduct)
  const homeFeaturedMapped = homeFeatured.map(mapProduct)
  const translations = await fetchProductTranslations(
    [...bestSellerMapped, ...homeFeaturedMapped].map((p) => p.id),
    locale
  )
  const localizedBestSellers = applyProductLocalizations(bestSellerMapped, translations)
  const localizedHomeFeatured = applyProductLocalizations(homeFeaturedMapped, translations)
  const categoryTranslations = await fetchCategoryTranslations(
    featuredCats.map((c) => c.id),
    locale
  )
  const bannerTranslations = await fetchBannerTranslations(
    banners.map((b) => b.id),
    locale
  )

  // Hero slides: DB banners provide text/images/links/alignment. On the default
  // locale the English DB text wins; on other locales a DB translation wins,
  // then the localized messages, then the English DB text.
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

  const featuredCategories: FeaturedCategory[] =
    featured.length > 0 ? featured : featuredFallback

  const featuredEyebrow = useDbContent
    ? settings["content.featuredEyebrow"] || t("featuredCategories.eyebrow")
    : t("featuredCategories.eyebrow")
  const featuredHeading = useDbContent
    ? settings["content.featuredHeading"] || t("featuredCategories.heading")
    : t("featuredCategories.heading")
  const featuredTagline = useDbContent
    ? settings["content.featuredTagline"] || undefined
    : undefined

  const promo1 = useDbContent ? parseJson<PromoContent | null>(settings["content.promo1"], null) : null
  const brandStory = useDbContent ? parseJson<BrandStoryContent | null>(settings["content.brandStory"], null) : null
  const testimonials = useDbContent ? parseJson<Testimonial[] | null>(settings["content.testimonials"], null) : null
  const instagram = useDbContent ? parseJson<InstagramConfig | null>(settings["content.instagram"], null) : null

  const promoRaw = t.raw("promo") as Record<string, unknown>
  const promoFallback: PromoContent = {
    ...DEFAULT_PROMO,
    ...(promoRaw as object),
    ctaLabel: (promoRaw.cta as string) || DEFAULT_PROMO.ctaLabel,
    ctaHref: DEFAULT_PROMO.ctaHref,
  }

  const brandStoryRaw = t.raw("brandStory") as Record<string, unknown>
  const brandStoryFallback: BrandStoryContent = {
    ...DEFAULT_BRAND_STORY,
    ...(brandStoryRaw as object),
    ctaLabel: (brandStoryRaw.cta as string) || DEFAULT_BRAND_STORY.ctaLabel,
    ctaHref: DEFAULT_BRAND_STORY.ctaHref,
  }

  const testimonialsFallback: Testimonial[] = (t.raw("testimonials.items") as Record<string, string>[]).map(
    (item, i) => ({
      name: item.name,
      text: item.text,
      location: item.location,
      product: item.product,
      rating: DEFAULT_TESTIMONIALS[i]?.rating ?? 5,
    })
  )

  const instagramFallback: InstagramConfig = {
    ...DEFAULT_INSTAGRAM,
    tagline: (t.raw("instagram") as Record<string, string>).tagline,
  }

  const siteDescription = settings["site.description"]

  const getSiteSeoResult = await getSiteSeo()
  const seoParagraphs = [
    siteDescription || getSiteSeoResult.homepageDescription || getSiteSeoResult.siteDescription,
  ].filter(Boolean)

  const seoCategoryLinks: SEOLink[] = featuredCats.length > 0
    ? featuredCats.map((c) => ({ label: c.name, href: categoryPath(c.slug, c.name) }))
    : featuredFallback.map((f) => ({ label: f.title, href: f.href }))

  const featuredLinks: SEOLink[] = [
    ...seoCategoryLinks,
    { label: tl("allProducts"), href: "/products" },
    { label: tl("faq"), href: "/faq" },
    { label: tl("aboutUs"), href: "/pages/about" },
  ]
  const seoLinks: SEOLink[] = [...featuredLinks, { label: tl("importingGuide"), href: "/blog" }]

  return (
    <>
      <HeroBanner slides={heroSlides} images={siteImages.hero} />
      {featuredCategories.length > 0 && (
        <FeaturedCategories
          categories={featuredCategories}
          eyebrow={featuredEyebrow}
          heading={featuredHeading}
          tagline={featuredTagline}
        />
      )}
      <SupplyChain content={supplyChainContent} images={siteImages.supplyChain} />
      {homeFeatured.length > 0 && (
        <ProductCarousel
          title={t("carouselFeatured.title")}
          subtitle={t("carouselFeatured.subtitle")}
          products={localizedHomeFeatured}
        />
      )}
      <ProcessFlow content={processContent} />
      <BrandStory content={brandStory || brandStoryFallback} image={siteImages.about[0]} />
      <PortBanner content={portContent} ctaLabel={cta.requestQuote} image={siteImages.port} />
      <ProductCarousel
        title={t("carouselBestSellers.title")}
        subtitle={t("carouselBestSellers.subtitle")}
        products={localizedBestSellers.length ? localizedBestSellers : localizedHomeFeatured}
      />
      <TrustQuality content={trustContent} />
      <GlobalNetwork content={globalContent} image={siteImages.global} />
      <PromoFeatureSection promo={promo1 || promoFallback} image={siteImages.about[3]} />
      <Testimonials
        items={testimonials || testimonialsFallback}
        eyebrow={t("testimonials.eyebrow")}
        heading={t("testimonials.heading")}
      />
      <InstagramFeed config={instagram || instagramFallback} />
      <NewsletterSection />
      <SEOSection
        heading={useDbContent ? settings["seo.homeTitle"] || getSiteSeoResult.homepageTitle || t("seo.heading") : t("seo.heading")}
        paragraphs={seoParagraphs}
        links={seoLinks}
      />
    </>
  )
}
