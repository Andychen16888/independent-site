import Link from "next/link"
import { prisma } from "@/lib/db/prisma"
import { bi } from "@/components/admin/bilingual"
import PageForm from "@/components/admin/PageForm"

const DEFAULT_PAGES: Record<string, { title: string; excerpt: string; content: string; seoTitle: string; seoDescription: string; seoKeywords: string }> = {
  about: {
    title: "About Us",
    excerpt: "A Chinese trading house connecting large enterprises with overseas buyers for 20 years.",
    content: `<h1>About Us</h1><p>We are a China trading house with 20 years of export experience. Our business connects the country's leading enterprises \u2014 state-owned groups, listed companies and large manufacturers \u2014 with overseas buyers, especially small and mid-sized importers in Southeast Asia, Africa and other Belt &amp; Road markets.</p><p>We keep our service fees lean, respond quickly to every inquiry \u2014 including commodities not listed on our site \u2014 and deliver quality, cost-effective goods backed by an AAA credit rating and long-standing relationships with well-known companies worldwide.</p>`,
    seoTitle: "About Us",
    seoDescription: "A Chinese trading house with 20 years of export experience connecting state-owned enterprises, listed companies and large manufacturers with overseas buyers.",
    seoKeywords: "about us, commodity trading house, china export, b2b trading",
  },
  contact: {
    title: "Contact Us",
    excerpt: "Get in touch \u2014 we respond within 24 hours.",
    content: `<h1>Contact Us</h1><p>Tell us the commodity, grade, quantity and destination port \u2014 even if it's not listed on our site. We respond within 24 hours with availability and a quote.</p>`,
    seoTitle: "Contact Us",
    seoDescription: "Contact our support team for orders, products, and general inquiries.",
    seoKeywords: "contact, support",
  },
}

export default async function SlugPageEditor({ slug }: { slug: string }) {
  let page = await prisma.page.findUnique({
    where: { slug },
    include: { translations: true },
  })

  if (!page) {
    const defaults = DEFAULT_PAGES[slug]
    if (!defaults) {
      return (
        <div className="bg-white border border-mist p-12 text-center">
          <p className="text-sm text-stone mb-4">
            {bi(
              `No page with slug "/${slug}" found, and no default content is available for it.`,
              `未找到 slug 为 "/${slug}" 的页面，且该页面没有默认内容。`
            )}
          </p>
          <Link href="/admin/pages" className="btn-primary text-xs">
            {bi("Go to Pages", "前往页面管理")}
          </Link>
        </div>
      )
    }

    try {
      page = await prisma.page.create({
        data: {
          title: defaults.title,
          slug,
          excerpt: defaults.excerpt,
          content: defaults.content,
          isPublished: true,
          seoTitle: defaults.seoTitle,
          seoDescription: defaults.seoDescription,
          seoKeywords: defaults.seoKeywords,
        },
        include: { translations: true },
      })
    } catch (error) {
      console.error(`Failed to auto-create "/${slug}" page:`, error)
      return (
        <div className="bg-rosegold/10 border border-rosegold/20 p-8 text-center">
          <p className="text-sm text-rosegold mb-4">
            {bi(
              `Could not load or create the "/${slug}" page. Please retry or create it from the Pages screen.`,
              `无法加载或创建 "/${slug}" 页面，请重试或从“页面”管理中创建。`
            )}
          </p>
          <Link href="/admin/pages" className="btn-primary text-xs">
            {bi("Go to Pages", "前往页面管理")}
          </Link>
        </div>
      )
    }
  }

  const initialData = {
    id: page.id,
    title: page.title,
    slug: page.slug,
    excerpt: page.excerpt,
    content: page.content,
    coverImage: page.coverImage,
    isPublished: page.isPublished,
    seoTitle: page.seoTitle,
    seoDescription: page.seoDescription,
    seoKeywords: page.seoKeywords,
    translations: page.translations.map((t) => ({
      locale: t.locale,
      title: t.title,
      excerpt: t.excerpt,
      content: t.content,
      seoTitle: t.seoTitle,
      seoDescription: t.seoDescription,
      seoKeywords: t.seoKeywords,
    })),
  }

  return (
    <PageForm
      mode="edit"
      pageId={page.id}
      initialData={initialData}
      redirectTo={`/admin/${slug}`}
      cancelTo="/admin/pages"
    />
  )
}