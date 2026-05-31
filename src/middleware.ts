import { getToken } from "next-auth/jwt"
import { NextRequest, NextResponse } from "next/server"

export async function middleware(req: NextRequest) {
  try {
    const token = await getToken({ req })
    if (!token) {
      return NextResponse.redirect(new URL("/auth/signin", req.url))
    }

    const path = req.nextUrl.pathname
    if (path.startsWith("/admin") && token.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/auth/signin", req.url))
    }
  } catch {
    return NextResponse.redirect(new URL("/auth/signin", req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*"],
}
