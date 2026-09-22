import { prisma } from "@/lib/db/prisma"
import { getTranslations } from "next-intl/server"
import { getSiteSettings } from "@/lib/settings/settings"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { ChatButton } from "@/components/chat/ChatButton"
import { fetchProductTranslations, applyProductLocalizations } from "@/lib/i18n/product"

interface ShopLayoutProps {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export default async function ShopLayout({ children, params }: ShopLayoutProps) {
  const { locale } = await params
  const useDbContent = locale === "en"
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

  const siteName = settings["site.name"] || "Commodities From China"
  const siteSlogan = useDbContent ? settings["site.slogan"] || th("slogan") : th("slogan")
  const siteDescription = useDbContent ? settings["site.description"] || th("description") : th("description")
  const promoBar = useDbContent ? settings["site.promoBar"] || th("promoBar") : th("promoBar")

  const seenHrefs = new Set<string>()
  const navItems: { name: string; href: string }[] = []
  for (const m of menus) {
    if (seenHrefs.has(m.url)) continue
    seenHrefs.add(m.url)
    navItems.push({ name: m.label, href: m.url })
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
        siteSlogan={siteSlogan}
        siteDescription={siteDescription}
        logo={settings["site.logo"]}
        promoBar={promoBar}
      />
      <div className="h-[92px] md:h-[141px]" />
      <main className="min-h-screen">{children}</main>
      <Footer
        siteName={siteName}
        siteSlogan={siteSlogan}
        logo={settings["site.logo"]}
        about={settings["footer.about"]}
        companyName={settings["company.name"]}
        companyBrief={settings["company.brief"]}
        contactEmail={settings["contact.email"]}
        contactPhone={settings["contact.phone"]}
        whatsapp={settings["contact.whatsapp"]}
        address={settings["company.address"]}
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
    </>
  )
}