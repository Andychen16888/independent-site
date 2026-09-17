import { notFound } from "next/navigation"
import { prisma } from "@/lib/db/prisma"
import { Container } from "@/components/ui/Container"
import { Breadcrumb } from "@/components/ui/Breadcrumb"
import { BlogContent } from "@/components/blog/BlogContent"
import { generateMetadata as genMeta } from "@/lib/seo/generate-metadata"
import { getSiteSeo } from "@/lib/settings/settings"
import { breadcrumbSchema, blogPostingSchema, articleSchema, personSchema } from "@/lib/seo/structured-data"
import type { Metadata } from "next"

interface Props {
  params: Promise<{ slug: string }>
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const post = await prisma.blogPost.findFirst({
    where: {
      slug,
      isPublished: true,
      publishedAt: { not: null },
    },
  })
  if (!post || !post.publishedAt) notFound()

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://commoditychina.com"
  const postUrl = `${baseUrl}/blog/${slug}`
  const datePublished = post.publishedAt.toISOString()
  const tags = (post.tags || "").split(",").map((t) => t.trim()).filter(Boolean)
  const seo = await getSiteSeo()

  const schemas = [
    breadcrumbSchema([
      { name: "Home", url: baseUrl },
      { name: "Journal", url: `${baseUrl}/blog` },
      { name: post.title, url: postUrl },
    ]),
    blogPostingSchema({
      headline: post.title,
      description: post.excerpt || post.seoDescription || "",
      author: post.author,
      datePublished,
      dateModified: (post.updatedAt || post.publishedAt).toISOString(),
      image: post.coverImage,
      url: postUrl,
    }),
    // GEO: Enhanced Article schema with Speakable spec — LLMs use this to identify quotable sections
    articleSchema({
      headline: post.title,
      description: post.excerpt || post.seoDescription || "",
      author: { name: post.author, url: `${baseUrl}/about` },
      datePublished,
      dateModified: (post.updatedAt || post.publishedAt).toISOString(),
      image: post.coverImage,
      url: postUrl,
      articleSection: tags.some((t) => t === "skincare" || t === "beauty")
        ? "Beauty"
        : tags.some((t) => t === "artisan" || t === "ceramics" || t === "japan")
          ? "Craftsmanship"
          : "Lifestyle",
      keywords: post.tags || "",
      speakable: { cssSelector: [".blog-content h1", ".blog-content h2", ".blog-content blockquote"] },
    }),
    // GEO: Person entity for author authority signal — LLMs track author expertise
    personSchema({
      name: post.author,
      description: `Content creator and lifestyle expert at ${seo.siteName}`,
      jobTitle: "Content Editor",
      knowsAbout: ["skincare", "beauty rituals", "artisanal crafts", "mindful living"],
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
              { label: "Home", href: "/" },
              { label: "Journal", href: "/blog" },
              { label: post.title },
            ]}
            className="mb-8"
          />
        </Container>
        <BlogContent
          post={{
            title: post.title,
            content: post.content,
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
  const { slug } = await params
  const post = await prisma.blogPost.findFirst({
    where: {
      slug,
      isPublished: true,
      publishedAt: { not: null },
    },
  })
  if (!post) return {}
  const seo = await getSiteSeo()
  return genMeta({
    title: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt || "",
    keywords: post.seoKeywords || post.tags || undefined,
    ogImage: post.coverImage || undefined,
    ogType: "article",
    siteName: seo.siteName,
    siteDescription: seo.siteDescription,
    articlePublishedTime: post.publishedAt?.toISOString(),
    articleAuthors: [post.author],
    articleTags: (post.tags || "").split(",").map((t) => t.trim()).filter(Boolean),
  })
}