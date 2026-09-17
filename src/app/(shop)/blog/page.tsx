import { prisma } from "@/lib/db/prisma"
import Link from "next/link"
import { Container } from "@/components/ui/Container"
import { Breadcrumb } from "@/components/ui/Breadcrumb"
import { BlogList } from "@/components/blog/BlogList"
import { generateMetadata } from "@/lib/seo/generate-metadata"
import { breadcrumbSchema } from "@/lib/seo/structured-data"
import type { Metadata } from "next"

export const metadata: Metadata = generateMetadata({
  title: "Journal",
  description: "Explore beauty rituals, artisan stories, and mindful living inspiration from the journal.",
  keywords: "journal, blog, stories, insights",
  canonical: "/blog",
})

interface Props {
  searchParams: Promise<{ tag?: string }>
}

export default async function BlogPage({ searchParams }: Props) {
  const { tag } = await searchParams
  const activeTag = tag || "all"
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://commoditychina.com"

  const posts = await prisma.blogPost.findMany({
    where: { isPublished: true, publishedAt: { not: null } },
    orderBy: { publishedAt: "desc" },
    take: 60,
  })

  const filteredPosts =
    activeTag === "all"
      ? posts
      : posts.filter((p) => (p.tags || "").split(",").map((t) => t.trim().toLowerCase()).includes(activeTag))

  // Distinct tags from the posts for the filter bar.
  const tagCounts = new Map<string, number>()
  for (const p of posts) {
    for (const t of (p.tags || "").split(",").map((x) => x.trim()).filter(Boolean)) {
      tagCounts.set(t, (tagCounts.get(t) || 0) + 1)
    }
  }
  const allTags = Array.from(tagCounts.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([t]) => ({ slug: t.toLowerCase(), name: t }))

  const schemas = [
    breadcrumbSchema([
      { name: "Home", url: baseUrl },
      { name: "Journal", url: `${baseUrl}/blog` },
    ]),
  ]

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }}
      />
      <div>
        <div className="bg-cream section-padding">
          <Container>
            <Breadcrumb
              items={[{ label: "Home", href: "/" }, { label: "Journal" }]}
              className="mb-6"
            />
            <span className="text-caption mb-4 block">Stories & Insights</span>
            <h1 className="heading-xl mb-6">The Journal</h1>
            <p className="text-body max-w-2xl">
              Explorations in beauty, craftsmanship, and mindful living — from our team and community.
            </p>
          </Container>
        </div>

        {allTags.length > 0 && (
          <Container className="py-8">
            <div className="flex flex-wrap gap-2">
              <Link
                href="/blog"
                className={`text-xs tracking-wider uppercase px-4 py-2 transition-colors ${
                  activeTag === "all" ? "bg-charcoal text-ivory" : "bg-mist text-stone hover:bg-charcoal/10 hover:text-charcoal"
                }`}
              >
                All
              </Link>
              {allTags.map((t) => (
                <Link
                  key={t.slug}
                  href={`/blog?tag=${t.slug}`}
                  className={`text-xs tracking-wider uppercase px-4 py-2 transition-colors ${
                    activeTag === t.slug ? "bg-charcoal text-ivory" : "bg-mist text-stone hover:bg-charcoal/10 hover:text-charcoal"
                  }`}
                >
                  {t.name}
                </Link>
              ))}
            </div>
          </Container>
        )}

        <Container className="pb-12 md:pb-16">
          <BlogList
            posts={filteredPosts.map((p) => ({
              id: p.id,
              title: p.title,
              slug: p.slug,
              excerpt: p.excerpt || "",
              coverImage: p.coverImage,
              author: p.author,
              tags: p.tags || "",
              publishedAt: p.publishedAt as Date,
            }))}
          />
        </Container>
      </div>
    </>
  )
}