import { notFound } from "next/navigation"
import { prisma } from "@/lib/db/prisma"
import { getTranslations } from "next-intl/server"
import { Container } from "@/components/ui/Container"
import { Breadcrumb } from "@/components/ui/Breadcrumb"
import { BlogContent } from "@/components/blog/BlogContent"
import { fetchBlogPostTranslations, applyBlogPostLocalization } from "@/lib/i18n/content"
import { generateMetadata as genMeta } from "@/lib/seo/generate-metadata"
import { getSiteSeo } from "@/lib/settings/settings"
import { breadcrumbSchema, blogPostingSchema, articleSchema, personSchema } from "@/lib/seo/structured-data"
import type { Metadata } from "next"

interface Props {
  params: Promise<{ slug: string; locale: string }>
}

export default async function BlogPostPage({ params }: Props) {
  const { slug, locale } = await params
  const post = await prisma.blogPost.findFirst({
    where: {
      slug,
      isPublished: true,
      publishedAt: { not: null },
    },
  })
  if (!post || !post.publishedAt) notFound()

  const [translations] = await Promise.all([
    fetchBlogPostTranslations([post.id], locale),
  ])
  const postL = applyBlogPostLocalization(post, translations)

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://commoditychina.com"
  const postUrl = `${baseUrl}/${locale}/blog/${slug}`
  const datePublished = post.publishedAt.toISOString()
  const tags = (postL.tags || "").split(",").map((t) => t.trim()).filter(Boolean)
  const seo = await getSiteSeo()
  const t = await getTranslations("blog")
  const tc = await getTranslations("common")

  const schemas = [
    breadcrumbSchema([
      { name: tc("home"), url: baseUrl },
      { name: t("title"), url: `${baseUrl}/${locale}/blog` },
      { name: postL.title, url: postUrl },
    ]),
    blogPostingSchema({
      headline: postL.title,
      description: postL.excerpt || postL.seoDescription || "",
      author: post.author,
      datePublished,
      dateModified: (post.updatedAt || post.publishedAt).toISOString(),
      image: post.coverImage,
      url: postUrl,
    }),
    // GEO: Enhanced Article schema with Speakable spec — LLMs use this to identify quotable sections
    articleSchema({
      headline: postL.title,
      description: postL.excerpt || postL.seoDescription || "",
      author: { name: post.author, url: `${baseUrl}/${locale}/about` },
      datePublished,
      dateModified: (post.updatedAt || post.publishedAt).toISOString(),
      image: post.coverImage,
      url: postUrl,
      articleSection: tags.some((t) => t === "importing" || t === "sourcing")
        ? "Importing"
        : tags.some((t) => t === "logistics" || t === "freight")
          ? "Logistics"
          : "B2B Trade",
      keywords: post.tags || "",
      speakable: { cssSelector: [".blog-content h1", ".blog-content h2", ".blog-content blockquote"] },
    }),
    // GEO: Person entity for author authority signal — LLMs track author expertise
    personSchema({
      name: post.author,
      description: `Content creator and trade expert at ${seo.siteName}`,
      jobTitle: "Content Editor",
      knowsAbout: ["importing", "sourcing", "quality control", "international logistics"],
    }),
  ]

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }}
      />
      <div>
        <Container>
          <Breadcrumb
            items={[
              { label: tc("home"), href: "/" },
              { label: t("title"), href: "/blog" },
              { label: postL.title },
            ]}
            className="mb-8"
          />
        </Container>
        <BlogContent
          post={{
            title: postL.title,
            content: postL.content || post.content,
            author: post.author,
            publishedAt: post.publishedAt,
            tags: post.tags,
            coverImage: post.coverImage,
          }}
        />
      </div>
    </>
  )
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = await params
  const post = await prisma.blogPost.findFirst({
    where: {
      slug,
      isPublished: true,
      publishedAt: { not: null },
    },
  })
  if (!post) return {}
  const [translations] = await Promise.all([
    fetchBlogPostTranslations([post.id], locale),
  ])
  const postL = applyBlogPostLocalization(post, translations)
  const seo = await getSiteSeo()
  return genMeta({
    title: postL.seoTitle || postL.title,
    description: postL.seoDescription || postL.excerpt || "",
    keywords: postL.seoKeywords || post.tags || undefined,
    ogImage: post.coverImage || undefined,
    ogType: "article",
    siteName: seo.siteName,
    siteDescription: seo.siteDescription,
    articlePublishedTime: post.publishedAt?.toISOString(),
    articleAuthors: [post.author],
    articleTags: (post.tags || "").split(",").map((t) => t.trim()).filter(Boolean),
    canonical: `/blog/${slug}`,
    locale,
  })
}