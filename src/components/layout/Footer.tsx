import Link from "next/link"
import { prisma } from "@/lib/db/prisma"
import { Container } from "@/components/ui/Container"
import { HiOutlineEnvelope, HiOutlineMapPin, HiOutlineClock } from "react-icons/hi2"

const DEFAULT_SHOP_LINKS = [
  { name: "All Products", href: "/products" },
  { name: "Electronics", href: "/categories/electronics" },
  { name: "Home & Kitchen", href: "/categories/home-kitchen" },
  { name: "New Arrivals", href: "/products?sort=newest" },
  { name: "Best Sellers", href: "/products?sort=bestseller" },
]

const DEFAULT_SUPPORT_LINKS = [
  { name: "Contact Us", href: "/pages/contact" },
  { name: "Shipping & Returns", href: "/pages/shipping" },
  { name: "Privacy Policy", href: "/pages/privacy" },
  { name: "Terms of Service", href: "/pages/terms" },
]

const DEFAULT_SOCIAL_LINKS = [
  { name: "Instagram", href: "https://instagram.com" },
  { name: "Facebook", href: "https://facebook.com" },
  { name: "Pinterest", href: "#" },
  { name: "TikTok", href: "#" },
]

export async function Footer({
  siteName = "Commodities From China",
  siteSlogan = "Sourced from China",
  logo = "",
  about = "Direct from China to the world. We supply quality electronics, LED lighting, kitchenware, and everyday household commodities for retail and wholesale B2B buyers.",
  contactEmail = "info@commoditychina.com",
  contactPhone = "",
  address = "Guangzhou, Guangdong, China",
  hours = "Mon–Fri, 9am–6pm CST",
  copyrightSuffix = "Commodities From China",
  facebook = "",
  instagram = "",
  linkedin = "",
  youtube = "",
  twitter = "",
}: {
  siteName?: string
  siteSlogan?: string
  logo?: string
  about?: string
  contactEmail?: string
  contactPhone?: string
  address?: string
  hours?: string
  copyrightSuffix?: string
  facebook?: string
  instagram?: string
  linkedin?: string
  youtube?: string
  twitter?: string
}) {
  const [categories, pages] = await Promise.all([
    prisma.category.findMany({
      where: { isActive: true, parentId: null },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      take: 6,
    }),
    prisma.page.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: "asc" },
      take: 8,
    }),
  ])

  const shopLinks = categories.length
    ? categories.map((c) => ({ name: c.name, href: `/categories/${c.slug}` }))
    : DEFAULT_SHOP_LINKS

  const supportLinks = pages.length
    ? pages.map((p) => ({ name: p.title, href: `/pages/${p.slug}` }))
    : DEFAULT_SUPPORT_LINKS

  const socialLinks = [
    { name: "Instagram", href: instagram || "" },
    { name: "Facebook", href: facebook || "" },
    { name: "LinkedIn", href: linkedin || "" },
    { name: "YouTube", href: youtube || "" },
    { name: "X / Twitter", href: twitter || "" },
  ].filter((s) => s.href)
  const connectLinks = socialLinks.length ? socialLinks : DEFAULT_SOCIAL_LINKS

  const aboutLinks = pages
    .filter((p) => ["about", "contact"].includes(p.slug))
    .map((p) => ({ name: p.title, href: `/pages/${p.slug}` }))

  return (
    <footer className="bg-charcoal text-ivory">
      <Container className="py-16 md:py-24">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 md:gap-12">
          <div className="col-span-2 md:col-span-1 lg:col-span-2">
            <Link href="/" className="inline-block mb-6">
              {logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logo} alt={siteName} className="max-h-16 w-auto" />
              ) : (
                <>
                  <span className="font-serif text-2xl tracking-[0.3em] text-ivory">
                    {siteName}
                  </span>
                  {siteSlogan && (
                    <span className="block text-[10px] tracking-[0.5em] text-stone">
                      {siteSlogan}
                    </span>
                  )}
                </>
              )}
            </Link>
            {about && <p className="text-sm text-stone leading-relaxed mb-6 max-w-xs">{about}</p>}
            <div className="space-y-3 text-sm text-stone">
              {contactEmail && (
                <div className="flex items-center gap-3">
                  <HiOutlineEnvelope className="w-4 h-4" />
                  <span>{contactEmail}</span>
                </div>
              )}
              {address && (
                <div className="flex items-center gap-3">
                  <HiOutlineMapPin className="w-4 h-4" />
                  <span>{address}</span>
                </div>
              )}
              {hours && (
                <div className="flex items-center gap-3">
                  <HiOutlineClock className="w-4 h-4" />
                  <span>{hours}</span>
                </div>
              )}
              {contactPhone && <span className="pt-1 inline-block">{contactPhone}</span>}
            </div>
          </div>

          <div>
            <h4 className="text-xs tracking-widest uppercase text-ivory mb-4">Shop</h4>
            <ul className="space-y-3">
              {shopLinks.map((link) => (
                <li key={link.href + link.name}>
                  <Link href={link.href} className="text-sm text-stone hover:text-ivory transition-colors duration-300">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs tracking-widest uppercase text-ivory mb-4">Support</h4>
            <ul className="space-y-3">
              {supportLinks.map((link) => (
                <li key={link.href + link.name}>
                  <Link href={link.href} className="text-sm text-stone hover:text-ivory transition-colors duration-300">
                    {link.name}
                  </Link>
                </li>
              ))}
              {aboutLinks.length > 0 && aboutLinks.map((link) => (
                <li key={link.href + link.name}>
                  <Link href={link.href} className="text-sm text-stone hover:text-ivory transition-colors duration-300">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs tracking-widest uppercase text-ivory mb-4">Connect</h4>
            <ul className="space-y-3">
              {connectLinks.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-sm text-stone hover:text-ivory transition-colors duration-300">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-stone">
            &copy; {new Date().getFullYear()} {copyrightSuffix}. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-xs text-stone">
            {pages.some((p) => p.slug === "privacy") && <Link href="/pages/privacy" className="hover:text-ivory transition-colors">Privacy Policy</Link>}
            {pages.some((p) => p.slug === "terms") && <Link href="/pages/terms" className="hover:text-ivory transition-colors">Terms of Service</Link>}
          </div>
        </div>
      </Container>
    </footer>
  )
}