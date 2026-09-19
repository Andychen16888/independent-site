import { getToken } from "next-auth/jwt"
import { NextRequest, NextResponse } from "next/server"
import createIntlMiddleware from "next-intl/middleware"
import { routing } from "@/i18n/routing"

const intlMiddleware = createIntlMiddleware(routing)

const localeSet: Set<string> = new Set(routing.locales)

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

  return intlMiddleware(req)
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
}