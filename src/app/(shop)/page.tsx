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

export default function HomePage() {
  return (
    <>
      <HeroBanner />
      <BrandStory />
      <FeaturedCategories />
      <PeptideSkincare />
      <ProductCarousel
        title="Best Sellers"
        subtitle="Our most-loved products, chosen by you"
        filter="bestseller"
      />
      <HandmadeLiving />
      <Testimonials />
      <InstagramFeed />
      <NewsletterSection />
      <SEOSection />
    </>
  )
}
