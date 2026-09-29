import type { Currency } from "@prisma/client"

/** HTML body for a quotation email; the PDF carries the commercial detail. */

const CURRENCY_SYMBOL: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  CNY: "¥",
  JPY: "¥",
  AUD: "A$",
  CAD: "C$",
}

function money(amount: number, currency: Currency): string {
  const symbol = CURRENCY_SYMBOL[currency] ?? `${currency} `
  return (
    symbol +
    amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  )
}

function shortDate(value: Date | null): string {
  if (!value) return ""
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(value)
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

export function renderQuotationEmail({
  brand,
  quotationNo,
  inquiryNo,
  customerName,
  total,
  currency,
  validUntil,
  message,
}: {
  brand: string
  quotationNo: string
  inquiryNo: string
  customerName: string
  total: number
  currency: Currency
  validUntil: Date | null
  message?: string | null
}): string {
  const validity = validUntil
    ? `This quotation is valid until <strong>${shortDate(validUntil)}</strong>.`
    : ""

  return `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="font-size: 14px; letter-spacing: 4px; text-transform: uppercase; color: #333; font-weight: 300; margin: 0;">${escapeHtml(brand)}</h1>
      </div>

      <p style="font-size: 15px; color: #333; margin: 0 0 16px;">Dear ${escapeHtml(customerName)},</p>

      <p style="font-size: 15px; color: #333; line-height: 1.7; margin: 0 0 20px;">
        Thank you for your enquiry. Please find our quotation
        <strong>${escapeHtml(quotationNo)}</strong> attached, in response to your reference
        ${escapeHtml(inquiryNo)}.
      </p>

      ${
        message
          ? `<div style="padding: 14px 16px; background: #f9fafb; border-left: 3px solid #d1d5db; font-size: 14px; color: #333; line-height: 1.7; white-space: pre-wrap; margin-bottom: 24px;">${escapeHtml(message)}</div>`
          : ""
      }

      <table style="width: 100%; border-collapse: collapse; margin: 0 0 24px;">
        <tr>
          <td style="padding: 12px 0; border-top: 1px solid #e5e7eb; color: #6b7280;">Quotation</td>
          <td style="padding: 12px 0; border-top: 1px solid #e5e7eb; text-align: right; color: #111;">${escapeHtml(quotationNo)}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-top: 1px solid #e5e7eb; color: #6b7280;">Total</td>
          <td style="padding: 12px 0; border-top: 1px solid #e5e7eb; text-align: right; font-size: 18px; font-weight: 600; color: #111;">${money(total, currency)}</td>
        </tr>
      </table>

      <p style="font-size: 13px; color: #6b7280; line-height: 1.7; margin: 0 0 24px;">
        ${validity} Prices are subject to final confirmation of specification and quantity.
        Please reply quoting ${escapeHtml(quotationNo)} and we will be glad to assist.
      </p>

      <div style="border-top: 1px solid #eee; padding-top: 24px; text-align: center; color: #9ca3af; font-size: 12px;">
        <p style="margin: 0;">${escapeHtml(brand)}</p>
      </div>
    </div>
  `
}
