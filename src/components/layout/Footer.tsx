import { Link } from "@/i18n/navigation"
import { getTranslations } from "next-intl/server"
import { getLocale } from "next-intl/server"
import { prisma } from "@/lib/db/prisma"
import { Container } from "@/components/ui/Container"
import { fetchPageTranslations } from "@/lib/i18n/content"
import { fetchCategoryTranslations } from "@/lib/i18n/category"
import { localizeCategoryName } from "@/lib/i18n/category-labels"
import { categoryPath } from "@/lib/categories/slug"
import type { PageTranslation } from "@prisma/client"
import {
  HiOutlineEnvelope,
  HiOutlineMapPin,
  HiOutlineClock,
  HiOutlinePhone,
  HiOutlineChatBubbleLeftRight,
} from "react-icons/hi2"

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

const FOOTER_KEYS = new Set([
  "allProducts",
  "newArrivals",
  "bestSellers",
  "privacy",
  "terms",
  "shippingReturns",
])

export async function Footer({
  siteName = "Commodities From China",
  siteSlogan = "Sourced from China",
  logo = "",
  about = "Direct from China to the world. We supply quality electronics, LED lighting, kitchenware, and everyday household commodities for retail and wholesale B2B buyers.",
  companyName = "",
  companyBrief = "",
  contactEmail = "",
  contactPhone = "",
  whatsapp = "",
  address = "",
  hours = "",
  copyrightText = "",
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
  companyName?: string
  companyBrief?: string
  contactEmail?: string
  contactPhone?: string
  whatsapp?: string
  address?: string
  hours?: string
  copyrightText?: string
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

  const locale = await getLocale()
  const categoryTranslations = await fetchCategoryTranslations(
    categories.map((c) => c.id),
    locale
  )
  const useDbContent = locale === "en"
  const t = await getTranslations("footer")
  const tnav = await getTranslations("navigation")
  const tRfq = await getTranslations("rfq")

  const pageTranslations = useDbContent
    ? new Map<string, PageTranslation>()
    : await fetchPageTranslations(pages.map((p) => p.id), locale)
  const pageTitle = (p: { id: string; slug: string; title: string }): string => {
    const key = navKeyForHref(`/pages/${p.slug}`)
    if (key) {
      try {
        return tnav.has(key) ? tnav(key) : p.title
      } catch {
        // fall through to DB translation
      }
    }
    const tr = pageTranslations.get(p.id)
    return tr?.title || p.title
  }

  const safeAbout = useDbContent ? about || t("about") : t("about")
  const safeHours = useDbContent ? hours || t("hours") : t("hours")

  const getLabel = (href: string, fallback: string) => {
    const key = navKeyForHref(href)
    if (!key) return fallback
    return FOOTER_KEYS.has(key) ? t(key) : tnav(key)
  }

  const shopLinks = categories.length
    ? categories.map((c) => ({
        name: localizeCategoryName(locale, c.slug, c.name, categoryTranslations.get(c.id)),
        href: categoryPath(c.slug, c.name),
      }))
    : DEFAULT_SHOP_LINKS

  /*
   * The RFQ link leads the column rather than trailing the CMS pages: for a
   * wholesale buyer the enquiry form is the primary action, and burying it
   * under whatever policy pages exist is why those forms go unused.
   */
  const supportLinks = [
    { name: tRfq("title"), href: "/quote" },
    { name: tnav("faq"), href: "/faq" },
    ...(pages.length
      ? pages.filter((p) => p.slug !== "faq").map((p) => ({ name: pageTitle(p), href: `/pages/${p.slug}` }))
      : DEFAULT_SUPPORT_LINKS),
  ]

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
    .map((p) => ({ name: pageTitle(p), href: `/pages/${p.slug}` }))

  return (
    <footer className="bg-navy-dark text-ivory">
      <Container className="py-16 md:py-24">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 md:gap-12">
          <div className="col-span-2 md:col-span-1 lg:col-span-2">
            <Link href="/" className="inline-block mb-6">
              {logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logo} alt={siteName} className="max-h-16 w-auto" />
              ) : (
                <>
                  <span className="font-sans font-semibold text-xl tracking-[0.02em] text-ivory">
                    {siteName}
                  </span>
                  {siteSlogan && (
                    <span className="block text-[10px] tracking-[0.5em] text-ivory/65">
                      {siteSlogan}
                    </span>
                  )}
                </>
              )}
            </Link>
            {companyName && <p className="text-sm text-ivory/80 font-medium mb-1">{companyName}</p>}
            {safeAbout && <p className="text-sm text-ivory/65 leading-relaxed mb-1 max-w-xs">{safeAbout}</p>}
            {companyBrief && <p className="text-sm text-ivory/65 leading-relaxed mb-6 max-w-xs">{companyBrief}</p>}
            <div className="space-y-3 text-sm text-ivory/65">
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
              {safeHours && (
                <div className="flex items-center gap-3">
                  <HiOutlineClock className="w-4 h-4" />
                  <span>{safeHours}</span>
                </div>
              )}
              {contactPhone && (
                <div className="flex items-center gap-3 pt-1">
                  <HiOutlinePhone className="w-4 h-4" />
                  <span>
                    <span className="font-medium text-ivory/85">{t("phone")}: </span>
                    {contactPhone}
                  </span>
                </div>
              )}
              {whatsapp && (
                <div className="flex items-center gap-3 pt-1">
                  <HiOutlineChatBubbleLeftRight className="w-4 h-4" />
                  <span>
                    <span className="font-medium text-ivory/85">{t("whatsapp")}: </span>
                    {whatsapp}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div>
            <h4 className="text-xs tracking-widest uppercase text-ivory mb-4">{t("shop")}</h4>
            <ul className="space-y-3">
              {shopLinks.map((link) => (
                <li key={link.href + link.name}>
                  <Link href={link.href} className="text-sm text-ivory/65 hover:text-ivory transition-colors duration-300">
                    {getLabel(link.href, link.name)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs tracking-widest uppercase text-ivory mb-4">{t("support")}</h4>
            <ul className="space-y-3">
              {supportLinks.map((link) => (
                <li key={link.href + link.name}>
                  <Link href={link.href} className="text-sm text-ivory/65 hover:text-ivory transition-colors duration-300">
                    {getLabel(link.href, link.name)}
                  </Link>
                </li>
              ))}
              {aboutLinks.length > 0 && aboutLinks.map((link) => (
                <li key={link.href + link.name}>
                  <Link href={link.href} className="text-sm text-ivory/65 hover:text-ivory transition-colors duration-300">
                    {getLabel(link.href, link.name)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs tracking-widest uppercase text-ivory mb-4">{t("connect")}</h4>
            <ul className="space-y-3">
              {connectLinks.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-sm text-ivory/65 hover:text-ivory transition-colors duration-300">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-ivory/65">
            {copyrightText
              ? `© ${new Date().getFullYear()} ${copyrightSuffix}. ${copyrightText}`
              : t("rightsReserved", { year: new Date().getFullYear(), name: copyrightSuffix })}
          </p>
          <div className="flex items-center gap-6 text-xs text-ivory/65">
            {pages.some((p) => p.slug === "privacy") && <Link href="/pages/privacy" className="hover:text-ivory transition-colors">{t("privacy")}</Link>}
            {pages.some((p) => p.slug === "terms") && <Link href="/pages/terms" className="hover:text-ivory transition-colors">{t("terms")}</Link>}
          </div>
        </div>
      </Container>
    </footer>
  )
}

function navKeyForHref(href: string): string | null {
  switch (href) {
    case "/products":
      return "allProducts"
    case "/categories/electronics":
      return "electronics"
    case "/categories/home-kitchen":
      return "homeKitchen"
    case "/products?sort=newest":
      return "newArrivals"
    case "/products?sort=bestseller":
      return "bestSellers"
    case "/faq":
      return "faq"
    case "/pages/contact":
      return "contact"
    case "/pages/about":
      return "about"
    case "/pages/privacy":
      return "privacy"
    case "/pages/terms":
      return "terms"
    case "/pages/shipping":
      return "shippingReturns"
    default:
      return null
  }
}
