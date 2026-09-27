import { NextRequest, NextResponse } from "next/server"
import { requireAdmin, getAdminToken } from "@/lib/auth/admin-guard"
import { prisma } from "@/lib/db/prisma"
import { sendNewsletterEmail } from "@/lib/email/resend"
import { buildUnsubscribeUrl, generateUnsubscribeToken } from "@/lib/newsletter/token"

export const dynamic = "force-dynamic"

/**
 * Hard ceiling on one request. The dashboard drives the send as a sequence of
 * small batches so a long campaign never rides on a single request that could
 * hit the server's timeout.
 */
const MAX_BATCH = 20
const MAX_SUBJECT = 200
const MAX_BODY = 20000

type Failure = { email: string; error: string }

export async function POST(req: NextRequest) {
  const authError = await requireAdmin(req)
  if (authError) return authError

  const body = (await req.json().catch(() => null)) as {
    subject?: unknown
    body?: unknown
    emails?: unknown
    test?: unknown
  } | null

  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const subject = typeof body.subject === "string" ? body.subject.trim() : ""
  const content = typeof body.body === "string" ? body.body.trim() : ""

  if (!subject || subject.length > MAX_SUBJECT) {
    return NextResponse.json({ error: `Subject is required (max ${MAX_SUBJECT} characters)` }, { status: 400 })
  }
  if (!content || content.length > MAX_BODY) {
    return NextResponse.json({ error: `Body is required (max ${MAX_BODY} characters)` }, { status: 400 })
  }

  // Test send: one copy to the signed-in admin, no token needed because the
  // recipient is by definition active.
  if (body.test === true) {
    const token = await getAdminToken(req)
    const to = token?.email
    if (!to) {
      return NextResponse.json({ error: "Admin account has no email address" }, { status: 400 })
    }
    // Prefer the admin's real token when they are subscribed too, so the test
    // exercises the working unsubscribe path rather than the invalid-link page.
    const own = await prisma.newsletter.findFirst({
      where: { email: to, isActive: true },
      select: { unsubscribeToken: true },
    })
    try {
      await sendNewsletterEmail({
        to,
        subject,
        body: content,
        unsubscribeUrl: buildUnsubscribeUrl(own?.unsubscribeToken || generateUnsubscribeToken()),
      })
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Failed to send test email" },
        { status: 500 }
      )
    }
    return NextResponse.json({ sent: 1, failed: 0, failures: [] as Failure[], test: true, to })
  }

  if (!Array.isArray(body.emails) || body.emails.length === 0) {
    return NextResponse.json({ error: "emails array is required" }, { status: 400 })
  }
  if (body.emails.length > MAX_BATCH) {
    return NextResponse.json({ error: `At most ${MAX_BATCH} recipients per request` }, { status: 400 })
  }

  const requested = body.emails.filter((e): e is string => typeof e === "string" && e.trim().length > 0)
  if (requested.length === 0) {
    return NextResponse.json({ error: "No valid recipients" }, { status: 400 })
  }

  /*
   * Recipients are resolved against the subscriber table instead of trusted
   * from the request. That keeps this endpoint from turning into a mailer for
   * arbitrary addresses, and it means a subscriber who unsubscribed mid-send is
   * skipped rather than mailed.
   */
  const subscribers = await prisma.newsletter.findMany({
    where: { isActive: true, email: { in: requested } },
    select: { id: true, email: true, unsubscribeToken: true },
  })

  const failures: Failure[] = []
  let sent = 0

  for (const sub of subscribers) {
    try {
      /*
       * Rows created before the token column existed have none. Mint one on the
       * fly so every recipient of a bulk send gets a working unsubscribe link
       * without needing a separate backfill migration.
       */
      let token = sub.unsubscribeToken
      if (!token) {
        token = generateUnsubscribeToken()
        await prisma.newsletter.update({ where: { id: sub.id }, data: { unsubscribeToken: token } })
      }

      await sendNewsletterEmail({
        to: sub.email,
        subject,
        body: content,
        unsubscribeUrl: buildUnsubscribeUrl(token),
      })
      sent += 1
    } catch (e) {
      failures.push({ email: sub.email, error: e instanceof Error ? e.message : "Unknown error" })
    }
  }

  // Anything the dashboard asked for that is not an active subscriber, plus the
  // unsubscribes we sent, are reported back so the totals add up.
  const known = new Set(subscribers.map((s) => s.email))
  for (const email of requested) {
    if (!known.has(email)) {
      failures.push({ email, error: "Not an active subscriber" })
    }
  }

  return NextResponse.json({ sent, failed: failures.length, failures })
}
