"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Container } from "@/components/ui/Container"

export interface InstagramConfig {
  handle?: string
  handleUrl?: string
  tagline?: string
  posts?: string[]
}

const DEFAULT_INSTAGRAM: InstagramConfig = {
  handle: "@commoditychina",
  handleUrl: "https://instagram.com/commoditychina",
  tagline: "Tag us @commoditychina for a chance to be featured",
  posts: [],
}

export function InstagramFeed({ config = DEFAULT_INSTAGRAM }: { config?: InstagramConfig }) {
  const safe = config.handle ? config : DEFAULT_INSTAGRAM
  const posts = safe.posts && safe.posts.length > 0 ? safe.posts : Array.from({ length: 6 }, () => "")

  return (
    <section className="py-16 md:py-20 bg-ivory">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="section-title"
        >
          <span className="text-caption mb-4 block">Follow Us</span>
          <h2>{safe.handle}</h2>
          {safe.tagline && <p>{safe.tagline}</p>}
        </motion.div>
      </Container>

      <div className="grid grid-cols-3 md:grid-cols-6 gap-1 max-w-7xl mx-auto px-1">
        {posts.map((post, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.05 }}
          >
            <Link
              href={safe.handleUrl || "https://instagram.com"}
              target="_blank"
              className={`group block relative ${post ? "border border-mist" : ""} aspect-square bg-mist overflow-hidden`}
            >
              {post && <img src={post} alt="" className="absolute inset-0 w-full h-full object-cover" />}
              <div className="absolute inset-0 bg-charcoal/0 group-hover:bg-charcoal/20 transition-all duration-300 flex items-center justify-center">
                <svg className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M7.8 2H16.2C19.4 2 22 4.6 22 7.8V16.2C22 19.4 19.4 22 16.2 22H7.8C4.6 22 2 19.4 2 16.2V7.8C2 4.6 4.6 2 7.8 2ZM7.6 4C5.6 4 4 5.6 4 7.6V16.4C4 18.4 5.6 20 7.6 20H16.4C18.4 20 20 18.4 20 16.4V7.6C20 5.6 18.4 4 16.4 4H7.6ZM17.25 7.5C17.25 7.9 16.9 8.25 16.5 8.25C16.1 8.25 15.75 7.9 15.75 7.5C15.75 7.1 16.1 6.75 16.5 6.75C16.9 6.75 17.25 7.1 17.25 7.5ZM12 7.5C14.5 7.5 16.5 9.5 16.5 12C16.5 14.5 14.5 16.5 12 16.5C9.5 16.5 7.5 14.5 7.5 12C7.5 9.5 9.5 7.5 12 7.5ZM12 9C10.3 9 9 10.3 9 12C9 13.7 10.3 15 12 15C13.7 15 15 13.7 15 12C15 10.3 13.7 9 12 9Z" />
                </svg>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      <Container>
        <div className="text-center mt-10">
          {safe.tagline && <p className="text-body text-sm mb-4">{safe.tagline}</p>}
          <Link
            href={safe.handleUrl || "https://instagram.com"}
            target="_blank"
            className="btn-outline text-xs inline-flex"
          >
            Follow on Instagram
          </Link>
        </div>
      </Container>
    </section>
  )
}