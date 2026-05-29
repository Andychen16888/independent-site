import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getServerAuthSession } from "@/lib/auth/get-server-session"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerAuthSession()
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { title, slug, content, excerpt, coverImage, author, tags, isPublished } = body

    if (!title || !content) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 })
    }

    const post = await prisma.blogPost.create({
      data: {
        title,
        slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
        content,
        excerpt: excerpt || null,
        coverImage: coverImage || null,
        author: author || "Admin",
        tags: tags || null,
        isPublished: isPublished || false,
        publishedAt: isPublished ? new Date() : null,
      },
    })

    return NextResponse.json({ post }, { status: 201 })
  } catch (error) {
    console.error("Admin blog create error:", error)
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 })
  }
}
