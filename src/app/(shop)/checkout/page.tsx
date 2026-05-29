import { Container } from "@/components/ui/Container"
import { Breadcrumb } from "@/components/ui/Breadcrumb"
import { CheckoutForm } from "@/components/checkout/CheckoutForm"
import { generateMetadata } from "@/lib/seo/generate-metadata"

export const metadata = generateMetadata({
  title: "Checkout",
  description: "Complete your order securely.",
})

export default function CheckoutPage() {
  return (
    <div className="min-h-screen">
      <Container>
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Cart", href: "/cart" },
            { label: "Checkout" },
          ]}
          className="mb-8"
        />
        <h1 className="heading-xl mb-12">Checkout</h1>
        <CheckoutForm />
      </Container>
    </div>
  )
}
