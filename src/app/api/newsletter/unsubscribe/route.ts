import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"

export const dynamic = "force-dynamic"

const DEFAULT_LOCALE = "en"

/**
 * One-click unsubscribe endpoint. Reached straight from an email client, so
 * it must work on a bare GET with no session, and it must always answer with
 * a redirect rather than JSON - a JSON body here looks like a broken page to
 * the person clicking the link.
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token")
  let status: "ok" | "already" | "invalid" = "invalid"

  if (token) {
    const changed = await prisma.newsletter.updateMany({
      where: { unsubscribeToken: token, isActive: true },
      data: { isActive: false },
    })
    if (changed.count > 0) {
      status = "ok"
    } else {
      // Distinguish "already unsubscribed" from a bogus token so the landing
      // page can reassure the reader instead of implying a failure.
      const known = await prisma.newsletter.findUnique({
        where: { unsubscribeToken: token },
        select: { isActive: true },
      })
      status = known ? "already" : "invalid"
    }
  }

  const target = new URL(`/${DEFAULT_LOCALE}/newsletter/unsubscribed`, req.nextUrl.origin)
  target.searchParams.set("status", status)
  return NextResponse.redirect(target)
}
