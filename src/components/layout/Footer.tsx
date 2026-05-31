"use client"

import Link from "next/link"
import { Container } from "@/components/ui/Container"
import { HiOutlineEnvelope, HiOutlineMapPin, HiOutlineClock } from "react-icons/hi2"

const footerLinks = {
  shop: {
    title: "Shop",
    links: [
      { name: "All Products", href: "/products" },
      { name: "Beauty", href: "/categories/beauty" },
      { name: "Handmade Living", href: "/categories/handmade-living" },
      { name: "New Arrivals", href: "/products?sort=newest" },
      { name: "Best Sellers", href: "/products?sort=bestseller" },
    ],
  },
  about: {
    title: "About",
    links: [
      { name: "Our Story", href: "/about" },
      { name: "Journal", href: "/blog" },
    ],
  },
  support: {
    title: "Support",
    links: [
      { name: "Contact Us", href: "/contact" },
      { name: "Shipping & Returns", href: "/shipping" },
      { name: "FAQ", href: "/faq" },
      { name: "Track Order", href: "/account/orders" },
      { name: "Privacy Policy", href: "/privacy" },
      { name: "Terms of Service", href: "/terms" },
    ],
  },
  connect: {
    title: "Connect",
    links: [
      { name: "Instagram", href: "#" },
      { name: "Pinterest", href: "#" },
      { name: "TikTok", href: "#" },
      { name: "Facebook", href: "#" },
    ],
  },
}

export function Footer() {
  return (
    <footer className="bg-charcoal text-ivory">
      <Container className="py-16 md:py-24">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 md:gap-12">
          <div className="col-span-2 md:col-span-1 lg:col-span-2">
            <Link href="/" className="inline-block mb-6">
              <span className="font-serif text-2xl tracking-[0.3em] text-ivory">
                ORIENTAL
              </span>
              <span className="block text-[10px] tracking-[0.5em] text-stone">
                BEAUTY
              </span>
            </Link>
            <p className="text-sm text-stone leading-relaxed mb-6 max-w-xs">
              Where Eastern beauty rituals meet artisanal craftsmanship. 
              Curating the finest peptide skincare and authentic handcrafted pieces.
            </p>
            <div className="space-y-3 text-sm text-stone">
              <div className="flex items-center gap-3">
                <HiOutlineEnvelope className="w-4 h-4" />
                <span>hello@orientalbeauty.com</span>
              </div>
              <div className="flex items-center gap-3">
                <HiOutlineMapPin className="w-4 h-4" />
                <span>Los Angeles, CA</span>
              </div>
              <div className="flex items-center gap-3">
                <HiOutlineClock className="w-4 h-4" />
                <span>Mon–Fri, 9am–6pm PST</span>
              </div>
            </div>
          </div>

          {Object.entries(footerLinks).map(([key, section]) => (
            <div key={key}>
              <h4 className="text-xs tracking-widest uppercase text-ivory mb-4">
                {section.title}
              </h4>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm text-stone hover:text-ivory transition-colors duration-300"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-stone">
            &copy; {new Date().getFullYear()} Oriental Beauty. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-xs text-stone">
            <Link href="/privacy" className="hover:text-ivory transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-ivory transition-colors">Terms of Service</Link>
          </div>
        </div>
      </Container>
    </footer>
  )
}
