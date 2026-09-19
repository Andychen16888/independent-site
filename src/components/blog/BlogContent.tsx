"use client"

import { useLocale, useTranslations } from "next-intl"
import { marked } from "marked"
import DOMPurify from "isomorphic-dompurify"
import { Container } from "@/components/ui/Container"
import { formatDate } from "@/lib/utils/format"

interface BlogContentProps {
  post: {
    title: string
    content: string
    author: string
    publishedAt: Date
    tags?: string | null
    coverImage?: string | null
  }
}

export function BlogContent({ post }: BlogContentProps) {
  const t = useTranslations("blog")
  const locale = useLocale()
  const looksLikeHtml = /<\s*[a-z][\s\S]*>/i.test(post.content)
  const htmlContent = DOMPurify.sanitize(
    looksLikeHtml ? post.content : (marked.parse(post.content, { breaks: true }) as string)
  )

  return (
    <Container>
      <article className="max-w-3xl mx-auto pb-16">
        <header className="mb-12 text-center">
          <span className="text-caption mb-4 block">
            {formatDate(post.publishedAt, locale)}
          </span>
          <h1 className="heading-lg mb-4">{post.title}</h1>
          <p className="text-sm text-stone">{t("by", { author: post.author })}</p>
          {post.tags && (
            <div className="flex justify-center gap-2 mt-4">
              {post.tags.split(",").map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] tracking-wider uppercase text-stone bg-mist px-2 py-1"
                >
                  {tag.trim()}
                </span>
              ))}
            </div>
          )}
        </header>

        {post.coverImage && (
          <div className="aspect-[16/9] bg-mist mb-12 overflow-hidden">
            <img
              src={post.coverImage}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div
          className="prose prose-stone max-w-none prose-headings:font-serif prose-headings:font-light prose-p:text-body prose-p:leading-loose prose-a:text-charcoal prose-a:underline prose-img:rounded"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      </article>
    </Container>
  )
}
