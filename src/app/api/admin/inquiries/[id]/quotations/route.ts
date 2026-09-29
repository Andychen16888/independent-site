import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { requireAdmin } from "@/lib/auth/admin-guard"
import { prisma } from "@/lib/db/prisma"
import { nextDocumentNumber } from "@/lib/sales/numbering"
import { buildQuotationCreate, validateQuotationInput } from "@/lib/sales/quotation-schema"

export const dynamic = "force-dynamic"

type Params = { params: Promise<{ id: string }> }

/** Quotations for one enquiry, newest first. */
export async function GET(req: NextRequest, { params }: Params) {
  const authError = await requireAdmin(req)
  if (authError) return authError

  const { id } = await params
  const quotations = await prisma.quotation.findMany({
    where: { inquiryId: id },
    orderBy: { createdAt: "desc" },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  })

  return NextResponse.json({
    items: quotations.map((q) => ({
      ...q,
      totalAmount: Number(q.totalAmount),
      items: q.items.map((i) => ({
        ...i,
        unitPrice: Number(i.unitPrice),
        amount: Number(i.amount),
      })),
    })),
  })
}

/** Creates a quotation against an enquiry. */
export async function POST(req: NextRequest, { params }: Params) {
  const authError = await requireAdmin(req)
  if (authError) return authError

  const { id } = await params
  const inquiry = await prisma.inquiry.findUnique({
    where: { id },
    select: { id: true },
  })
  if (!inquiry) {
    return NextResponse.json({ error: "Enquiry not found" }, { status: 404 })
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

  const quotationNo = await nextDocumentNumber("QT")

  try {
    const quotation = await prisma.quotation.create({
      data: buildQuotationCreate(data, total, inquiry.id, quotationNo),
      include: { items: { orderBy: { sortOrder: "asc" } } },
    })

    /*
     * A first quotation is the moment the deal becomes real, so the enquiry moves
     * out of NEW. Only advanced automatically when it has not already moved —
     * never walk a LOST or ORDER_CONFIRMED enquiry backwards into processing.
     */
    if (data.status === "SENT") {
      await prisma.inquiry
        .updateMany({
          where: { id: inquiry.id, status: "NEW" },
          data: { status: "PROCESSING" },
        })
        .catch(() => undefined)
    }

    return NextResponse.json(
      {
        ...quotation,
        totalAmount: Number(quotation.totalAmount),
        items: quotation.items.map((i) => ({
          ...i,
          unitPrice: Number(i.unitPrice),
          amount: Number(i.amount),
        })),
      },
      { status: 201 }
    )
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json(
        { error: "Quotation number collision, please retry" },
        { status: 409 }
      )
    }
    throw e
  }
}
