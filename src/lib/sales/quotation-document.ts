import { prisma } from "@/lib/db/prisma"
import { getSettingsForKeys } from "@/lib/settings/settings"
import { renderQuotationPdf } from "./quotation-pdf"

/**
 * Bridges the database to the PDF renderer.
 *
 * The renderer itself is pure (data in, Buffer out) so it can be tested without
 * a database; this module is the only place that knows how to load a quotation
 * and where the supplier's own details come from.
 */

export async function loadSupplierDetails() {
  const settings = await getSettingsForKeys([
    "site.name",
    "company.name",
    "company.address",
    "contact.email",
    "contact.phone",
  ])
  return {
    siteName: settings["site.name"] || "Our Company",
    companyName: settings["company.name"] || null,
    address: settings["company.address"] || null,
    email: settings["contact.email"] || null,
    phone: settings["contact.phone"] || null,
    website: (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/+$/, "") || null,
  }
}

/** Renders the PDF for a stored quotation. */
export async function buildQuotationPdf(quotationId: string): Promise<Buffer> {
  const quotation = await prisma.quotation.findUnique({
    where: { id: quotationId },
    include: { items: { orderBy: { sortOrder: "asc" } }, inquiry: true },
  })
  if (!quotation) throw new Error("Quotation not found")

  return renderQuotationPdf({
    quotationNo: quotation.quotationNo,
    createdAt: quotation.createdAt,
    validUntil: quotation.validUntil,
    validityDays: quotation.validityDays,
    currency: quotation.currency,
    moq: quotation.moq,
    leadTime: quotation.leadTime,
    paymentTerms: quotation.paymentTerms,
    shippingTerms: quotation.shippingTerms,
    note: quotation.note,
    totalAmount: Number(quotation.totalAmount),
    items: quotation.items.map((i) => ({
      productName: i.productName,
      specification: i.specification,
      quantity: Number(i.quantity),
      unit: i.unit,
      unitPrice: Number(i.unitPrice),
      amount: Number(i.amount),
    })),
    inquiry: {
      inquiryNo: quotation.inquiry.inquiryNo,
      customerName: quotation.inquiry.customerName,
      companyName: quotation.inquiry.companyName,
      email: quotation.inquiry.email,
      phone: quotation.inquiry.phone,
      whatsapp: quotation.inquiry.whatsapp,
      country: quotation.inquiry.country,
      city: quotation.inquiry.city,
      address: quotation.inquiry.address,
    },
    supplier: await loadSupplierDetails(),
  })
}
