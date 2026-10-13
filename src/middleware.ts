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
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
}
