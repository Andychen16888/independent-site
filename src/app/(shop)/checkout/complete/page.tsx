import { Container } from "@/components/ui/Container"
import Link from "next/link"
import { HiOutlineCheckCircle } from "react-icons/hi2"

export default function CheckoutCompletePage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Container>
        <div className="max-w-lg mx-auto text-center">
          <div className="w-16 h-16 mx-auto mb-6 bg-sage/20 rounded-full flex items-center justify-center">
            <HiOutlineCheckCircle className="w-8 h-8 text-sage" />
          </div>
          <h1 className="heading-xl mb-4">Order Confirmed</h1>
          <p className="text-body mb-8">
            Thank you for your purchase. You&apos;ll receive a confirmation email shortly.
          </p>
          <div className="space-y-4">
            <Link href="/account/orders" className="btn-primary block">
              View Order
            </Link>
            <Link href="/" className="btn-outline block">
              Continue Shopping
            </Link>
          </div>
        </div>
      </Container>
    </div>
  )
}
