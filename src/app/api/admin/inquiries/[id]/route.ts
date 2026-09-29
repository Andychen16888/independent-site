import { NextRequest, NextResponse } from "next/server"
import { InquiryStatus, Prisma } from "@prisma/client"
import { requireAdmin } from "@/lib/auth/admin-guard"
import { prisma } from "@/lib/db/prisma"

export const dynamic = "force-dynamic"

type Params = { params: Promise<{ id: string }> }

/** Full enquiry record: customer, product snapshot, quotations, mail, follow-ups. */
export async function GET(req: NextRequest, { params }: Params) {
  const authError = await requireAdmin(req)
  if (authError) return authError

  const { id } = await params
  const inquiry = await prisma.inquiry.findUnique({
    where: { id },
    include: {
      assignedUser: { select: { id: true, firstName: true, lastName: true, email: true } },
      product: { select: { id: true, slug: true, name: true } },
      quotations: {
        orderBy: { createdAt: "desc" },
        include: { items: { orderBy: { sortOrder: "asc" } } },
      },
      emailRecords: { orderBy: { createdAt: "desc" } },
      followUps: { orderBy: { followUpDate: "asc" } },
    },
  })

  if (!inquiry) {
    return NextResponse.json({ error: "Enquiry not found" }, { status: 404 })
  }

  // Decimal columns are serialised as strings by Prisma; convert so the client
  // does not have to know which fields are money or fractional quantities.
  return NextResponse.json({
    ...inquiry,
    targetPrice: inquiry.targetPrice != null ? Number(inquiry.targetPrice) : null,
    recommendedPrice: inquiry.recommendedPrice != null ? Number(inquiry.recommendedPrice) : null,
    quotations: inquiry.quotations.map((q) => ({
      ...q,
      totalAmount: Number(q.totalAmount),
      items: q.items.map((i) => ({
        ...i,
        quantity: Number(i.quantity),
        unitPrice: Number(i.unitPrice),
        amount: Number(i.amount),
      })),
    })),
    quantity: inquiry.quantity != null ? Number(inquiry.quantity) : null,
  })
}

/**
 * Partial update. Accepts status, assignment, notes and the AI review fields.
 * Only the keys present in the body are touched, so a status change never
 * clobbers a note saved a second earlier by another tab.
 */
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

  const data: Prisma.InquiryUpdateInput = {}

  if (body.status !== undefined) {
    const status = String(body.status).toUpperCase() as InquiryStatus
    if (!Object.values(InquiryStatus).includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }
    data.status = status
  }

  if (body.assignedUserId !== undefined) {
    const value = body.assignedUserId === null ? null : String(body.assignedUserId)
    if (value) {
      // Reject an assignment to a user that does not exist rather than failing
      // later on the foreign key with an opaque 500.
      const user = await prisma.user.findUnique({
        where: { id: value },
        select: { id: true },
      })
      if (!user) {
        return NextResponse.json({ error: "Assignee not found" }, { status: 400 })
      }
    }
    data.assignedUser = value ? { connect: { id: value } } : { disconnect: true }
  }

  for (const key of ["internalNote", "lostReason", "customerIntent", "aiReply"] as const) {
    if (body[key] !== undefined) {
      const value = body[key]
      data[key] = value === null ? null : String(value).slice(0, 10_000)
    }
  }

  if (body.recommendedPrice !== undefined) {
    const n = Number(body.recommendedPrice)
    if (!Number.isFinite(n) || n < 0) {
      return NextResponse.json({ error: "Invalid recommended price" }, { status: 400 })
    }
    data.recommendedPrice = n
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 })
  }

  try {
    const updated = await prisma.inquiry.update({ where: { id }, data })
    return NextResponse.json(updated)
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return NextResponse.json({ error: "Enquiry not found" }, { status: 404 })
    }
    throw e
  }
}

/**
 * Removes an enquiry.
 *
 * Deleting cascades to its quotations, mail records and follow-ups, so once any
 * of those exist the enquiry is permanent sales history and is refused with a
 * 409 — close it as LOST instead. Only a lead that never got a reply and has no
 * linked records (a duplicate, a spam entry) can be cleared this way.
 */
export async function DELETE(req: NextRequest, { params }: Params) {
  const authError = await requireAdmin(req)
  if (authError) return authError

  const { id } = await params
  const inquiry = await prisma.inquiry.findUnique({
    where: { id },
    select: {
      _count: { select: { quotations: true, emailRecords: true, followUps: true } },
    },
  })
  if (!inquiry) {
    return NextResponse.json({ error: "Enquiry not found" }, { status: 404 })
  }

  const linked = inquiry._count.quotations + inquiry._count.emailRecords + inquiry._count.followUps
  if (linked > 0) {
    return NextResponse.json(
      {
        error:
          "This enquiry has sales history and cannot be deleted. Set it to LOST instead.",
      },
      { status: 409 }
    )
  }

  try {
    await prisma.inquiry.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return NextResponse.json({ error: "Enquiry not found" }, { status: 404 })
    }
    throw e
  }
}
