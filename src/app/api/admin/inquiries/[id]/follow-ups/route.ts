import { NextRequest, NextResponse } from "next/server"
import { FollowUpStatus, Prisma } from "@prisma/client"
import { requireAdmin } from "@/lib/auth/admin-guard"
import { prisma } from "@/lib/db/prisma"

export const dynamic = "force-dynamic"

const MAX_PAGE_SIZE = 100

type Params = { params: Promise<{ id: string }> }

/** Follow-ups for one enquiry, soonest first. */
export async function GET(req: NextRequest, { params }: Params) {
  const authError = await requireAdmin(req)
  if (authError) return authError

  const { id } = await params
  const followUps = await prisma.followUp.findMany({
    where: { inquiryId: id },
    orderBy: [{ status: "asc" }, { followUpDate: "asc" }],
  })
  return NextResponse.json({ items: followUps })
}

/** Schedules a follow-up. */
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

  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const dateRaw = String(body.followUpDate || "")
  const date = new Date(dateRaw)
  if (!dateRaw || Number.isNaN(date.getTime())) {
    return NextResponse.json({ error: "A valid follow-up date is required" }, { status: 400 })
  }

  const statusRaw = String(body.status || "PENDING").toUpperCase() as FollowUpStatus
  const status = Object.values(FollowUpStatus).includes(statusRaw)
    ? statusRaw
    : "PENDING"

  const text = (value: unknown, max: number) => {
    if (value === null || value === undefined) return null
    const s = String(value).trim()
    return s ? s.slice(0, max) : null
  }

  try {
    const followUp = await prisma.followUp.create({
      data: {
        inquiryId: inquiry.id,
        followUpDate: date,
        note: text(body.note, 2000),
        nextAction: text(body.nextAction, 500),
        status,
        completedAt: status === "DONE" ? new Date() : null,
      },
    })
    return NextResponse.json(followUp, { status: 201 })
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return NextResponse.json({ error: "Enquiry not found" }, { status: 404 })
    }
    throw e
  }
}
