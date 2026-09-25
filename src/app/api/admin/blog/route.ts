import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { requireAdmin } from "@/lib/auth/admin-guard"
import { invalidateStorefront } from "@/lib/settings/invalidate-storefront"
import { upsertBlogPostTranslations } from "@/lib/i18n/content"

function generateSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
}

export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req)
  if (authError) return authError

  try {
    const posts = await prisma.blogPost.findMany({ orderBy: { createdAt: "desc" } })
    return NextResponse.json({ posts })
  } catch (error) {
    console.error("Admin blog fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const authError = await requireAdmin(req)
  if (authError) return authError

  try {
    const body = await req.json()
    const { title, slug, excerpt, content, coverImage, author, tags, isPublished, seoTitle, seoDescription, seoKeywords, translations } = body

    if (!title || !content) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 })
    }

    let slugValue = slug
    if (!slugValue) slugValue = generateSlug(title)
    const existing = await prisma.blogPost.findUnique({ where: { slug: slugValue } })
    if (existing) slugValue = `${slugValue}-${Date.now().toString().slice(-4)}`

    const published = isPublished !== undefined ? isPublished : false

    const post = await prisma.blogPost.create({
      data: {
        title,
        slug: slugValue,
        excerpt: excerpt || null,
        content,
        coverImage: coverImage || null,
        author: author || "Admin",
        tags: tags || null,
        isPublished: published,
        publishedAt: published ? new Date() : null,
        seoTitle: seoTitle || null,
        seoDescription: seoDescription || null,
        seoKeywords: seoKeywords || null,
      },
    })

    if (Array.isArray(translations)) {
      await upsertBlogPostTranslations(post.id, translations)
    }

    invalidateStorefront()
    return NextResponse.json({ post }, { status: 201 })
  } catch (error) {
    console.error("Admin blog create error:", error)
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 })
  }
}