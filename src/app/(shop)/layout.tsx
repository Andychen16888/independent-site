import { prisma } from "@/lib/db/prisma"
import { getSiteSettings } from "@/lib/settings/settings"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { ChatButton } from "@/components/chat/ChatButton"

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
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
  const siteSlogan = settings["site.slogan"] || ""

  const navItems = menus.map((m) => ({ name: m.label, href: m.url }))

  return (
    <>
      <Header
        navItems={navItems}
        siteName={siteName}
        siteSlogan={siteSlogan}
        logo={settings["site.logo"]}
        promoBar={settings["site.promoBar"] || ""}
      />
      <div className="h-[92px] md:h-[141px]" />
      <main className="min-h-screen">{children}</main>
      <Footer
        siteName={siteName}
        siteSlogan={siteSlogan}
        logo={settings["site.logo"]}
        about={settings["footer.about"]}
        contactEmail={settings["contact.email"]}
        contactPhone={settings["contact.phone"]}
        address={settings["company.address"]}
        hours={settings["contact.hours"]}
        copyrightSuffix={siteName}
        facebook={settings["social.facebook"]}
        instagram={settings["social.instagram"]}
        linkedin={settings["social.linkedin"]}
        youtube={settings["social.youtube"]}
        twitter={settings["social.twitter"]}
      />
      <ChatButton
        products={chatProducts.map((p) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          price: Number(p.unitPrice),
          image: p.images[0]?.url || null,
          tag: p.isBestSeller ? "Best Seller" : p.isNew ? "New" : undefined,
        }))}
      />
    </>
  )
}