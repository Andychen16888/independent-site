import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth/admin-guard"
import { prisma } from "@/lib/db/prisma"
import { resumeStalledCampaigns } from "@/lib/newsletter/campaign-runner"

export const dynamic = "force-dynamic"

/**
 * Live progress for one campaign: the counts the dashboard polls, plus the
 * per-recipient log so a failed address can be inspected and retried.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAdmin(req)
  if (authError) return authError

  await resumeStalledCampaigns().catch(() => undefined)

  const { id } = await params

  const campaign = await prisma.newsletterCampaign.findUnique({
    where: { id },
    select: {
      id: true,
      subject: true,
      body: true,
      status: true,
      delayMs: true,
      totalCount: true,
      sentCount: true,
      failedCount: true,
      stopRequested: true,
      error: true,
      startedAt: true,
      completedAt: true,
      createdAt: true,
    },
  })

  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
  }

  const [failed, pending, skippedCount, lastRecipients] = await Promise.all([
    prisma.newsletterSend.findMany({
      where: { campaignId: id, status: "FAILED" },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: { id: true, email: true, error: true, createdAt: true },
    }),
    prisma.newsletterSend.count({ where: { campaignId: id, status: "PENDING" } }),
    prisma.newsletterSend.count({ where: { campaignId: id, status: "SKIPPED" } }),
    prisma.newsletterSend.findMany({
      where: { campaignId: id },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { id: true, email: true, status: true, sentAt: true },
    }),
  ])

  return NextResponse.json({
    campaign: {
      ...campaign,
      pendingCount: pending,
      skippedCount,
    },
    failed,
    lastRecipients,
  })
}
