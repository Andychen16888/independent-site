import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { nextDocumentNumber } from "@/lib/sales/numbering"
import { clientIp, rateLimit } from "@/lib/sales/rate-limit"
import { HONEYPOT_FIELD } from "@/lib/sales/honeypot"
import { validateInquiryInput, PUBLIC_INQUIRY_SOURCES } from "@/lib/sales/inquiry-schema"
import { notifyAdminsOfInquiry } from "@/lib/sales/notifications"
import { getSiteSeo } from "@/lib/settings/settings"

export const dynamic = "force-dynamic"

// An RFQ is a low-frequency, high-value action. 5 per hour per IP is far above
// real buying behaviour and far below a spam run.
const RATE_LIMIT = { limit: 5, windowMs: 60 * 60 * 1000 }

/**
 * Public enquiry submission.
 *
 * A honeypot field is checked before any database work: bots that fill every
 * input on the page get rejected without consuming a number or touching the DB.
 * It must be a dedicated hidden field, never a real one like `website` — reusing
 * a business field would silently discard a legitimate buyer's company site.
 */
export async function POST(req: Request) {
  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  // Honeypot: hidden from humans via CSS/tabindex, so anything in it is a bot.
  // A success response is still returned so the bot does not learn to adapt.
  if (str(body[HONEYPOT_FIELD]) !== "") {
    return NextResponse.json({ success: true })
  }

  const ip = clientIp(req)
  const limit = rateLimit(`rfq:${ip}`, RATE_LIMIT)
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many enquiries submitted. Please try again later." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    )
  }

  const { data, errors } = validateInquiryInput(body, {
    requireAll: true,
    allowedSources: PUBLIC_INQUIRY_SOURCES,
  })
  if (!data) {
    return NextResponse.json({ error: "Validation failed", fields: errors }, { status: 400 })
  }

  /*
   * A product id that resolves to nothing is an error, not a fallback: the
   * visitor came from a product page, so silently storing an enquiry with no
   * product attached would produce a lead the sales team cannot act on. A
   * genuine generic-form submission carries free text and no id instead.
   */
  let snapshot: {
    productId: string
    productName: string
    productImage: string | null
    productCategory: string | null
    modelNumber: string | null
  } | null = null

  if (data.productId) {
    const product = await prisma.product.findUnique({
      where: { id: data.productId },
      select: {
        id: true,
        name: true,
        model: true,
        // Primary image first so the snapshot matches what the visitor saw.
        images: { take: 1, orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] },
        categories: { take: 1, select: { category: { select: { name: true } } } },
      },
    })
    if (!product) {
      return NextResponse.json(
        { error: "The selected product is no longer available", fields: { productName: "Unknown product" } },
        { status: 400 }
      )
    }
    snapshot = {
      productId: product.id,
      productName: product.name,
      productImage: product.images[0]?.url ?? null,
      productCategory: product.categories[0]?.category.name ?? null,
      modelNumber: product.model,
    }
  }

  const inquiryNo = await nextDocumentNumber("RFQ")

  const inquiry = await prisma.inquiry.create({
    data: {
      inquiryNo,
      customerName: data.customerName,
      companyName: data.companyName,
      country: data.country,
      city: data.city,
      address: data.address,
      email: data.email,
      whatsapp: data.whatsapp,
      phone: data.phone,
      website: data.website,
      jobTitle: data.jobTitle,
      linkedin: data.linkedin,
      application: data.application,
      productId: snapshot?.productId,
      productName: snapshot?.productName ?? data.productName,
      productImage: snapshot?.productImage,
      productCategory: snapshot?.productCategory,
      modelNumber: snapshot?.modelNumber,
      quantity: data.quantity != null ? data.quantity.toFixed(3) : undefined,
      unit: data.unit,
      targetPrice: data.targetPrice,
      currency: data.currency,
      customerMessage: data.message,
      source: data.source,
      locale: data.locale,
    },
    select: { id: true, inquiryNo: true },
  })

  /*
   * A staff notification that fails must not turn a successful submission into
   * an error the visitor sees and retries, which would create a duplicate
   * enquiry. The enquiry is already durable; the notification is best-effort.
   */
  const brand = (await getSiteSeo().catch(() => null))?.siteName ?? "Our team"
  notifyAdminsOfInquiry(inquiry.id, inquiry.inquiryNo, brand).catch((e) =>
    console.error("Inquiry notification failed", e)
  )

  return NextResponse.json({ success: true, inquiryNo: inquiry.inquiryNo }, { status: 201 })
}

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : ""
}
