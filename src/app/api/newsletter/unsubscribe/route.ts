import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { routing } from "@/i18n/routing"

export const dynamic = "force-dynamic"

const DEFAULT_LOCALE = "en"
const SUPPORTED = new Set<string>(routing.locales)

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

  /*
   * Land the reader in their own language. The confirmation page exists in all
   * 7 locales, and a reassurance written in a language the reader cannot read
   * is indistinguishable from an error. The parameter is checked against the
   * routing config because it comes straight off the query string, and a
   * rejected value falls back to English rather than 404ing.
   */
  const requested = req.nextUrl.searchParams.get("locale")
  const locale = requested && SUPPORTED.has(requested) ? requested : DEFAULT_LOCALE

  const target = new URL(`/${locale}/newsletter/unsubscribed`, req.nextUrl.origin)
  target.searchParams.set("status", status)
  return NextResponse.redirect(target)
}
