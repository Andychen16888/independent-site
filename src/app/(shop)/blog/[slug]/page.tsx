import { notFound } from "next/navigation"
import { Container } from "@/components/ui/Container"
import { Breadcrumb } from "@/components/ui/Breadcrumb"
import { BlogContent } from "@/components/blog/BlogContent"
import { generateMetadata as genMeta } from "@/lib/seo/generate-metadata"
import { breadcrumbSchema, blogPostingSchema, articleSchema, personSchema } from "@/lib/seo/structured-data"
import type { Metadata } from "next"

interface Props {
  params: Promise<{ slug: string }>
}

const posts: Record<string, any> = {
  "art-of-peptide-layering": {
    title: "The Art of Peptide Layering",
    description: "Master the art of peptide layering with our expert guide. Learn how to combine multi-weight peptides for maximum skin benefits.",
    content: `# The Art of Peptide Layering

## Why Layering Matters

Layering your skincare correctly can make the difference between radiant, youthful skin and a routine that never reaches its full potential. At Oriental Beauty, we've perfected a peptide-layering system that maximizes absorption and efficacy.

## The Science of Peptides

Peptides are short chains of amino acids that act as signaling molecules for your skin. When applied topically, they communicate with your cells to:

- **Boost collagen production**
- **Improve skin elasticity**
- **Reduce fine lines and wrinkles**
- **Strengthen the skin barrier**

## Our Peptide Layering Method

### Step 1: Cleanse
Start with a gentle, pH-balanced cleanser to prepare your skin for maximum peptide absorption.

### Step 2: Peptide Essence
Apply our **Multi-Peptide Essence** to damp skin. The low molecular weight peptides penetrate deeply to signal collagen production at the cellular level.

### Step 3: Peptide Serum
Layer our **Peptide Hydration Serum** over the essence. This medium-weight formula delivers peptides to the mid-layers of your skin.

### Step 4: Moisturize
Seal everything in with our **Peptide Rich Moisturizer**, which supports the skin barrier and locks in hydration.

> "The key to peptide layering is going from thinnest to thickest consistency, allowing each layer to absorb before applying the next."

## Pro Tips

- **Pat, don't rub** — Gentle pressing motions help peptides absorb better
- **Wait 60 seconds** between each layer for optimal absorption
- **Use twice daily** for visible results within 4-6 weeks

## Shop the Routine

Build your complete peptide layering system with our curated collection of peptide skincare products.`,
    author: "Oriental Beauty",
    publishedAt: new Date("2026-04-15"),
    tags: "skincare, peptides, routine, anti-aging, collagen",
    coverImage: null,
  },
  "meet-artisan-kazuo-tanaka": {
    title: "Meet the Artisan: Master Potter Kazuo Tanaka",
    description: "Discover the story of Master Potter Kazuo Tanaka, a third-generation ceramic artist from Kyoto whose Raku-fired creations embody the wabi-sabi philosophy.",
    content: `# Meet the Artisan: Master Potter Kazuo Tanaka

## A Legacy of Clay

In the ancient pottery district of Kyoto, surrounded by the scent of wet clay and wood smoke, Master Kazuo Tanaka has been shaping ceramic art for over four decades. His hands — weathered and wise — carry the knowledge of three generations of potters.

## The Kiln That Breathes

Tanaka-san's workshop centers around a traditional **noborigama** (climbing kiln) that reaches temperatures of 1,300°C. Each firing takes five days and requires constant attention, day and night.

> "The kiln is alive. It breathes, it sighs, it tells you when the pieces are ready."

## The Oriental Beauty Collection

For our Handmade Living collection, Tanaka-san creates:

- **Tea ceremony bowls** — Each one unique in shape and glaze pattern
- **Sake vessels** — Thin-walled with a crystalline finish
- **Serving platters** — Large-format pieces for shared meals

## The Philosophy of Wabi-Sabi

Tanaka-san's work embodies **wabi-sabi** — the Japanese aesthetic of finding beauty in imperfection. No two pieces are identical. The slight asymmetry, the natural drip of glaze, the mark of the potter's finger — these are not flaws, but signatures of authenticity.`,
    author: "Oriental Beauty",
    publishedAt: new Date("2026-04-10"),
    tags: "artisan, ceramics, japan, wabi-sabi, kyoto",
    coverImage: null,
  },
  "fermented-beauty": {
    title: "Fermented Beauty: Why East Asian Skincare Works",
    description: "Explore the science behind fermented skincare ingredients and why traditional East Asian fermentation techniques create more potent, absorbable beauty products.",
    content: `# Fermented Beauty: Why East Asian Skincare Works

## Ancient Wisdom, Modern Science

Fermentation has been a cornerstone of East Asian beauty for centuries. From sake washes in Japan to fermented rice water in Korea, this traditional technique is now backed by modern dermatological science.

## Why Fermentation?

The fermentation process breaks down ingredients into smaller molecules, making them:

- **Easier to absorb** — Smaller particle size penetrates deeper
- **More potent** — Fermentation releases beneficial metabolites
- **Gentler on skin** — The process reduces potential irritants
- **Rich in antioxidants** — Fermented ingredients have higher antioxidant activity

## Key Fermented Ingredients

### 1. Fermented Rice
Rich in amino acids, vitamins B and E, and minerals. Brightens skin tone and improves texture.

### 2. Fermented Green Tea
Contains higher levels of polyphenols and antioxidants than non-fermented tea. Reduces inflammation and protects against environmental damage.

### 3. Fermented Ginseng
Enhances blood circulation to the skin, promoting a natural, healthy glow. Our **Ginseng Peptide Eye Cream** uses a double-fermented ginseng extract.

## Our Approach

At Oriental Beauty, we combine traditional fermentation techniques with modern peptide technology. Our ingredients are fermented for 72 hours using traditional methods, then combined with multi-weight peptides for maximum efficacy.`,
    author: "Oriental Beauty",
    publishedAt: new Date("2026-04-05"),
    tags: "skincare, science, fermentation, korean beauty, japanese beauty",
    coverImage: null,
  },
  "mindful-home-sanctuary": {
    title: "Creating a Mindful Home Sanctuary",
    description: "Learn how to transform your home into a mindful sanctuary using Eastern principles of harmony, natural materials, and intentional living.",
    content: `# Creating a Mindful Home Sanctuary

## The Art of Intentional Living

Your home should be your sanctuary — a space that nurtures calm, creativity, and connection. Drawing from Eastern principles of harmony and balance, here's how to create a space that truly supports your wellbeing.

## 1. Choose Objects with Intention

Every object in your home should have a purpose or bring you joy. Our **Handmade Living** collection is curated with this philosophy — each piece is crafted to be both functional and beautiful.

## 2. Embrace Natural Materials

Wood, ceramic, linen, bamboo — natural materials bring warmth and texture to your space. They age gracefully and develop character over time.

## 3. Create Ritual Spaces

Designate areas for your daily rituals:
- **Morning tea corner** — A quiet space for your first cup
- **Skincare altar** — Where you perform your beauty ritual
- **Meditation nook** — A cushion and a simple shelf

## 4. Less is More

Follow the Japanese principle of **ma** (negative space). Leave room for emptiness — it's not about what you add, but what you choose to leave out.

> "The beauty of a room is not in what is there, but in what is not."

## Shop Mindful Living

Explore our collection of handcrafted ceramics, textiles, and decor objects designed to bring intention and beauty to your daily life.`,
    author: "Oriental Beauty",
    publishedAt: new Date("2026-03-28"),
    tags: "home, mindfulness, decor, interior design, wabi-sabi",
    coverImage: null,
  },
  "ingredient-spotlight-ginseng": {
    title: "Ingredient Spotlight: Ginseng in Skincare",
    description: "Discover why ginseng is one of skincare's most powerful ingredients. Learn about its anti-aging benefits and how double-fermentation enhances efficacy.",
    content: `# Ingredient Spotlight: Ginseng in Skincare

## The Root of Radiance

Ginseng (*Panax ginseng*) has been revered in East Asian medicine for thousands of years. In skincare, it's a powerhouse ingredient that delivers visible, transformative results.

## Why Ginseng Works

Ginseng contains **ginsenosides** — unique compounds that:

- **Stimulate blood circulation** — Bringing oxygen and nutrients to skin cells
- **Boost collagen synthesis** — Reducing fine lines and wrinkles
- **Protect against UV damage** — Acting as a natural antioxidant
- **Energize dull skin** — Promoting a radiant, healthy complexion

## Our Double-Fermented Ginseng

We use a proprietary double-fermentation process that increases the bioavailability of ginsenosides by 300%. This means your skin can absorb and utilize more of the active compounds.

## How to Use

Our **Ginseng Peptide Eye Cream** is formulated with double-fermented ginseng and multi-weight peptides. Apply gently with your ring finger, patting from the inner to outer eye area.

## The Results

In clinical trials, 89% of users showed improvement in fine lines and crow's feet within 8 weeks of consistent use.`,
    author: "Oriental Beauty",
    publishedAt: new Date("2026-03-20"),
    tags: "skincare, ingredients, ginseng, anti-aging, korean beauty",
    coverImage: null,
  },
  "tea-ceremony-daily-ritual": {
    title: "The Tea Ceremony as Daily Ritual",
    description: "Bring the ancient Japanese tea ceremony into your daily life. Learn the four principles of chanoyu and how to create your own mindful tea ritual.",
    content: `# The Tea Ceremony as Daily Ritual

## Finding Peace in a Cup

The Japanese tea ceremony — **chanoyu** — is more than just preparing and drinking tea. It's a meditative practice that cultivates presence, gratitude, and connection.

## The Four Principles

### 1. Harmony (Wa)
The harmony between host and guest, between the tools and the space, between the tea and the moment.

### 2. Respect (Kei)
Respect for the utensils, the tea, and each person present. Every movement is deliberate and meaningful.

### 3. Purity (Sei)
Purification — of the utensils, the space, and the mind. Wiping the tea bowl is a gesture of clearing the spirit.

### 4. Tranquility (Jaku)
The ultimate goal — a state of calm awareness that arises when the first three principles are embodied.

## Creating Your Own Ritual

You don't need a dedicated tea room to practice chanoyu. Here's how to bring the spirit of the tea ceremony into your daily life:

1. **Choose a special vessel** — Our **Artisan Tea Ceremony Set** makes any cup of tea feel sacred
2. **Set aside 15 minutes** — No phones, no distractions
3. **Focus on each movement** — The sound of water, the warmth of the cup, the aroma of the tea
4. **Drink with gratitude** — Acknowledge the hands that crafted your cup and grew your tea`,
    author: "Oriental Beauty",
    publishedAt: new Date("2026-03-15"),
    tags: "tea, ritual, japanese, mindfulness, ceremony",
    coverImage: null,
  },
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = posts[slug]
  if (!post) return {}
  return genMeta({
    title: post.title,
    description: post.description,
    keywords: post.tags || undefined,
    ogImage: post.coverImage || undefined,
    ogType: "article",
    articlePublishedTime: post.publishedAt.toISOString(),
    articleAuthors: [post.author],
    articleTags: post.tags?.split(", "),
    canonical: `${process.env.NEXT_PUBLIC_SITE_URL || "https://orientalbeauty.com"}/blog/${slug}`,
  })
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const post = posts[slug]
  if (!post) notFound()

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://orientalbeauty.com"
  const postUrl = `${baseUrl}/blog/${slug}`

  const schemas = [
    breadcrumbSchema([
      { name: "Home", url: baseUrl },
      { name: "Journal", url: `${baseUrl}/blog` },
      { name: post.title, url: postUrl },
    ]),
    blogPostingSchema({
      headline: post.title,
      description: post.description,
      author: post.author,
      datePublished: post.publishedAt.toISOString(),
      dateModified: post.publishedAt.toISOString(),
      image: post.coverImage,
      url: postUrl,
    }),
    // GEO: Enhanced Article schema with Speakable spec — LLMs use this to identify quotable sections
    articleSchema({
      headline: post.title,
      description: post.description,
      author: { name: post.author, url: `${baseUrl}/about` },
      datePublished: post.publishedAt.toISOString(),
      dateModified: post.publishedAt.toISOString(),
      image: post.coverImage,
      url: postUrl,
      articleSection: post.tags?.includes("skincare") ? "Beauty" : post.tags?.includes("artisan") ? "Craftsmanship" : "Lifestyle",
      keywords: post.tags,
      speakable: { cssSelector: [".blog-content h1", ".blog-content h2", ".blog-content blockquote"] },
    }),
    // GEO: Person entity for author authority signal — LLMs track author expertise
    personSchema({
      name: post.author,
      description: "Content creator and beauty/lifestyle expert at Oriental Beauty",
      jobTitle: "Content Editor",
      knowsAbout: ["peptide skincare", "asian beauty rituals", "artisanal crafts", "mindful living"],
    }),
  ]

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }}
      />
      <div className="pt-24 md:pt-28">
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
        <BlogContent post={post} />
      </div>
    </>
  )
}
