import { Container } from "@/components/ui/Container"
import { Breadcrumb } from "@/components/ui/Breadcrumb"
import { WishlistContent } from "@/components/account/WishlistContent"
import { generateMetadata } from "@/lib/seo/generate-metadata"

export const metadata = generateMetadata({
  title: "Wishlist",
  description: "Save your favorite products and shop them anytime.",
  noindex: true,
  nofollow: true,
})

export default function WishlistPage() {
  return (
    <div className="min-h-screen">
      <Container>
        <Breadcrumb
          items={[{ label: "Home", href: "/" }, { label: "Wishlist" }]}
          className="mb-8"
        />
        <h1 className="heading-xl mb-12">Wishlist</h1>
        <WishlistContent />
      </Container>
    </div>
  )
}
