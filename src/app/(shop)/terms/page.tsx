import { Container } from "@/components/ui/Container"
import { generateMetadata } from "@/lib/seo/generate-metadata"

export const metadata = generateMetadata({
  title: "Terms of Service",
  description: "Terms and conditions for using Oriental Beauty.",
})

export default function TermsPage() {
  return (
    <div className="min-h-screen">
      <Container>
        <div className="max-w-3xl mx-auto py-12 md:py-16">
          <span className="text-caption mb-4 block">Legal</span>
          <h1 className="heading-xl mb-8">Terms of Service</h1>

          <div className="space-y-6 text-body leading-relaxed">
            <p>Last updated: May 2026</p>

            <section>
              <h2 className="heading-sm mb-3">General</h2>
              <p>By accessing and using Oriental Beauty, you agree to these terms. If you do not agree, please do not use our services.</p>
            </section>

            <section>
              <h2 className="heading-sm mb-3">Products & Pricing</h2>
              <p>All prices are listed in USD and are subject to change without notice. We reserve the right to modify or discontinue products at any time.</p>
            </section>

            <section>
              <h2 className="heading-sm mb-3">Account Responsibility</h2>
              <p>You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.</p>
            </section>

            <section>
              <h2 className="heading-sm mb-3">Intellectual Property</h2>
              <p>All content on this website, including images, text, and designs, is the property of Oriental Beauty and may not be reproduced without permission.</p>
            </section>

            <section>
              <h2 className="heading-sm mb-3">Limitation of Liability</h2>
              <p>Oriental Beauty shall not be liable for any indirect, incidental, or consequential damages arising from the use of our products or services.</p>
            </section>
          </div>
        </div>
      </Container>
    </div>
  )
}
