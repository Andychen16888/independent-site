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
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
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
