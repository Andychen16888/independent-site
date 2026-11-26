import { prisma } from "@/lib/db/prisma"
import { getTranslations } from "next-intl/server"
import { getSiteSettings, siteNameValue } from "@/lib/settings/settings"
import { localizedFooterValue, parseFooterContent } from "@/lib/settings/footer"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { ChatButton } from "@/components/chat/ChatButton"
import { VisitorBeacon } from "@/components/tracking/VisitorBeacon"
import { fetchProductTranslations, applyProductLocalizations } from "@/lib/i18n/product"

interface ShopLayoutProps {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

const FALLBACK_MENUS = [
  { label: "Home", url: "/" },
  { label: "Products", url: "/products" },
  { label: "Journal", url: "/blog" },
  { label: "FAQ", url: "/faq" },
  { label: "About Us", url: "/pages/about" },
  { label: "Contact Us", url: "/pages/contact" },
]

const NAV_KEYS: Record<string, string> = {
  "/": "home",
  "/products": "products",
  "/blog": "journal",
  "/faq": "faq",
  "/pages/about": "about",
  "/pages/contact": "contact",
}

export default async function ShopLayout({ children, params }: ShopLayoutProps) {
  const { locale } = await params
  const t = await getTranslations("product")
  const th = await getTranslations("header")
  const tnav = await getTranslations("navigation")
  const [menus, settings, chatProducts] = await Promise.all([
    prisma.menu.findMany({
      where: { isActive: true, parentId: null },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
    getSiteSettings(),
    prisma.product.findMany({
      where: { status: "ACTIVE", deletedAt: null },
      orderBy: [{ isBestSeller: "desc" }, { createdAt: "desc" }],
      take: 4,
      include: { images: { take: 1 } },
    }),
  ])

  const siteName = siteNameValue(settings)
  const footerContent = parseFooterContent(settings["footer.content"])
  const promoBar = settings["site.promoBar"] || th("promoBar")
  let requestQuoteLabel: string | undefined
  try {
    const cta = JSON.parse(settings["content.cta"] || "null") as { requestQuote?: string } | null
    requestQuoteLabel = cta?.requestQuote || undefined
  } catch {}

  const labelFor = (label: string, url: string) => {
    const key = NAV_KEYS[url]
    const fallback = FALLBACK_MENUS.find((m) => m.url === url)?.label
    const isBuiltInLabel = key && fallback && label.trim().toLowerCase() === fallback.toLowerCase()
    return isBuiltInLabel ? tnav(key) : label
  }

  const seenHrefs = new Set<string>()
  const navItems: { name: string; href: string }[] = []
  for (const m of menus.length ? menus : FALLBACK_MENUS) {
    if (seenHrefs.has(m.url)) continue
    seenHrefs.add(m.url)
    navItems.push({ name: labelFor(m.label, m.url), href: m.url })
  }
  if (!seenHrefs.has("/faq")) {
    navItems.push({ name: tnav("faq"), href: "/faq" })
  }

  const productsWithPrice = chatProducts.map((p) => ({
    ...p,
    unitPrice: p.unitPrice != null ? Number(p.unitPrice) : null,
    originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
  }))
  const translations = await fetchProductTranslations(productsWithPrice.map((p) => p.id), locale)
  const localizedProducts = applyProductLocalizations(productsWithPrice, translations)

  return (
    <>
      <Header
        navItems={navItems}
        siteName={siteName}
        logo={settings["site.logo"]}
        promoBar={promoBar}
        requestQuoteLabel={requestQuoteLabel}
      />
      <div className="h-[92px] md:h-[141px]" />
      <main className="min-h-screen">{children}</main>
      <Footer
        siteName={siteName}
        logo={settings["site.logo"]}
        about={settings["footer.about"]}
        companyName={settings["company.name"]}
        companyBrief={settings["company.brief"]}
        localizedBrief={localizedFooterValue(footerContent, locale, "brief")}
        contactEmail={settings["contact.email"]}
        contactPhone={settings["contact.phone"]}
        whatsapp={settings["contact.whatsapp"]}
        address={settings["company.address"]}
        localizedAddress={localizedFooterValue(footerContent, locale, "address")}
        hours={settings["contact.hours"]}
        copyrightText={settings["footer.copyright"]}
        copyrightSuffix={siteName}
        facebook={settings["social.facebook"]}
        instagram={settings["social.instagram"]}
        linkedin={settings["social.linkedin"]}
        youtube={settings["social.youtube"]}
        twitter={settings["social.twitter"]}
      />
      <ChatButton
        products={localizedProducts.map((p) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          price: p.unitPrice != null ? Number(p.unitPrice) : null,
          image: p.images?.[0]?.url || null,
          tag: p.isBestSeller ? t("best") : p.isNew ? t("new") : undefined,
        }))}
      />
      <VisitorBeacon />
    </>
  )
}