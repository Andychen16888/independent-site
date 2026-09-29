import { NextRequest, NextResponse } from "next/server"
import { FollowUpStatus, Prisma } from "@prisma/client"
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
  const where: Prisma.FollowUpWhereInput = {}

  if (statusRaw && Object.values(FollowUpStatus).includes(statusRaw as FollowUpStatus)) {
    where.status = statusRaw as FollowUpStatus
  }
  if (search) {
    where.OR = [
      { note: { contains: search, mode: "insensitive" } },
      { nextAction: { contains: search, mode: "insensitive" } },
      { inquiry: { inquiryNo: { contains: search, mode: "insensitive" } } },
      { inquiry: { companyName: { contains: search, mode: "insensitive" } } },
      { inquiry: { customerName: { contains: search, mode: "insensitive" } } },
    ]
  }

  /*
   * `due` narrows to the actionable set a salesperson opens the page for: still
   * pending and dated today or earlier. Defaults on, because an unfiltered list
   * buries the two overdue items among a hundred future ones.
   */
  if (sp.get("due") === "1") {
    const endOfToday = new Date()
    endOfToday.setHours(23, 59, 59, 999)
    where.status = "PENDING"
    where.followUpDate = { lte: endOfToday }
  }

  const [total, items, statusCounts, overdueCount] = await Promise.all([
    prisma.followUp.count({ where }),
    prisma.followUp.findMany({
      where,
      orderBy: [{ followUpDate: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        inquiry: {
          select: { id: true, inquiryNo: true, customerName: true, companyName: true, status: true },
        },
      },
    }),
    prisma.followUp.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.followUp.count({
      where: { status: "PENDING", followUpDate: { lt: new Date() } },
    }),
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
    overdueCount,
  })
}
