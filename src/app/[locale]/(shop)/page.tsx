import { prisma } from "@/lib/db/prisma"
import { getSiteSettings, getSiteSeo } from "@/lib/settings/settings"
import { getTranslations } from "next-intl/server"
import { HeroBanner } from "@/components/home/HeroBanner"
import { BrandStory } from "@/components/home/BrandStory"
import { FeaturedCategories } from "@/components/home/FeaturedCategories"
import { PromoFeatureSection } from "@/components/home/FactoryDirect"
import { CollectionGallerySection } from "@/components/home/EssentialsGallery"
import { Testimonials } from "@/components/home/Testimonials"
import { InstagramFeed } from "@/components/home/InstagramFeed"
import { NewsletterSection } from "@/components/home/NewsletterSection"
import { SEOSection, type SEOLink } from "@/components/home/SEOSection"
import { ProductCarousel } from "@/components/product/ProductCarousel"
import {
  DEFAULT_FEATURED_CATEGORIES,
  DEFAULT_COLLECTIONS,
  DEFAULT_HERO_SLIDES,
  DEFAULT_BRAND_STORY,
  DEFAULT_PROMO,
  DEFAULT_TESTIMONIALS,
  DEFAULT_INSTAGRAM,
  type HeroSlide,
  type FeaturedCategory,
  type PromoContent,
  type CollectionContent,
  type BrandStoryContent,
  type Testimonial,
  type InstagramConfig,
} from "@/lib/home-content"

function parseJson<T>(value: string | undefined, fallback: T): T {
  if (!value) return fallback
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

export default async function HomePage() {
  const settings = await getSiteSettings()
  const t = await getTranslations("home")
  const tl = await getTranslations("home.links")

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
    unitPrice: Number(p.unitPrice),
    originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
  })

  // Hero slides from DB banners (fall back to localized default hero slides).
  const heroSlides: HeroSlide[] = banners.length
    ? banners.map((b) => ({
        title: b.title,
        subtitle: b.eyebrow || b.subtitle || undefined,
        description: b.description || undefined,
        cta: b.ctaText || undefined,
        href: b.link || undefined,
        image: b.image || undefined,
        align: b.alignment || "left",
      }))
    : (t.raw("hero.slides") as Record<string, string>[]).map((s, i) => ({
        title: s.title,
        subtitle: s.subtitle,
        description: s.description,
        cta: s.cta,
        href: DEFAULT_HERO_SLIDES[i]?.href,
        bg: DEFAULT_HERO_SLIDES[i]?.bg,
        image: DEFAULT_HERO_SLIDES[i]?.image,
        align: DEFAULT_HERO_SLIDES[i]?.align,
      }))

  const featured: FeaturedCategory[] = featuredCats.map((c) => ({
    title: c.name,
    subtitle: c.type,
    description: c.description || undefined,
    href: `/categories/${c.slug}`,
    image: c.image || undefined,
  }))

  const featuredFallback: FeaturedCategory[] = DEFAULT_FEATURED_CATEGORIES.map((d, i) => ({
    ...d,
    ...(((t.raw("featuredCategories.cards") as Record<string, string>[])[i] || {}) as object),
  }))

  const featuredCategories = featured.length > 0 ? featured : featuredFallback

  const promo1 = parseJson<PromoContent | null>(settings["content.promo1"], null)
  const promo2 = parseJson<CollectionContent | null>(settings["content.promo2"], null)
  const brandStory = parseJson<BrandStoryContent | null>(settings["content.brandStory"], null)
  const testimonials = parseJson<Testimonial[] | null>(settings["content.testimonials"], null)
  const instagram = parseJson<InstagramConfig | null>(settings["content.instagram"], null)

  const promoFallback: PromoContent = {
    ...DEFAULT_PROMO,
    ...(t.raw("promo") as object),
  }

  const brandStoryFallback: BrandStoryContent = {
    ...DEFAULT_BRAND_STORY,
    ...(t.raw("brandStory") as object),
  }

  const coll = t.raw("collections") as Record<string, unknown> & {
    items?: Record<string, string>[]
  }
  const collectionsFallback: CollectionContent = {
    eyebrow: coll.eyebrow as string,
    title: coll.title as string,
    tagline: coll.tagline as string,
    collections: (coll.items || []).map((item, i) => ({
      title: item.title,
      description: item.description,
      href: DEFAULT_COLLECTIONS.collections?.[i]?.href || "/categories/home-kitchen",
    })),
    ctaLabel: coll.cta as string,
    ctaHref: DEFAULT_COLLECTIONS.ctaHref,
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
    t("seoParagraph", { siteName: getSiteSeoResult.siteName }),
  ].filter(Boolean)

  const featuredLinks: SEOLink[] = [
    ...featuredCats.map((c) => ({ label: c.name, href: `/categories/${c.slug}` })),
    { label: tl("allProducts"), href: "/products" },
    { label: tl("faq"), href: "/faq" },
    { label: tl("aboutUs"), href: "/pages/about" },
  ]
  const seoLinks: SEOLink[] = [
    ...featuredLinks,
    ...(featuredCats.some((c) => c.slug === "electronics")
      ? [{ label: tl("importingGuide"), href: "/blog" }]
      : []),
  ]

  return (
    <>
      <HeroBanner slides={heroSlides} />
      <BrandStory content={brandStory || brandStoryFallback} />
      <FeaturedCategories
        categories={featuredCategories}
        eyebrow={settings["content.featuredEyebrow"] || t("featuredCategories.eyebrow")}
        heading={settings["content.featuredHeading"] || t("featuredCategories.heading")}
        tagline={settings["content.featuredTagline"] || undefined}
      />
      <PromoFeatureSection promo={promo1 || promoFallback} />
      {homeFeatured.length > 0 && (
        <ProductCarousel
          title={t("carouselFeatured.title")}
          subtitle={t("carouselFeatured.subtitle")}
          products={homeFeatured.map(mapProduct)}
        />
      )}
      <ProductCarousel
        title={t("carouselBestSellers.title")}
        subtitle={t("carouselBestSellers.subtitle")}
        products={bestSellers.length ? bestSellers.map(mapProduct) : homeFeatured.map(mapProduct)}
      />
      <CollectionGallerySection content={promo2 || collectionsFallback} />
      <Testimonials
        items={testimonials || testimonialsFallback}
        eyebrow={t("testimonials.eyebrow")}
        heading={t("testimonials.heading")}
      />
      <InstagramFeed config={instagram || instagramFallback} />
      <NewsletterSection />
      <SEOSection
        heading={settings["seo.homeTitle"] || getSiteSeoResult.homepageTitle || t("seo.heading")}
        paragraphs={seoParagraphs}
        links={seoLinks}
      />
    </>
  )
}