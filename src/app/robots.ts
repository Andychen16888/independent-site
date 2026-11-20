import { MetadataRoute } from "next"
import { GENERIC_SITE_URL } from "@/lib/settings/brand"

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || GENERIC_SITE_URL

  // Private / thin pages that must never be indexed.
  const disallowed = [
    "/admin/",
    "/api/",
    "/account/",
    "/auth/",
    "/cart",
    "/checkout/",
    "/wishlist",
    "/search",
  ]

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: disallowed,
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: disallowed,
      },
      {
        userAgent: "bingbot",
        allow: "/",
        disallow: disallowed,
      },
      // GEO: keep generative / AI search engines crawling the public site.
      {
        userAgent: "GPTBot",
        allow: "/",
        disallow: disallowed,
      },
      {
        userAgent: "ClaudeBot",
        allow: "/",
        disallow: disallowed,
      },
      {
        userAgent: "anthropic-ai",
        allow: "/",
        disallow: disallowed,
      },
      {
        userAgent: "PerplexityBot",
        allow: "/",
        disallow: disallowed,
      },
      {
        userAgent: "Google-Extended",
        allow: "/",
        disallow: disallowed,
      },
      {
        userAgent: "CCBot",
        allow: "/",
        disallow: disallowed,
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}