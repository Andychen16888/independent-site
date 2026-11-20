import { prisma } from "@/lib/db/prisma"
import { GENERIC_SITE_URL } from "@/lib/settings/brand"
import { Link } from "@/i18n/navigation"
import { getTranslations } from "next-intl/server"
import { Container } from "@/components/ui/Container"
import { Breadcrumb } from "@/components/ui/Breadcrumb"
import { BlogList } from "@/components/blog/BlogList"
import { fetchBlogPostTranslations, applyBlogPostLocalizations } from "@/lib/i18n/content"
import { generateMetadata as genMeta } from "@/lib/seo/generate-metadata"
import { breadcrumbSchema } from "@/lib/seo/structured-data"
import type { Metadata } from "next"

interface Props {
  params: Promise<{ slug: string; locale: string }>
  searchParams: Promise<{ tag?: string }>
}

function slugifyTag(raw: string): string {
  return raw.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "blog" })
  return genMeta({
    title: t("title"),
    description: t("metaDescription"),
    keywords: "journal, blog, importing, sourcing, trade insights",
    canonical: "/blog",
    locale,
  })
}

export default async function BlogPage({ params, searchParams }: Props) {
  const { locale } = await params
  const { tag } = await searchParams
  const activeTag = tag || "all"
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || GENERIC_SITE_URL
  const t = await getTranslations("blog")
  const tc = await getTranslations("common")

  const posts = await prisma.blogPost.findMany({
    where: { isPublished: true, publishedAt: { not: null } },
    orderBy: { publishedAt: "desc" },
    take: 60,
  })

  const [translations] = await Promise.all([
    fetchBlogPostTranslations(posts.map((p) => p.id), locale),
  ])
  const localizedPosts = applyBlogPostLocalizations(posts, translations)

  const filteredPosts =
    activeTag === "all"
      ? localizedPosts
      : localizedPosts.filter((p) => (p.tags || "").split(",").map((t) => t.trim().toLowerCase()).includes(activeTag))

  // Distinct tags from the posts for the filter bar.
  const tagCounts = new Map<string, number>()
  for (const p of posts) {
    for (const t of (p.tags || "").split(",").map((x) => x.trim()).filter(Boolean)) {
      tagCounts.set(t, (tagCounts.get(t) || 0) + 1)
    }
  }
  const allTags = Array.from(tagCounts.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([t]) => ({ slug: t.toLowerCase(), raw: t }))

  const tagLabel = (raw: string) => {
    const key = `tags.${slugifyTag(raw)}`
    try {
      return t.has(key) ? t(key) : raw
    } catch {
      return raw
    }
  }

  const schemas = [
    breadcrumbSchema([
      { name: tc("home"), url: baseUrl },
      { name: t("title"), url: `${baseUrl}/${locale}/blog` },
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
              items={[{ label: tc("home"), href: "/" }, { label: t("title") }]}
              className="mb-6"
            />
            <span className="text-caption mb-4 block">{t("eyebrow")}</span>
            <h1 className="heading-xl mb-6">{t("heading")}</h1>
            <p className="text-body max-w-2xl">
              {t("subtitle")}
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
                {t("all")}
              </Link>
              {allTags.map((t) => (
                <Link
                  key={t.slug}
                  href={`/blog?tag=${t.slug}`}
                  className={`text-xs tracking-wider uppercase px-4 py-2 transition-colors ${
                    activeTag === t.slug ? "bg-charcoal text-ivory" : "bg-mist text-stone hover:bg-charcoal/10 hover:text-charcoal"
                  }`}
                >
                  {tagLabel(t.raw)}
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
              tags: (p.tags || "")
                .split(",")
                .map((x) => x.trim())
                .filter(Boolean)
                .slice(0, 3)
                .map(tagLabel)
                .join(", "),
              publishedAt: p.publishedAt as Date,
            }))}
          />
        </Container>
      </div>
    </>
  )
}