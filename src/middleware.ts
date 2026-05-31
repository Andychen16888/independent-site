import { getToken } from "next-auth/jwt"
import { NextRequest, NextResponse } from "next/server"

export async function middleware(req: NextRequest) {
  try {
    const token = await getToken({ req })
    const path = req.nextUrl.pathname

    if (!path.startsWith("/admin")) return NextResponse.next()

    if (!token) {
      const callbackUrl = encodeURIComponent(path)
      return NextResponse.redirect(new URL(`/auth/signin?callbackUrl=${callbackUrl}`, req.url))
    }

    if (token.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/account", req.url))
    }
  } catch {
    return NextResponse.redirect(new URL("/auth/signin", req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*"],
}
