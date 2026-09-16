import { prisma } from "@/lib/db/prisma"
import { getSiteSettings } from "@/lib/settings/settings"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { ChatButton } from "@/components/chat/ChatButton"

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const [menus, settings] = await Promise.all([
    prisma.menu.findMany({
      where: { isActive: true, parentId: null },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
    getSiteSettings(),
  ])

  const siteName = settings["site.name"] || "Global Commerce"
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
      <div className="h-[100px] md:h-[116px]" />
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
      <ChatButton />
    </>
  )
}