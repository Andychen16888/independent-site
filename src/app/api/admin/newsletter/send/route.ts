import { NextRequest, NextResponse } from "next/server"
import { requireAdmin, getAdminToken } from "@/lib/auth/admin-guard"
import { prisma } from "@/lib/db/prisma"
import { sendNewsletterEmail } from "@/lib/email/resend"
import { buildUnsubscribeUrl, generateUnsubscribeToken } from "@/lib/newsletter/token"
import { startCampaign } from "@/lib/newsletter/campaign-runner"
import {
  MAX_BODY,
  MAX_CAMPAIGN_RECIPIENTS,
  MAX_SUBJECT,
  clampDelay,
} from "@/lib/newsletter/constants"

export const dynamic = "force-dynamic"

/**
 * Start a bulk send, or deliver a single test copy.
 *
 * The request only records intent: the campaign row plus a snapshot of the
 * audience. Actual delivery happens in `campaign-runner`, one message at a time,
 * so the run survives the browser tab closing and cannot be duplicated by
 * retrying this request.
 */
export async function POST(req: NextRequest) {
  const authError = await requireAdmin(req)
  if (authError) return authError

  const body = (await req.json().catch(() => null)) as {
    subject?: unknown
    body?: unknown
    delayMs?: unknown
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
    return NextResponse.json({ test: true, to })
  }

  // Only one campaign may be in flight. Two interleaved runs from one IP is
  // exactly the burst pattern that triggers provider throttling.
  const inFlight = await prisma.newsletterCampaign.findFirst({
    where: { status: "SENDING" },
    select: { id: true },
  })
  if (inFlight) {
    return NextResponse.json(
      { error: "A campaign is already sending. Stop or wait for it to finish." },
      { status: 409 }
    )
  }

  /*
   * The audience is snapshotted from the subscriber table rather than trusted
   * from the request. That keeps this endpoint from becoming a mailer for
   * arbitrary addresses, and it fixes the recipient list at campaign creation so
   * the run has a stable audience to report against.
   */
  const subscribers = await prisma.newsletter.findMany({
    where: { isActive: true },
    select: { email: true },
    orderBy: { createdAt: "asc" },
  })

  if (subscribers.length === 0) {
    return NextResponse.json({ error: "No active subscribers to send to" }, { status: 400 })
  }
  if (subscribers.length > MAX_CAMPAIGN_RECIPIENTS) {
    return NextResponse.json(
      { error: `Campaign audience exceeds the ${MAX_CAMPAIGN_RECIPIENTS} recipient limit` },
      { status: 400 }
    )
  }

  const delayMs = clampDelay(body.delayMs)

  const campaign = await prisma.$transaction(async (tx) => {
    const created = await tx.newsletterCampaign.create({
      data: { subject, body: content, delayMs, totalCount: subscribers.length },
    })
    await tx.newsletterSend.createMany({
      data: subscribers.map((s) => ({ campaignId: created.id, email: s.email })),
    })
    return created
  })

  // Fire and forget. The dashboard polls for progress.
  startCampaign(campaign.id)

  return NextResponse.json({ campaignId: campaign.id, total: subscribers.length, delayMs })
}
