import { Container } from "@/components/ui/Container"
import { generateMetadata } from "@/lib/seo/generate-metadata"

export const metadata = generateMetadata({
  title: "Privacy Policy",
  description: "Our commitment to protecting your privacy and personal information.",
})

export default function PrivacyPage() {
  return (
    <div className="pt-[100px] md:pt-[116px] min-h-screen">
      <Container>
        <div className="max-w-3xl mx-auto py-12 md:py-16">
          <span className="text-caption mb-4 block">Legal</span>
          <h1 className="heading-xl mb-8">Privacy Policy</h1>

          <div className="space-y-6 text-body leading-relaxed">
            <p>Last updated: May 2026</p>

            <section>
              <h2 className="heading-sm mb-3">Information We Collect</h2>
              <p>We collect information you provide directly to us, including your name, email address, shipping address, and payment information when you make a purchase or create an account.</p>
            </section>

            <section>
              <h2 className="heading-sm mb-3">How We Use Your Information</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Process and fulfill your orders</li>
                <li>Send you order confirmations and updates</li>
                <li>Respond to your customer service inquiries</li>
                <li>Send marketing communications (with your consent)</li>
                <li>Improve our products and services</li>
              </ul>
            </section>

            <section>
              <h2 className="heading-sm mb-3">Payment Information</h2>
              <p>All payment transactions are processed securely through Stripe or PayPal. We do not store your full credit card details on our servers.</p>
            </section>

            <section>
              <h2 className="heading-sm mb-3">Data Protection</h2>
              <p>We implement industry-standard security measures to protect your personal information, including SSL encryption and secure data storage.</p>
            </section>

            <section>
              <h2 className="heading-sm mb-3">Contact</h2>
              <p>For privacy-related inquiries, please contact us at privacy@orientalbeauty.com.</p>
            </section>
          </div>
        </div>
      </Container>
    </div>
  )
}
