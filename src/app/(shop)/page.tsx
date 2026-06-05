import { prisma } from "@/lib/db/prisma"
import { HeroBanner } from "@/components/home/HeroBanner"
import { BrandStory } from "@/components/home/BrandStory"
import { FeaturedCategories } from "@/components/home/FeaturedCategories"
import { PeptideSkincare } from "@/components/home/PeptideSkincare"
import { HandmadeLiving } from "@/components/home/HandmadeLiving"
import { BestSellers } from "@/components/home/BestSellers"
import { Testimonials } from "@/components/home/Testimonials"
import { InstagramFeed } from "@/components/home/InstagramFeed"
import { NewsletterSection } from "@/components/home/NewsletterSection"
import { SEOSection } from "@/components/home/SEOSection"
import { ProductCarousel } from "@/components/product/ProductCarousel"

export default async function HomePage() {
  const bestSellers = (await prisma.product.findMany({
    where: { status: "ACTIVE", isBestSeller: true },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { images: { take: 1 } },
  })).map((p) => ({
    ...p,
    unitPrice: Number(p.unitPrice),
    originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
  }))

  return (
    <>
      <HeroBanner />
      <BrandStory />
      <FeaturedCategories />
      <PeptideSkincare />
      <ProductCarousel
        title="Best Sellers"
        subtitle="Our most-loved products, chosen by you"
        products={bestSellers}
      />
      <HandmadeLiving />
      <Testimonials />
      <InstagramFeed />
      <NewsletterSection />
      <SEOSection />
    </>
  )
}
