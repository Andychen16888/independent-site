import { getToken } from "next-auth/jwt"
import { NextRequest, NextResponse } from "next/server"
import createIntlMiddleware from "next-intl/middleware"
import { routing } from "@/i18n/routing"

const intlMiddleware = createIntlMiddleware(routing)

const localeSet: Set<string> = new Set(routing.locales)

// Keep the variant list in sync with the nginx template so every hop keys
// HTML and RSC separately.
const RSC_VARY =
  "RSC, Next-Router-State-Tree, Next-Router-Prefetch, Next-Router-Segment-Prefetch, Next-Url, Accept-Encoding"

function isRscRequest(req: NextRequest): boolean {
  return (
    req.headers.get("rsc") === "1" ||
    req.headers.has("next-router-state-tree") ||
    req.headers.has("next-router-prefetch") ||
    req.headers.has("next-router-segment-prefetch")
  )
}

// 本站在整个代码库里没有定义任何 Server Action（没有 "use server"）。因此任何带
// Next-Action 头的请求都只可能是伪造的——正是 CVE-2025-55182（React2Shell）
// 的利用方式：攻击者伪造 RSC action 元数据，诱导 Next 反序列化并 require 内部 Node
// 模块（如 child_process.execSync）实现未授权 RCE。即便将来升级遗漏，这里也能在
// Next 处理请求体之前直接拒绝，作为纵深防御。
function isServerActionRequest(req: NextRequest): boolean {
  return req.headers.has("next-action") || req.headers.has("next-router-action")
}

// Cloudflare (and other CDNs) ignore the custom `Vary: RSC` header and key the
// cache only by URL. A client-side navigation fetches the RSC payload for the
// same URL a browser later visits, so the CDN can cache that `text/x-component`
// body and serve it to normal page loads — the raw flight data users see as
// "乱码". `CDN-Cache-Control` is honoured by the edge independently of the
// browser-facing `Cache-Control`, so it stops the poisoning without disabling
// browser caching. RSC bodies themselves must never be stored anywhere.
function preventCdnCache(req: NextRequest, res: NextResponse): NextResponse {
  res.headers.set("CDN-Cache-Control", "no-store")
  res.headers.set("Cloudflare-CDN-Cache-Control", "no-store")
  res.headers.set("Vary", RSC_VARY)
  if (isRscRequest(req)) {
    res.headers.set("Cache-Control", "no-store")
  }
  return res
}

function stripLocalePrefix(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean)
  if (!segments.length) return "/"
  if (localeSet.has(segments[0])) {
    const rest = segments.slice(1).join("/")
    return rest ? `/${rest}` : "/"
  }
  return pathname || "/"
}

function fixXDefaultAlternate(req: NextRequest, res: NextResponse): NextResponse {
  const linkHeader = res.headers.get("link")
  if (!linkHeader || !linkHeader.includes('hreflang="x-default"')) {
    return res
  }

  const cleanPath = stripLocalePrefix(req.nextUrl.pathname)
  const xDefaultPath = cleanPath === "/" ? "/en" : `/en${cleanPath}`
  const xDefaultUrl = `${req.nextUrl.origin}${xDefaultPath}`
  const updated = linkHeader.replace(
    /<[^>]*>;\s*rel="alternate";\s*hreflang="x-default"/,
    `<${xDefaultUrl}>; rel="alternate"; hreflang="x-default"`
  )
  res.headers.set("link", updated)
  return res
}

function fixDoubleLocalePrefix(pathname: string): string | null {
  const segments = pathname.split("/").filter(Boolean)
  if (segments.length < 2) return null
  if (localeSet.has(segments[0]) && localeSet.has(segments[1])) {
    return "/" + segments.slice(1).join("/")
  }
  return null
}

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname

  // 在 Next 反序列化请求体之前拒绝伪造的 Server Action 调用（见上方注释）。
  if (isServerActionRequest(req)) {
    return new NextResponse("Not Found", { status: 404 })
  }

  // /api 与 /_next/data 只是为了让上面的 action 拦截覆盖到它们才纳入 matcher；
  // 这里放行，交给各自的路由处理（locale / HTML 处理不适用于它们）。
  if (path.startsWith("/api") || path.startsWith("/_next")) {
    return NextResponse.next()
  }

  const fixed = fixDoubleLocalePrefix(path)
  if (fixed) {
    const url = req.nextUrl.clone()
    url.pathname = fixed
    url.search = req.nextUrl.search
    return NextResponse.redirect(url, 301)
  }

  if (path.startsWith("/admin")) {
    try {
      let token = await getToken({ req, secureCookie: false })
      if (!token) {
        token = await getToken({ req, secureCookie: true })
      }

      if (!token) {
        const callbackUrl = encodeURIComponent(path)
        return NextResponse.redirect(
          new URL(`/en/auth/signin?callbackUrl=${callbackUrl}`, req.url)
        )
      }

      if (token.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/en/account", req.url))
      }

      return NextResponse.next()
    } catch {
      return NextResponse.redirect(new URL("/en/auth/signin", req.url))
    }
  }

  const intlResponse = intlMiddleware(req)
  return preventCdnCache(req, fixXDefaultAlternate(req, intlResponse))
}

export const config = {
  // /api 与 /_next/data 也纳入 matcher 以覆盖 Server Action 拦截；文档类路由沿用
  // 原有的排除规则（静态资源、_vercel、带扩展名的文件）。
  matcher: [
    "/api/:path*",
    "/_next/data/:path*",
    "/((?!api|_next|_vercel|.*\\..*).*)",
  ],
}
