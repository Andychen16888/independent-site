import { Container } from "@/components/ui/Container"
import { generateMetadata } from "@/lib/seo/generate-metadata"

export const metadata = generateMetadata({
  title: "Contact Us",
  description: "Get in touch with the Oriental Beauty team.",
})

export default function ContactPage() {
  return (
    <div className="pt-24 md:pt-28 min-h-screen">
      <Container>
        <div className="max-w-2xl mx-auto">
          <span className="text-caption mb-4 block">Get in Touch</span>
          <h1 className="heading-xl mb-6">Contact Us</h1>
          <p className="text-body mb-12">
            We&apos;d love to hear from you. Send us a message and we&apos;ll respond within 24 hours.
          </p>

          <form className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <input type="text" placeholder="First name" required className="w-full px-4 py-3 bg-transparent border border-charcoal/20 focus:border-charcoal outline-none text-sm" />
              <input type="text" placeholder="Last name" required className="w-full px-4 py-3 bg-transparent border border-charcoal/20 focus:border-charcoal outline-none text-sm" />
            </div>
            <input type="email" placeholder="Email" required className="w-full px-4 py-3 bg-transparent border border-charcoal/20 focus:border-charcoal outline-none text-sm" />
            <select className="w-full px-4 py-3 bg-transparent border border-charcoal/20 focus:border-charcoal outline-none text-sm">
              <option>General Inquiry</option>
              <option>Order Support</option>
              <option>Wholesale</option>
              <option>Affiliate</option>
              <option>Press</option>
            </select>
            <textarea rows={5} placeholder="Message" required className="w-full px-4 py-3 bg-transparent border border-charcoal/20 focus:border-charcoal outline-none text-sm resize-none" />
            <button type="submit" className="btn-primary">Send Message</button>
          </form>
        </div>
      </Container>
    </div>
  )
}
