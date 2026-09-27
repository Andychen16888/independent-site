import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth/admin-guard"
import { prisma } from "@/lib/db/prisma"
import { startCampaign } from "@/lib/newsletter/campaign-runner"

export const dynamic = "force-dynamic"

/**
 * Resume a stopped campaign from where it left off.
 *
 * Stopping leaves delivered messages as SENT and the remainder as PENDING, so
 * resuming picks up exactly the addresses that were never reached. This is also
 * the manual recovery path for a run that was interrupted by a deploy.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAdmin(req)
  if (authError) return authError

  const { id } = await params

  const campaign = await prisma.newsletterCampaign.findUnique({
    where: { id },
    select: { id: true, status: true, stopRequested: true },
  })

  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
  }

  if (campaign.status === "SENDING") {
    return NextResponse.json({ error: "Campaign is already running" }, { status: 400 })
  }

  const pending = await prisma.newsletterSend.count({
    where: { campaignId: id, status: "PENDING" },
  })
  if (pending === 0) {
    return NextResponse.json({ error: "Nothing left to send" }, { status: 400 })
  }

  const inFlight = await prisma.newsletterCampaign.findFirst({
    where: { status: "SENDING", id: { not: id } },
    select: { id: true },
  })
  if (inFlight) {
    return NextResponse.json(
      { error: "Another campaign is already sending" },
      { status: 409 }
    )
  }

  await prisma.newsletterCampaign.update({
    where: { id },
    data: { status: "SENDING", stopRequested: false, completedAt: null, error: null },
  })

  startCampaign(id)

  return NextResponse.json({ ok: true, pending })
}
