import { Container } from "@/components/ui/Container"
import { Breadcrumb } from "@/components/ui/Breadcrumb"
import { AffiliateProgram } from "@/components/affiliate/AffiliateProgram"
import { generateMetadata } from "@/lib/seo/generate-metadata"

export const metadata = generateMetadata({
  title: "Affiliate Program",
  description: "Join our affiliate program and earn commissions by sharing products you love.",
  canonical: "/affiliate",
})

export default function AffiliatePage() {
  return (
    <div className="min-h-screen">
      <Container>
        <Breadcrumb
          items={[{ label: "Home", href: "/" }, { label: "Affiliate Program" }]}
          className="mb-8"
        />
        <AffiliateProgram />
      </Container>
    </div>
  )
}
