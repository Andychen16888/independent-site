import { prisma } from "@/lib/db/prisma"
import { sendEmail } from "@/lib/email/resend"
import { getSettingsForKeys } from "@/lib/settings/settings"
import { nextDocumentNumber } from "./numbering"
import { renderQuotationEmail } from "./quotation-email"

/**
 * Staff-facing mail for the sales pipeline.
 *
 * Recipients are resolved from real ADMIN accounts rather than a hard-coded
 * address, so the notification follows whoever administers the site. Delivery is
 * always best-effort: a sales record must never fail to save because SMTP is
 * misconfigured, and the staff member can always open the dashboard instead.
 */

function adminUrl(path: string): string {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "")
  return `${base}${path}`
}

async function resolveAdminRecipients(): Promise<string[]> {
  const admins = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "MODERATOR"] } },
    select: { email: true },
    take: 10,
  })
  const fromAccounts = admins.map((a) => a.email.trim().toLowerCase()).filter(Boolean)

  // Fall back to the public contact address so a site with no staff accounts
  // configured still reaches a human.
  const settings = await getSettingsForKeys(["contact.email"])
  const contact = (settings["contact.email"] || "").trim().toLowerCase()

  return [...new Set([...fromAccounts, ...(contact ? [contact] : [])])]
}

function shell(brand: string, heading: string, body: string): string {
  return `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="font-size: 14px; letter-spacing: 4px; text-transform: uppercase; color: #333; font-weight: 300; margin: 0;">${escapeHtml(brand)}</h1>
      </div>
      <h2 style="font-size: 20px; font-weight: 300; color: #333; margin: 0 0 20px;">${escapeHtml(heading)}</h2>
      ${body}
      <div style="margin-top: 36px; padding-top: 24px; border-top: 1px solid #eee; text-align: center; color: #999; font-size: 12px;">
        <p style="margin: 0;">${escapeHtml(brand)}</p>
      </div>
    </div>
  `
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

/** Notifies staff that a new enquiry arrived. */
export async function notifyAdminsOfInquiry(
  inquiryId: string,
  inquiryNo: string,
  brand: string
): Promise<void> {
  const recipients = await resolveAdminRecipients()
  if (recipients.length === 0) return

  const inquiry = await prisma.inquiry.findUnique({
    where: { id: inquiryId },
    select: {
      customerName: true,
      companyName: true,
      country: true,
      email: true,
      productName: true,
      quantity: true,
      unit: true,
      customerMessage: true,
    },
  })
  if (!inquiry) return

  const link = adminUrl(`/admin/inquiries/${inquiryId}`)
  const rows: [string, string][] = [
    ["Reference", inquiryNo],
    ["Customer", `${inquiry.customerName}${inquiry.companyName ? ` — ${inquiry.companyName}` : ""}`],
    ["Country", inquiry.country || "—"],
    ["Email", inquiry.email],
    ["Product", inquiry.productName || "—"],
    [
      "Quantity",
      inquiry.quantity != null ? `${inquiry.quantity}${inquiry.unit ? ` ${inquiry.unit}` : ""}` : "—",
    ],
  ]

  const body = `
    <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #333; margin-bottom: 24px;">
      ${rows
        .map(
          ([label, value]) => `
        <tr>
          <td style="padding: 7px 0; border-bottom: 1px solid #f3f4f6; color: #6b7280; width: 110px; vertical-align: top;">${escapeHtml(label)}</td>
          <td style="padding: 7px 0; border-bottom: 1px solid #f3f4f6;">${escapeHtml(value)}</td>
        </tr>`
        )
        .join("")}
    </table>
    ${
      inquiry.customerMessage
        ? `<div style="padding: 14px 16px; background: #f9fafb; border-left: 3px solid #d1d5db; font-size: 14px; color: #333; white-space: pre-wrap; margin-bottom: 24px;">${escapeHtml(inquiry.customerMessage)}</div>`
        : ""
    }
    <div style="text-align: center;">
      <a href="${link}" style="display: inline-block; padding: 13px 34px; background: #111; color: #fff; text-decoration: none; letter-spacing: 2px; font-size: 11px; text-transform: uppercase;">Open Enquiry</a>
    </div>
  `

  await sendEmail({
    to: recipients.join(", "),
    subject: `New enquiry ${inquiryNo} — ${inquiry.companyName || inquiry.customerName}`,
    html: shell(brand, "New enquiry received", body),
  })
}

/** Sends the quotation PDF to the customer and logs the attempt. */
export async function sendQuotationToCustomer({
  quotationId,
  to,
  subject,
  message,
  brand,
}: {
  quotationId: string
  to: string
  subject?: string
  message?: string
  brand: string
}): Promise<{ emailNo: string }> {
  const quotation = await prisma.quotation.findUnique({
    where: { id: quotationId },
    include: {
      items: { orderBy: { sortOrder: "asc" } },
      inquiry: true,
    },
  })
  if (!quotation) throw new Error("Quotation not found")

  const { buildQuotationPdf } = await import("./quotation-document")
  // The document builder is keyed by primary key, not by the human-facing number.
  const pdf = await buildQuotationPdf(quotation.id)

  const html = renderQuotationEmail({
    brand,
    quotationNo: quotation.quotationNo,
    inquiryNo: quotation.inquiry.inquiryNo,
    customerName: quotation.inquiry.customerName,
    total: Number(quotation.totalAmount),
    currency: quotation.currency,
    validUntil: quotation.validUntil,
    message,
  })

  // `emailNo` is a unique column. A clock-derived value collides whenever two
  // sends land in the same millisecond (bursts, retries, a double-click), so the
  // same atomic sequence used for RFQ and QT numbers is used here.
  const emailNo = await nextDocumentNumber("EM")
  const record = await prisma.emailRecord.create({
    data: {
      emailNo,
      inquiryId: quotation.inquiryId,
      quotationId: quotation.id,
      direction: "OUTBOUND",
      purpose: "QUOTATION",
      receiver: to,
      subject: subject || `Quotation ${quotation.quotationNo} — ${brand}`,
      content: message || "",
      attachment: `${quotation.quotationNo}.pdf`,
      status: "PENDING",
    },
  })

  try {
    await sendEmail({
      to,
      subject: subject || `Quotation ${quotation.quotationNo} — ${brand}`,
      html,
      attachments: [
        {
          filename: `${quotation.quotationNo}.pdf`,
          content: pdf,
          contentType: "application/pdf",
        },
      ],
    })
  } catch (e) {
    await prisma.emailRecord.update({
      where: { id: record.id },
      data: { status: "FAILED", error: e instanceof Error ? e.message : String(e) },
    })
    throw e
  }

  /*
   * The mail is already away at this point, so a failure to flip the status to
   * SENT must not be reported as a failed send — that would prompt the operator
   * to resend a quotation the customer has. Log it and leave the record for
   * reconciliation instead.
   */
  try {
    await prisma.emailRecord.update({
      where: { id: record.id },
      data: { status: "SENT", sentAt: new Date(), error: null },
    })
  } catch (e) {
    console.error(`Quotation mail sent but ${emailNo} could not be marked SENT`, e)
  }

  return { emailNo }
}
