import { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://commoditychina.com"

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