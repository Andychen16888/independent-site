import { NextRequest, NextResponse } from "next/server"
import { Prisma, QuotationStatus } from "@prisma/client"
import { requireAdmin } from "@/lib/auth/admin-guard"
import { prisma } from "@/lib/db/prisma"
import {
  buildQuotationCreate,
  computeValidUntil,
  decimalString,
  lineAmount,
  validateQuotationInput,
} from "@/lib/sales/quotation-schema"

export const dynamic = "force-dynamic"

type Params = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: Params) {
  const authError = await requireAdmin(req)
  if (authError) return authError

  const { id } = await params
  const quotation = await prisma.quotation.findUnique({
    where: { id },
    include: {
      items: { orderBy: { sortOrder: "asc" } },
      inquiry: true,
      emailRecords: { orderBy: { createdAt: "desc" } },
    },
  })
  if (!quotation) {
    return NextResponse.json({ error: "Quotation not found" }, { status: 404 })
  }

  return NextResponse.json({
    ...quotation,
    totalAmount: Number(quotation.totalAmount),
    items: quotation.items.map((i) => ({
      ...i,
      unitPrice: Number(i.unitPrice),
      amount: Number(i.amount),
    })),
  })
}

/**
 * Replaces a quotation's editable content.
 *
 * Items are deleted and recreated rather than diffed: a quotation is a snapshot
 * document, and rewriting the set keeps the stored total consistent with the
 * lines the buyer was actually sent.
 */
export async function PUT(req: NextRequest, { params }: Params) {
  const authError = await requireAdmin(req)
  if (authError) return authError

  const { id } = await params
  const existing = await prisma.quotation.findUnique({
    where: { id },
    select: { id: true, status: true },
  })
  if (!existing) {
    return NextResponse.json({ error: "Quotation not found" }, { status: 404 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const { data, total, errors } = validateQuotationInput(body)
  if (!data || total === undefined) {
    return NextResponse.json({ error: "Validation failed", fields: errors }, { status: 400 })
  }

  // An accepted or expired offer is a commitment; editing it silently would
  // rewrite history. Only the status itself can still move.
  if (
    (existing.status === "ACCEPTED" || existing.status === "EXPIRED") &&
    data.status === existing.status
  ) {
    return NextResponse.json(
      { error: `A ${existing.status.toLowerCase()} quotation can no longer be edited` },
      { status: 409 }
    )
  }

  try {
    const updated = await prisma.quotation.update({
      where: { id },
      data: {
        status: data.status,
        currency: data.currency,
        moq: data.moq ?? null,
        leadTime: data.leadTime ?? null,
        paymentTerms: data.paymentTerms ?? null,
        shippingTerms: data.shippingTerms ?? null,
        validityDays: data.validityDays ?? 30,
        // Recomputed: shortening validity must move the expiry with it.
        validUntil: computeValidUntil(data.validityDays ?? 30),
        note: data.note ?? null,
        totalAmount: total,
        ...(data.status === "ACCEPTED" ? { acceptedAt: new Date() } : {}),
        items: {
          deleteMany: {},
          create: data.items.map((item, sortOrder) => ({
            productId: item.productId ?? null,
            productName: item.productName,
            specification: item.specification ?? null,
            quantity: decimalString(item.quantity),
            unit: item.unit ?? null,
            unitPrice: item.unitPrice,
            amount: lineAmount(item.quantity, item.unitPrice),
            sortOrder,
          })),
        },
      },
      include: { items: { orderBy: { sortOrder: "asc" } } },
    })

    return NextResponse.json({
      ...updated,
      totalAmount: Number(updated.totalAmount),
      items: updated.items.map((i) => ({
        ...i,
        unitPrice: Number(i.unitPrice),
        amount: Number(i.amount),
      })),
    })
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 })
    }
    throw e
  }
}

/** Status-only transition, used by the Accept / Reject / Expire actions. */
export async function PATCH(req: NextRequest, { params }: Params) {
  const authError = await requireAdmin(req)
  if (authError) return authError

  const { id } = await params
  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const status = String(body.status || "").toUpperCase() as QuotationStatus
  if (!Object.values(QuotationStatus).includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 })
  }

  const now = new Date()
  const data: Prisma.QuotationUpdateInput = { status }
  if (status === "ACCEPTED") data.acceptedAt = now
  if (status === "SENT") data.sentAt = now

  // Accepting an offer closes the enquiry as won.
  if (status === "ACCEPTED") {
    const quotation = await prisma.quotation.findUnique({
      where: { id },
      select: { inquiryId: true },
    })
    if (quotation) {
      await prisma.inquiry
        .update({
          where: { id: quotation.inquiryId },
          data: { status: "ORDER_CONFIRMED" },
        })
        .catch(() => undefined)
    }
  }

  try {
    const updated = await prisma.quotation.update({
      where: { id },
      data,
      select: { id: true, quotationNo: true, status: true, acceptedAt: true, sentAt: true },
    })
    return NextResponse.json(updated)
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 })
    }
    throw e
  }
}
