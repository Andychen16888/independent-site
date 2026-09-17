import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  output: "standalone",
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
      "/account/:path*",
      "/auth/:path*",
      "/cart",
      "/checkout/:path*",
      "/wishlist",
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
    const pages = ["about", "contact", "shipping", "privacy", "terms"]
    return pages.map((slug) => ({
      source: `/${slug}`,
      destination: `/pages/${slug}`,
      permanent: true,
    }))
  },
}

export default nextConfig
