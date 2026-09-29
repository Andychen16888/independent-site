import { NextRequest, NextResponse } from "next/server"
import { Prisma, QuotationStatus } from "@prisma/client"
import { requireAdmin } from "@/lib/auth/admin-guard"
import { prisma } from "@/lib/db/prisma"

export const dynamic = "force-dynamic"

const MAX_PAGE_SIZE = 100

export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req)
  if (authError) return authError

  const sp = req.nextUrl.searchParams
  const page = Math.max(1, Number(sp.get("page")) || 1)
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(sp.get("pageSize")) || 20))
  const search = (sp.get("search") || "").trim()
  const status = (sp.get("status") || "").trim().toUpperCase()

  const where: Prisma.QuotationWhereInput = {}

  if (status && Object.values(QuotationStatus).includes(status as QuotationStatus)) {
    where.status = status as QuotationStatus
  }
  if (search) {
    where.OR = [
      { quotationNo: { contains: search, mode: "insensitive" } },
      { inquiry: { inquiryNo: { contains: search, mode: "insensitive" } } },
      { inquiry: { customerName: { contains: search, mode: "insensitive" } } },
      { inquiry: { companyName: { contains: search, mode: "insensitive" } } },
      { inquiry: { email: { contains: search, mode: "insensitive" } } },
    ]
  }

  const [total, items, statusCounts] = await Promise.all([
    prisma.quotation.count({ where }),
    prisma.quotation.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        inquiry: {
          // id as well as inquiryNo: the detail page is addressed by primary key,
          // so the list has to carry it or the link cannot be built.
          select: { id: true, inquiryNo: true, customerName: true, companyName: true, country: true },
        },
        _count: { select: { items: true } },
      },
    }),
    prisma.quotation.groupBy({ by: ["status"], _count: { _all: true } }),
  ])

  return NextResponse.json({
    items: items.map((q) => ({ ...q, totalAmount: Number(q.totalAmount) })),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
    statusCounts: Object.fromEntries(statusCounts.map((s) => [s.status, s._count._all])),
  })
}
