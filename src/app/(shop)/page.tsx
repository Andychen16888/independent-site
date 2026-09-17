import { prisma } from "@/lib/db/prisma"
import { getSiteSettings, getSiteSeo } from "@/lib/settings/settings"
import { HeroBanner, type HeroSlide, DEFAULT_HERO_SLIDES } from "@/components/home/HeroBanner"
import { BrandStory, type BrandStoryContent } from "@/components/home/BrandStory"
import { FeaturedCategories, type FeaturedCategory } from "@/components/home/FeaturedCategories"
import { PromoFeatureSection, type PromoContent } from "@/components/home/FactoryDirect"
import { CollectionGallerySection, type CollectionContent } from "@/components/home/EssentialsGallery"
import { Testimonials, type Testimonial } from "@/components/home/Testimonials"
import { InstagramFeed, type InstagramConfig } from "@/components/home/InstagramFeed"
import { NewsletterSection } from "@/components/home/NewsletterSection"
import { SEOSection, type SEOLink } from "@/components/home/SEOSection"
import { ProductCarousel } from "@/components/product/ProductCarousel"

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

  // Hero slides from DB banners (fall back to the default hero slides pre-seed).
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
    : DEFAULT_HERO_SLIDES

  const featured: FeaturedCategory[] = featuredCats.map((c) => ({
    title: c.name,
    subtitle: c.type,
    description: c.description || undefined,
    href: `/categories/${c.slug}`,
    image: c.image || undefined,
  }))

  const promo1 = parseJson<PromoContent | null>(settings["content.promo1"], null)
  const promo2 = parseJson<CollectionContent | null>(settings["content.promo2"], null)
  const brandStory = parseJson<BrandStoryContent | null>(settings["content.brandStory"], null)
  const testimonials = parseJson<Testimonial[] | null>(settings["content.testimonials"], null)
  const instagram = parseJson<InstagramConfig | null>(settings["content.instagram"], null)

  const siteDescription = settings["site.description"]

  const getSiteSeoResult = await getSiteSeo()
  const seoParagraphs = [
    siteDescription || getSiteSeoResult.homepageDescription || getSiteSeoResult.siteDescription,
    `Discover the ${getSiteSeoResult.siteName} collection: certified electronics, LED lighting, kitchenware, and everyday household goods. Built for retail shoppers and wholesale B2B buyers alike — shop online, order in bulk, or contact our team for trade pricing and partnership inquiries.`,
  ].filter(Boolean)

  const featuredLinks: SEOLink[] = [
    ...featuredCats.map((c) => ({ label: c.name, href: `/categories/${c.slug}` })),
    { label: "All Products", href: "/products" },
    { label: "FAQ", href: "/faq" },
    { label: "About Us", href: "/pages/about" },
  ]
  const seoLinks: SEOLink[] = [
    ...featuredLinks,
    ...(featuredCats.some((c) => c.slug === "electronics")
      ? [{ label: "Importing Guide", href: "/blog" }]
      : []),
  ]

  return (
    <>
      <HeroBanner slides={heroSlides} />
      <BrandStory content={brandStory || undefined} />
      <FeaturedCategories
        categories={featured.length ? featured : undefined}
        eyebrow={settings["content.featuredEyebrow"] || "Explore"}
        heading={settings["content.featuredHeading"] || "Our Collections"}
        tagline={settings["content.featuredTagline"] || undefined}
      />
      <PromoFeatureSection promo={promo1 || undefined} />
      {homeFeatured.length > 0 && (
        <ProductCarousel
          title="Featured"
          subtitle="Handpicked for you this season"
          products={homeFeatured.map(mapProduct)}
        />
      )}
      <ProductCarousel
        title="Best Sellers"
        subtitle="Our most-loved products, chosen by you"
        products={bestSellers.length ? bestSellers.map(mapProduct) : homeFeatured.map(mapProduct)}
      />
      <CollectionGallerySection content={promo2 || undefined} />
      <Testimonials items={testimonials || undefined} />
      <InstagramFeed config={instagram || undefined} />
      <NewsletterSection />
      <SEOSection
        heading={settings["seo.homeTitle"] || getSiteSeoResult.homepageTitle || undefined}
        paragraphs={seoParagraphs}
        links={seoLinks}
      />
    </>
  )
}