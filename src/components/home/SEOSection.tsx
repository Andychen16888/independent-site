"use client"

import { Link } from "@/i18n/navigation"
import { Container } from "@/components/ui/Container"

export interface SEOLink { label: string; href: string }

export function SEOSection({
  heading = "Discover Our Collections",
  paragraphs = [],
  links = [],
}: {
  heading?: string
  paragraphs?: string[]
  links?: SEOLink[]
}) {
  if (!heading && paragraphs.length === 0 && links.length === 0) return null

  return (
    <section className="py-12 md:py-16 bg-ivory border-t border-mist">
      <Container>
        <div className="max-w-4xl mx-auto text-center">
          {heading && <h2 className="heading-sm mb-4">{heading}</h2>}
          {paragraphs.length > 0 && (
            <div className="text-body text-sm space-y-3 max-w-3xl mx-auto">
              {paragraphs.map((p, i) => <p key={i}>{p}</p>)}
            </div>
          )}
          {links.length > 0 && (
            <div className="flex flex-wrap justify-center gap-6 mt-8 text-xs text-stone">
              {links.map((link) => (
                <Link key={link.href + link.label} href={link.href} className="hover:text-charcoal transition-colors underline underline-offset-4 decoration-mist hover:decoration-charcoal">
                  {link.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </Container>
    </section>
  )
}