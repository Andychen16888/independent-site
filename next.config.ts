import type { NextConfig } from "next"
import createNextIntlPlugin from "next-intl/plugin"

const withNextIntl = createNextIntlPlugin()

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingIncludes: {
    "/*": ["./messages/**/*.json"],
  },
  staleTimes: {
    dynamic: 0,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  async headers() {
    const privateRoutes = [
      "/admin/:path*",
      "/api/:path*",
      "/:locale/account/:path*",
      "/account/:path*",
      "/:locale/auth/:path*",
      "/auth/:path*",
      "/:locale/cart",
      "/cart",
      "/:locale/checkout/:path*",
      "/checkout/:path*",
      "/:locale/wishlist",
      "/wishlist",
      "/:locale/search",
      "/search",
    ]
    return [
      ...privateRoutes.map((source) => ({
        source,
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive, nosnippet" },
        ],
      })),
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      {
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/:path*.svg",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400" }],
      },
    ]
  },
  async redirects() {
    // Keep in sync with src/i18n/routing.ts. Enumerating real locales prevents the
    // ":locale" param from greedily matching unrelated first segments (e.g. /admin/about).
    const pages = ["about", "contact", "shipping", "privacy", "terms"]
    const locales = ["en", "zh", "es", "pt", "fr", "de", "ru", "ar", "id", "vi", "th", "ms"]
    return [
      ...locales.flatMap((locale) =>
        pages.map((slug) => ({
          source: `/${locale}/${slug}`,
          destination: `/${locale}/pages/${slug}`,
          permanent: true,
        }))
      ),
      ...pages.map((slug) => ({
        source: `/${slug}`,
        destination: `/en/pages/${slug}`,
        permanent: true,
      })),
    ]
  },
}

export default withNextIntl(nextConfig)