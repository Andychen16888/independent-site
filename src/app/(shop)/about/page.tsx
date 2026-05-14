import { Container } from "@/components/ui/Container"
import { generateMetadata } from "@/lib/seo/generate-metadata"

export const metadata = generateMetadata({
  title: "Our Story",
  description: "Discover the story behind Oriental Beauty — where Eastern beauty rituals meet artisanal craftsmanship.",
})

export default function AboutPage() {
  return (
    <div className="pt-24 md:pt-28">
      <div className="bg-cream section-padding">
        <Container>
          <span className="text-caption mb-4 block">Our Story</span>
          <h1 className="heading-xl mb-6">Where East Meets West</h1>
          <p className="text-body max-w-2xl">
            Oriental Beauty was founded on a simple belief — that beauty rituals and 
            the objects we surround ourselves with should nourish both body and spirit.
          </p>
        </Container>
      </div>

      <Container className="section-padding">
        <div className="max-w-3xl mx-auto space-y-8 text-body leading-loose">
          <p>
            Our journey began in the ancient markets of Kyoto, the bustling beauty labs of Seoul, 
            and the quiet ceramics studios of Jingdezhen. We traveled across Asia to discover 
            the traditions, ingredients, and craftsmanship that have stood the test of time.
          </p>
          <p>
            Working alongside dermatologists and peptide researchers, we reimagined traditional 
            botanical formulations through modern science. The result is a skincare line that 
            delivers visible results while honoring centuries of wisdom.
          </p>
          <p>
            Simultaneously, we partnered with master artisans — ceramicists, woodcarvers, 
            and textile weavers — who have spent lifetimes perfecting their craft. Each piece 
            in our Handmade Living collection carries the story of its maker and the tradition 
            it represents.
          </p>
          <p>
            We believe that true luxury is intentional. It&apos;s the serum that transforms your 
            skin while you sleep. It&apos;s the tea bowl that makes your morning ritual feel sacred. 
            It&apos;s the knowledge that what you bring into your home and onto your skin was made 
            with care, by people who respect the earth and honor their craft.
          </p>
        </div>
      </Container>
    </div>
  )
}
