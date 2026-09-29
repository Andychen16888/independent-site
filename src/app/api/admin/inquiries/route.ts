import { NextRequest, NextResponse } from "next/server"
import { InquiryStatus, Prisma } from "@prisma/client"
import { requireAdmin } from "@/lib/auth/admin-guard"
import { prisma } from "@/lib/db/prisma"

export const dynamic = "force-dynamic"

const MAX_PAGE_SIZE = 100

/**
 * Staff accounts carry first/last name separately and both are optional, so the
 * UI needs one display string that never comes back blank.
 */
function displayName(user: { firstName: string | null; lastName: string | null; email: string }): string {
  const full = [user.firstName, user.lastName].filter(Boolean).join(" ").trim()
  return full || user.email
}

/**
 * Enquiry list with search, status filter and pagination.
 *
 * Search is a case-insensitive OR across the fields a salesperson actually
 * looks up on: the reference number, the buyer's name or company, and the email
 * or product. Multi-column `contains` cannot use a normal b-tree index, so this
 * is a sequential scan — acceptable while the table is in the thousands, and the
 * reason `inquiryNo` and `email` are separately indexed below.
 */
export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req)
  if (authError) return authError

  const sp = req.nextUrl.searchParams
  const page = Math.max(1, Number(sp.get("page")) || 1)
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(sp.get("pageSize")) || 20))
  const search = (sp.get("search") || "").trim()
  const status = (sp.get("status") || "").trim().toUpperCase()

  const where: Prisma.InquiryWhereInput = {}

  if (status && Object.values(InquiryStatus).includes(status as InquiryStatus)) {
    where.status = status as InquiryStatus
  }

  if (search) {
    where.OR = [
      { inquiryNo: { contains: search, mode: "insensitive" } },
      { customerName: { contains: search, mode: "insensitive" } },
      { companyName: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { productName: { contains: search, mode: "insensitive" } },
    ]
  }

  const [total, items, statusCounts] = await Promise.all([
    prisma.inquiry.count({ where }),
    prisma.inquiry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        inquiryNo: true,
        customerName: true,
        companyName: true,
        country: true,
        email: true,
        productName: true,
        quantity: true,
        unit: true,
        currency: true,
        targetPrice: true,
        status: true,
        source: true,
        createdAt: true,
        assignedUser: { select: { firstName: true, lastName: true, email: true } },
        _count: { select: { quotations: true, emailRecords: true, followUps: true } },
      },
    }),
    // Unfiltered tallies, so the sidebar badges show the true backlog per stage
    // rather than the count of whatever filter happens to be applied.
    prisma.inquiry.groupBy({ by: ["status"], _count: { _all: true } }),
  ])

  return NextResponse.json({
    items: items.map((i) => ({
      ...i,
      targetPrice: i.targetPrice != null ? Number(i.targetPrice) : null,
      quantity: i.quantity != null ? Number(i.quantity) : null,
      assignedUser: i.assignedUser
        ? { ...i.assignedUser, displayName: displayName(i.assignedUser) }
        : null,
    })),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
    statusCounts: Object.fromEntries(
      statusCounts.map((s) => [s.status, s._count._all])
    ),
  })
}
