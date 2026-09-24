import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth/auth"
import { requestStorage } from "@/lib/auth/request-context"

const handler = NextAuth(authOptions)

function extractIp(headers: Headers): string | null {
  const real = headers.get("x-real-ip")
  if (real) return real.trim()
  const forwarded = headers.get("x-forwarded-for")
  if (forwarded) {
    const parts = forwarded.split(",").map((p) => p.trim())
    const last = parts[parts.length - 1]
    if (last) return last
  }
  return null
}

function withRequestMeta(fn: (req: Request, ctx: unknown) => Promise<Response> | Response) {
  return async (req: Request, ctx: unknown) => {
    const headers = req.headers
    const meta = {
      ip: extractIp(headers),
      userAgent: headers.get("user-agent"),
    }
    return requestStorage.run(meta, () => fn(req, ctx))
  }
}

const wrapped = withRequestMeta(handler)

export { wrapped as GET, wrapped as POST }