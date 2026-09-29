import { NextRequest, NextResponse } from "next/server"
import { EmailDirection, EmailPurpose, EmailStatus, Prisma } from "@prisma/client"
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

  const statusRaw = (sp.get("status") || "").trim().toUpperCase()
  const directionRaw = (sp.get("direction") || "").trim().toUpperCase()
  const purposeRaw = (sp.get("purpose") || "").trim().toUpperCase()
  const inquiryId = sp.get("inquiryId")

  const where: Prisma.EmailRecordWhereInput = {}

  if (statusRaw && Object.values(EmailStatus).includes(statusRaw as EmailStatus)) {
    where.status = statusRaw as EmailStatus
  }
  if (directionRaw && Object.values(EmailDirection).includes(directionRaw as EmailDirection)) {
    where.direction = directionRaw as EmailDirection
  }
  if (purposeRaw && Object.values(EmailPurpose).includes(purposeRaw as EmailPurpose)) {
    where.purpose = purposeRaw as EmailPurpose
  }
  if (inquiryId) where.inquiryId = inquiryId

  if (search) {
    where.OR = [
      { emailNo: { contains: search, mode: "insensitive" } },
      { subject: { contains: search, mode: "insensitive" } },
      { receiver: { contains: search, mode: "insensitive" } },
      { inquiry: { inquiryNo: { contains: search, mode: "insensitive" } } },
      { inquiry: { companyName: { contains: search, mode: "insensitive" } } },
    ]
  }

  const [total, items, statusCounts] = await Promise.all([
    prisma.emailRecord.count({ where }),
    prisma.emailRecord.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        // id as well as inquiryNo: the detail page is addressed by primary key, so
        // the list has to carry it or the link cannot be built.
        inquiry: { select: { id: true, inquiryNo: true, customerName: true, companyName: true } },
        quotation: { select: { quotationNo: true, status: true } },
      },
    }),
    prisma.emailRecord.groupBy({ by: ["status"], _count: { _all: true } }),
  ])

  return NextResponse.json({
    items,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
    statusCounts: Object.fromEntries(statusCounts.map((s) => [s.status, s._count._all])),
  })
}
