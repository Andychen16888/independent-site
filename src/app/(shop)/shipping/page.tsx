import { Container } from "@/components/ui/Container"
import { generateMetadata } from "@/lib/seo/generate-metadata"

export const metadata = generateMetadata({
  title: "Shipping & Returns",
  description: "Learn about our shipping policies, delivery times, and return process.",
})

export default function ShippingPage() {
  return (
    <div className="pt-[100px] md:pt-[116px] min-h-screen">
      <Container>
        <div className="max-w-3xl mx-auto py-12 md:py-16">
          <span className="text-caption mb-4 block">Policies</span>
          <h1 className="heading-xl mb-8">Shipping & Returns</h1>

          <section className="mb-12">
            <h2 className="heading-sm mb-4">Shipping</h2>
            <div className="space-y-4 text-body">
              <p>We offer worldwide shipping with tracking on all orders.</p>
              <div className="bg-cream p-6 space-y-3">
                <div className="flex justify-between">
                  <span>Standard (5-8 business days)</span>
                  <span>$5.99</span>
                </div>
                <div className="flex justify-between">
                  <span>Express (2-3 business days)</span>
                  <span>$15.99</span>
                </div>
                <div className="flex justify-between font-medium border-t border-mist pt-3">
                  <span>Free Standard Shipping</span>
                  <span>On orders over $100</span>
                </div>
              </div>
              <p>Orders are processed within 1-2 business days. You will receive a tracking number once your order ships.</p>
              <p>International orders may be subject to customs duties and taxes, which are the responsibility of the customer.</p>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="heading-sm mb-4">Returns</h2>
            <div className="space-y-4 text-body">
              <p>We want you to love your purchase. If you&apos;re not completely satisfied, we offer:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>30-day return window from delivery date</li>
                <li>Free returns on all domestic orders</li>
                <li>Products must be unused and in original packaging</li>
                <li>Refunds processed within 5-7 business days after receipt</li>
              </ul>
              <p>To initiate a return, please contact our support team with your order number.</p>
            </div>
          </section>

          <section>
            <h2 className="heading-sm mb-4">Exchanges</h2>
            <div className="text-body space-y-4">
              <p>We offer one-time exchanges on all products. If you received a defective or incorrect item, we will cover return shipping and send a replacement immediately.</p>
            </div>
          </section>
        </div>
      </Container>
    </div>
  )
}
