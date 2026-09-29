import { NextRequest, NextResponse } from "next/server"
import { FollowUpStatus, Prisma } from "@prisma/client"
import { requireAdmin } from "@/lib/auth/admin-guard"
import { prisma } from "@/lib/db/prisma"

export const dynamic = "force-dynamic"

type Params = { params: Promise<{ id: string }> }

/**
 * Marks a follow-up done / cancelled, or reschedules it.
 *
 * completedAt is maintained here rather than trusted from the client so the
 * record of when the work actually closed stays trustworthy.
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

  const data: Prisma.FollowUpUpdateInput = {}

  if (body.status !== undefined) {
    const status = String(body.status).toUpperCase() as FollowUpStatus
    if (!Object.values(FollowUpStatus).includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }
    data.status = status
    data.completedAt = status === "DONE" ? new Date() : null
  }

  if (body.followUpDate !== undefined) {
    const date = new Date(String(body.followUpDate))
    if (Number.isNaN(date.getTime())) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 })
    }
    data.followUpDate = date
  }

  for (const key of ["note", "nextAction"] as const) {
    if (body[key] !== undefined) {
      const value = body[key]
      const s = value === null ? "" : String(value).trim().slice(0, 2000)
      data[key] = s || null
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 })
  }

  try {
    const updated = await prisma.followUp.update({ where: { id }, data })
    return NextResponse.json(updated)
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return NextResponse.json({ error: "Follow-up not found" }, { status: 404 })
    }
    throw e
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const authError = await requireAdmin(req)
  if (authError) return authError

  const { id } = await params
  try {
    await prisma.followUp.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return NextResponse.json({ error: "Follow-up not found" }, { status: 404 })
    }
    throw e
  }
}
