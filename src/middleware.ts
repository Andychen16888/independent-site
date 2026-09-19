import { getToken } from "next-auth/jwt"
import { NextRequest, NextResponse } from "next/server"
import createIntlMiddleware from "next-intl/middleware"
import { routing } from "@/i18n/routing"

const intlMiddleware = createIntlMiddleware(routing)

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname

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