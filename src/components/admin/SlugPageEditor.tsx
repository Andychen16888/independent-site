import Link from "next/link"
import { prisma } from "@/lib/db/prisma"
import { bi } from "@/components/admin/bilingual"
import PageForm from "@/components/admin/PageForm"

const DEFAULT_PAGES: Record<string, { title: string; excerpt: string; content: string; seoTitle: string; seoDescription: string; seoKeywords: string }> = {
  about: {
    title: "About Us",
    excerpt: "Our story — sourcing quality goods from China for the world.",
    content: `<h1>From China to the World</h1><p>Our journey began in the factories and workshops of China — from electronics assembly lines in Shenzhen to kitchenware manufacturers in Guangzhou. We traveled the country to find makers who share one standard: quality you can trust.</p><p>We believe that buying well is simpler when good products move directly from maker to buyer. That's why we handle sourcing, quality control, and shipping ourselves — so you get factory-direct value every time.</p>`,
    seoTitle: "About Us",
    seoDescription: "Discover how Commodities From China sources quality electronics, kitchenware, and everyday goods directly from Chinese suppliers.",
    seoKeywords: "about us, our story, sourcing from china, b2b wholesale",
  },
  contact: {
    title: "Contact Us",
    excerpt: "Get in touch — we respond within 24 hours.",
    content: `<h1>Contact Us</h1><p>We'd love to hear from you — whether you're shopping retail or need a wholesale quote. Send us a message and we'll respond within 24 hours.</p>`,
    seoTitle: "Contact Us",
    seoDescription: "Contact our support team for orders, products, and general inquiries.",
    seoKeywords: "contact, support",
  },
}

export default async function SlugPageEditor({ slug }: { slug: string }) {
  let page = await prisma.page.findUnique({ where: { slug } })

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

  return <PageForm mode="edit" pageId={page.id} redirectTo={`/admin/${slug}`} cancelTo="/admin/pages" />
}