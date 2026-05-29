import { Container } from "@/components/ui/Container"
import { Breadcrumb } from "@/components/ui/Breadcrumb"
import { BlogList } from "@/components/blog/BlogList"
import { generateMetadata } from "@/lib/seo/generate-metadata"
import { breadcrumbSchema } from "@/lib/seo/structured-data"
import type { Metadata } from "next"

export const metadata: Metadata = generateMetadata({
  title: "Journal",
  description: "Explore beauty rituals, artisan stories, and mindful living inspiration from the Oriental Beauty Journal. Discover peptide skincare tips, ingredient deep-dives, and more.",
  keywords: "beauty journal, skincare blog, artisan stories, mindfulness, beauty tips",
})

const allTags = [
  { slug: "all", name: "All" },
  { slug: "beauty", name: "Beauty" },
  { slug: "lifestyle", name: "Lifestyle" },
  { slug: "skincare", name: "Skincare" },
  { slug: "artisan", name: "Artisan" },
  { slug: "mindfulness", name: "Mindfulness" },
]

const posts = [
  {
    id: "1", title: "The Art of Peptide Layering", slug: "art-of-peptide-layering",
    excerpt: "Discover how to build an effective peptide skincare routine with our step-by-step guide.",
    coverImage: null, author: "Oriental Beauty", tags: "skincare, peptides, routine",
    publishedAt: new Date("2026-04-15"), category: "beauty",
  },
  {
    id: "2", title: "Meet the Artisan: Master Potter Kazuo Tanaka", slug: "meet-artisan-kazuo-tanaka",
    excerpt: "A glimpse into the life and craft of a third-generation ceramic master from Kyoto.",
    coverImage: null, author: "Oriental Beauty", tags: "artisan, ceramics, japan",
    publishedAt: new Date("2026-04-10"), category: "lifestyle",
  },
  {
    id: "3", title: "Fermented Beauty: Why East Asian Skincare Works", slug: "fermented-beauty",
    excerpt: "The science behind fermentation in skincare and why it delivers visible results.",
    coverImage: null, author: "Oriental Beauty", tags: "skincare, science, fermentation",
    publishedAt: new Date("2026-04-05"), category: "beauty",
  },
  {
    id: "4", title: "Creating a Mindful Home Sanctuary", slug: "mindful-home-sanctuary",
    excerpt: "How to curate a space that nurtures calm, creativity, and connection.",
    coverImage: null, author: "Oriental Beauty", tags: "home, mindfulness, decor",
    publishedAt: new Date("2026-03-28"), category: "lifestyle",
  },
  {
    id: "5", title: "Ingredient Spotlight: Ginseng in Skincare", slug: "ingredient-spotlight-ginseng",
    excerpt: "Why this ancient root is a powerhouse ingredient in modern peptide formulations.",
    coverImage: null, author: "Oriental Beauty", tags: "skincare, ingredients, ginseng",
    publishedAt: new Date("2026-03-20"), category: "beauty",
  },
  {
    id: "6", title: "The Tea Ceremony as Daily Ritual", slug: "tea-ceremony-daily-ritual",
    excerpt: "How the Japanese tea ceremony can transform your daily routine into a mindful practice.",
    coverImage: null, author: "Oriental Beauty", tags: "tea, ritual, japanese, mindfulness",
    publishedAt: new Date("2026-03-15"), category: "lifestyle",
  },
]

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string }>
}) {
  const { tag } = await searchParams
  const activeTag = tag || "all"
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://orientalbeauty.com"

  const filteredPosts = activeTag === "all"
    ? posts
    : posts.filter((p) => p.tags.includes(activeTag) || p.category === activeTag)

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

      <Container className="py-8">
        <div className="flex flex-wrap gap-2">
          {allTags.map((t) => (
            <a
              key={t.slug}
              href={t.slug === "all" ? "/blog" : `/blog?tag=${t.slug}`}
              className={`text-xs tracking-wider uppercase px-4 py-2 transition-colors ${
                activeTag === t.slug
                  ? "bg-charcoal text-ivory"
                  : "bg-mist text-stone hover:bg-charcoal/10 hover:text-charcoal"
              }`}
            >
              {t.name}
            </a>
          ))}
        </div>
      </Container>

      <Container className="pb-12 md:pb-16">
        <BlogList posts={filteredPosts} />
      </Container>
    </div>
    </>
  )
}
