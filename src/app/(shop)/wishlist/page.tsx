import { Container } from "@/components/ui/Container"
import { Breadcrumb } from "@/components/ui/Breadcrumb"
import { WishlistContent } from "@/components/account/WishlistContent"

export default function WishlistPage() {
  return (
    <div className="pt-[100px] md:pt-[116px] min-h-screen">
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
