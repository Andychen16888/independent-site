import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth/admin-guard"
import { prisma } from "@/lib/db/prisma"

export const dynamic = "force-dynamic"

/**
 * Cooperative stop. The runner checks the flag between deliveries, so the run
 * halts within one message rather than being killed mid-send. Anything already
 * delivered stays delivered; the rest stay PENDING for a later resume.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAdmin(req)
  if (authError) return authError

  const { id } = await params

  const campaign = await prisma.newsletterCampaign.findUnique({
    where: { id },
    select: { id: true, status: true },
  })

  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
  }
  if (campaign.status !== "SENDING") {
    return NextResponse.json({ error: "Campaign is not running" }, { status: 400 })
  }

  await prisma.newsletterCampaign.update({
    where: { id },
    data: { stopRequested: true },
  })

  return NextResponse.json({ ok: true })
}
