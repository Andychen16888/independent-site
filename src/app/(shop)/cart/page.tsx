import { Container } from "@/components/ui/Container"
import { Breadcrumb } from "@/components/ui/Breadcrumb"
import { CartContent } from "@/components/cart/CartContent"
import { generateMetadata } from "@/lib/seo/generate-metadata"

export const metadata = generateMetadata({
  title: "Shopping Cart",
  description: "Review your items and proceed to checkout.",
})

export default function CartPage() {
  return (
    <div className="pt-[100px] md:pt-[116px] min-h-screen">
      <Container>
        <Breadcrumb
          items={[{ label: "Home", href: "/" }, { label: "Cart" }]}
          className="mb-8"
        />
        <h1 className="heading-xl mb-12">Shopping Cart</h1>
        <CartContent />
      </Container>
    </div>
  )
}
