"use client"

import { Link } from "@/i18n/navigation"
import { useLocale, useTranslations } from "next-intl"
import { motion } from "framer-motion"
import { formatDate } from "@/lib/utils/format"

export interface BlogPostItem {
  id: string
  title: string
  slug: string
  excerpt: string
  coverImage: string | null
  author: string
  tags: string
  publishedAt: Date
  category?: string
}

export function BlogList({ posts }: { posts: BlogPostItem[] }) {
  const t = useTranslations("blog")
  const locale = useLocale()

  if (posts.length === 0) {
    return <div className="text-center text-sm text-stone py-12">{t("noPosts")}</div>
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
      {posts.map((post, index) => (
        <motion.div
          key={post.id}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.05 }}
        >
          <Link href={`/blog/${post.slug}`} className="group block">
            <div className="aspect-[16/10] bg-mist mb-4 overflow-hidden">
              {post.coverImage ? (
                <img src={post.coverImage} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              ) : (
                <div className="w-full h-full group-hover:scale-105 transition-transform duration-700" />
              )}
            </div>
            <span className="text-caption">{formatDate(post.publishedAt, locale)}</span>
            <h3 className="font-serif text-lg mt-2 group-hover:text-stone transition-colors leading-snug">
              {post.title}
            </h3>
            <p className="text-body text-sm mt-2 line-clamp-2">{post.excerpt}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              {(post.tags || "").split(",").filter(Boolean).slice(0, 2).map((tag) => (
                <span key={tag} className="text-[10px] tracking-wider uppercase text-stone bg-mist px-2 py-1">
                  {tag.trim()}
                </span>
              ))}
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  )
}