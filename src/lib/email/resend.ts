import nodemailer from "nodemailer"
import { getSiteSeo } from "@/lib/settings/settings"
import { appendUtmParams } from "@/lib/tracking/source"

let transporter: nodemailer.Transporter | null = null

function getTransporter() {
  if (!transporter) {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env

    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
      console.warn("SMTP not configured — emails will not be sent")
      return null
    }

    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT) || 587,
      secure: Number(SMTP_PORT) === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    })
  }
  return transporter
}

export interface EmailAttachment {
  /** File name as the recipient sees it, e.g. "QT-20260927001.pdf". */
  filename: string
  content: Buffer
  contentType?: string
}

export async function sendEmail({
  to,
  subject,
  html,
  attachments,
}: {
  to: string
  subject: string
  html: string
  /** Used by the quotation flow to attach the generated PDF offer. */
  attachments?: EmailAttachment[]
}) {
  const t = getTransporter()
  if (!t) {
    throw new Error("SMTP not configured — set SMTP_HOST, SMTP_USER, and SMTP_PASS in .env")
  }

  await t.sendMail({
    from: process.env.SMTP_FROM || `"${(await getSiteSeo()).siteName}" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
    ...(attachments?.length
      ? {
          attachments: attachments.map((a) => ({
            filename: a.filename,
            content: a.content,
            contentType: a.contentType ?? "application/octet-stream",
          })),
        }
      : {}),
  })
}

export async function sendOrderConfirmationEmail(
  email: string,
  orderNumber: string,
  items: any[],
  total: string
) {
  const brand = (await getSiteSeo()).siteName
  const itemsHtml = items
    .map(
      (item) =>
        `<tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">
            <img src="${item.productImage}" alt="${item.productName}" width="60" style="vertical-align: middle; margin-right: 10px;" />
            ${item.productName} x ${item.quantity}
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${(item.unitPrice * item.quantity).toFixed(2)}</td>
        </tr>`
    )
    .join("")

  await sendEmail({
    to: email,
    subject: `Order Confirmed - ${orderNumber}`,
    html: `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 40px;">
          <h1 style="font-size: 14px; letter-spacing: 4px; text-transform: uppercase; color: #333; font-weight: 300;">${brand}</h1>
        </div>
        <h2 style="font-size: 24px; font-weight: 300; color: #333; text-align: center;">Thank You for Your Order</h2>
        <p style="text-align: center; color: #666; margin-bottom: 30px;">Order #${orderNumber}</p>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
          ${itemsHtml}
        </table>
        <div style="border-top: 1px solid #eee; padding-top: 20px; text-align: right; font-size: 18px; font-weight: 300;">
          Total: ${total}
        </div>
        <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid #eee; text-align: center; color: #999; font-size: 12px;">
          <p>${brand} — Where East Meets West</p>
          <p>Questions? Contact our support team</p>
        </div>
      </div>
    `,
  })
}

export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string
) {
  const brand = (await getSiteSeo()).siteName
  await sendEmail({
    to: email,
    subject: `Reset Your Password — ${brand}`,
    html: `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 40px;">
          <h1 style="font-size: 14px; letter-spacing: 4px; text-transform: uppercase; color: #333; font-weight: 300;">${brand}</h1>
        </div>
        <h2 style="font-size: 24px; font-weight: 300; color: #333; text-align: center;">Reset Your Password</h2>
        <p style="text-align: center; color: #666; margin-bottom: 30px;">
          We received a request to reset your password. Click the button below to choose a new one.
        </p>
        <div style="text-align: center; margin: 40px 0;">
          <a href="${resetUrl}"
             style="display: inline-block; padding: 14px 40px; background: #333; color: #fff; text-decoration: none; letter-spacing: 2px; font-size: 12px; text-transform: uppercase;">
            Reset Password
          </a>
        </div>
        <p style="text-align: center; color: #999; font-size: 13px;">
          This link will expire in 1 hour. If you didn't request this, you can safely ignore this email.
        </p>
        <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid #eee; text-align: center; color: #999; font-size: 12px;">
          <p>${brand} — Where East Meets West</p>
        </div>
      </div>
    `,
  })
}

export async function sendAbandonedCartEmail(email: string, items: any[]) {
  const brand = (await getSiteSeo()).siteName
  const itemsHtml = items
    .map(
      (item) =>
        `<tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">
            <img src="${item.image}" alt="${item.name}" width="60" style="vertical-align: middle; margin-right: 10px;" />
            ${item.name} x ${item.quantity}
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${(item.price * item.quantity).toFixed(2)}</td>
        </tr>`
    )
    .join("")

  await sendEmail({
    to: email,
    subject: "Complete Your Order — Items Waiting in Your Cart",
    html: `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 40px;">
          <h1 style="font-size: 14px; letter-spacing: 4px; text-transform: uppercase; color: #333; font-weight: 300;">${brand}</h1>
        </div>
        <h2 style="font-size: 24px; font-weight: 300; color: #333; text-align: center;">You Left Something Behind</h2>
        <p style="text-align: center; color: #666; margin-bottom: 30px;">Your cart items are still waiting for you</p>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">${itemsHtml}</table>
        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.NEXT_PUBLIC_SITE_URL}/cart" style="display: inline-block; padding: 14px 40px; background: #333; color: #fff; text-decoration: none; letter-spacing: 2px; font-size: 12px; text-transform: uppercase;">Return to Cart</a>
        </div>
      </div>
    `,
  })
}

/** Escape plain-text newsletter copy before it is dropped into the HTML shell. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

/** Matches bare http(s) URLs inside the plain-text body. */
const URL_PATTERN = /https?:\/\/[^\s<>"']+/gi

/**
 * Render plain-text campaign copy to HTML, turning any URL the operator typed into
 * a link tagged with UTM parameters.
 *
 * The tagging is what makes email promotion attributable in the admin analytics:
 * a click lands on the site with `utm_source=newsletter&utm_medium=email`, which
 * `/api/track` classifies as an "Email" source. A URL typed straight into the
 * browser after reading the mail is indistinguishable from direct traffic -- no
 * web analytics can recover that -- so the guidance to operators is to always
 * include a clickable link.
 */
function renderNewsletterBody(
  body: string,
  utm?: { source: string; medium: string; campaign?: string | null }
): string {
  const parts: string[] = []
  let last = 0
  for (const match of body.matchAll(URL_PATTERN)) {
    const index = match.index ?? 0
    const raw = match[0]
    // Punctuation that just happens to follow the URL ("visit https://x.com.") is
    // not part of the link; strip it so the anchor does not swallow the period.
    const trailing = raw.match(/[.,;:!?'")\]}]+$/)?.[0] ?? ""
    const url = trailing ? raw.slice(0, -trailing.length) : raw
    parts.push(escapeHtml(body.slice(last, index)))
    if (utm) {
      const tagged = appendUtmParams(url, utm)
      parts.push(
        `<a href="${escapeHtml(tagged)}" style="color:#333; text-decoration:underline;">${escapeHtml(url)}</a>`
      )
    } else {
      parts.push(escapeHtml(url))
    }
    if (trailing) parts.push(escapeHtml(trailing))
    last = index + raw.length
  }
  parts.push(escapeHtml(body.slice(last)))
  return parts.join("").replace(/\r?\n/g, "<br />")
}

/**
 * Bulk marketing email. Takes plain text from the dashboard and wraps it in the
 * same inline-styled shell as the transactional templates, so admins cannot
 * accidentally ship markup that email clients strip out.
 *
 * The unsubscribe link is mandatory for real campaigns: bulk send without a
 * working opt-out gets the domain throttled or blacklisted by receiving
 * providers, and is not compliant in the markets this site sells into. It is
 * optional only for the admin test-send path, which omits the footer entirely
 * when the tester is not on the subscriber list and therefore has no valid
 * token to link to -- a random one would just look broken.
 */
export async function sendNewsletterEmail({
  to,
  subject,
  body,
  unsubscribeUrl,
  utm,
}: {
  to: string
  subject: string
  body: string
  unsubscribeUrl?: string
  /** UTM applied to links in the body so arrivals are attributed to email. */
  utm?: { source: string; medium: string; campaign?: string | null }
}) {
  const brand = (await getSiteSeo()).siteName
  const safeBody = renderNewsletterBody(body, utm)
  const safeUnsubscribe = escapeHtml(unsubscribeUrl ?? "")

  await sendEmail({
    to,
    subject,
    html: `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 40px;">
          <h1 style="font-size: 14px; letter-spacing: 4px; text-transform: uppercase; color: #333; font-weight: 300;">${escapeHtml(brand)}</h1>
        </div>
        <div style="font-size: 15px; line-height: 1.8; color: #333;">${safeBody}</div>
        <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid #eee; text-align: center; color: #999; font-size: 12px;">
          <p style="margin: 0 0 12px;">${escapeHtml(brand)} &mdash; Where East Meets West</p>
          ${
            unsubscribeUrl
              ? `<p style="margin: 0;">
            <a href="${safeUnsubscribe}" style="color: #999; text-decoration: underline;">Unsubscribe</a>
            from these emails.
          </p>`
              : ""
          }
        </div>
      </div>
    `,
  })
}
