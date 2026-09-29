import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth/admin-guard"
import { prisma } from "@/lib/db/prisma"
import { sendQuotationToCustomer } from "@/lib/sales/notifications"
import { getSiteSeo } from "@/lib/settings/settings"

export const dynamic = "force-dynamic"

type Params = { params: Promise<{ id: string }> }

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/**
 * Sends the quotation PDF to the customer and records the attempt.
 *
 * Only an ADMIN-supplied recipient is used, never one carried in the request
 * body, so this endpoint cannot be turned into an open relay. On success the
 * quotation is marked SENT and the enquiry advances to QUOTATION_SENT.
 */
export async function POST(req: NextRequest, { params }: Params) {
  const authError = await requireAdmin(req)
  if (authError) return authError

  const { id } = await params
  const quotation = await prisma.quotation.findUnique({
    where: { id },
    select: { id: true, status: true, inquiryId: true, inquiry: { select: { email: true } } },
  })
  if (!quotation) {
    return NextResponse.json({ error: "Quotation not found" }, { status: 404 })
  }

  if (quotation.status === "ACCEPTED") {
    return NextResponse.json(
      { error: "This quotation has already been accepted" },
      { status: 409 }
    )
  }

  let body: Record<string, unknown> = {}
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    // An empty body is valid: send to the enquiry's own address.
  }

  const to = String(body.to ?? quotation.inquiry.email ?? "").trim().toLowerCase()
  if (!EMAIL_RE.test(to)) {
    return NextResponse.json({ error: "A valid recipient address is required" }, { status: 400 })
  }

  const subject = body.subject ? String(body.subject).slice(0, 200) : undefined
  const message = body.message ? String(body.message).slice(0, 5000) : undefined

  const brand = (await getSiteSeo().catch(() => null))?.siteName ?? "Our Company"

  try {
    const { emailNo } = await sendQuotationToCustomer({
      quotationId: quotation.id,
      to,
      subject,
      message,
      brand,
    })

    // Only record SENT / QUOTATION_SENT after the mail actually went out, so a
    // failed send never leaves a document that looks delivered.
    await prisma.quotation.update({
      where: { id: quotation.id },
      data: { status: "SENT", sentAt: new Date() },
    })
    await prisma.inquiry.updateMany({
      where: { id: quotation.inquiryId, status: { in: ["NEW", "PROCESSING"] } },
      data: { status: "QUOTATION_SENT" },
    })

    return NextResponse.json({ success: true, emailNo })
  } catch (e) {
    console.error("Quotation send failed", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to send quotation" },
      { status: 502 }
    )
  }
}
