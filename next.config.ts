import type { NextConfig } from "next"
import createNextIntlPlugin from "next-intl/plugin"

const withNextIntl = createNextIntlPlugin()

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["geoip-lite"],
  outputFileTracingIncludes: {
    "/*": [
      "./messages/**/*.json",
      "./node_modules/geoip-lite/data/**",
    ],
  },
  experimental: {
    // 客户端路由缓存：静态分段缓存 1 小时，减少客户端导航时对服务器的重复请求。
    // （Next 15 中 staleTimes 必须是 experimental.staleTimes，放顶层会被忽略）
    staleTimes: {
      dynamic: 30,
      static: 3600,
    },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
    // CPU 优化: 只生成 WebP（不生成 AVIF——sharp 的 AVIF 编码极耗 CPU，
    // 双核小机在爬虫请求图片时容易被 AVIF 编码打满）。
    formats: ["image/webp"],
    // 优化结果在 .next/cache 落盘缓存 1 年，同一张图只编码一次。
    minimumCacheTTL: 31536000,
    qualities: [60, 75, 82, 85],
    // 限制候选分辨率，减少 sharp 编码组合数（同一张图最多按这几个宽度出图），
    // 其余宽度全部落到最小可用档，显著降低图片优化 CPU 占用。
    deviceSizes: [640, 828, 1080, 1920],
    imageSizes: [16, 32, 64, 128, 256, 384],
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