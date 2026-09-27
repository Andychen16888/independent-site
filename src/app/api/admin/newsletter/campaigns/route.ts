import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth/admin-guard"
import { prisma } from "@/lib/db/prisma"
import { resumeStalledCampaigns } from "@/lib/newsletter/campaign-runner"
import { ensureScheduler } from "@/lib/newsletter/scheduler"

export const dynamic = "force-dynamic"

/** Campaign history, newest first. */
export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req)
  if (authError) return authError

  /*
   * Starts the background ticker on first use, then checks for due work. The
   * ticker is what resumes a daily-quota campaign at midnight without anyone
   * having the dashboard open.
   */
  ensureScheduler()
  await resumeStalledCampaigns().catch(() => undefined)

  const now = new Date()
  const startOfToday = new Date(now)
  startOfToday.setHours(0, 0, 0, 0)

  const campaigns = await prisma.newsletterCampaign.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      subject: true,
      status: true,
      delayMs: true,
      dailyQuota: true,
      nextRunAt: true,
      totalCount: true,
      sentCount: true,
      failedCount: true,
      stopRequested: true,
      error: true,
      startedAt: true,
      completedAt: true,
      createdAt: true,
      /*
       * Counted from the recipient rows rather than derived from the campaign
       * totals: a recipient skipped because they unsubscribed mid-run is
       * neither sent nor failed, so arithmetic on the counters would report it
       * as still pending forever.
       */
      _count: { select: { recipients: { where: { status: "PENDING" } } } },
    },
  })

  /*
   * Today's deliveries for every listed campaign in one grouped query. Done as a
   * second pass because it is an aggregate over the recipient table and cannot be
   * expressed alongside the per-campaign pending count in a single select.
   */
  const todayByCampaign = new Map<string, number>()
  if (campaigns.length > 0) {
    const grouped = await prisma.newsletterSend.groupBy({
      by: ["campaignId"],
      where: {
        status: "SENT",
        sentAt: { gte: startOfToday },
        campaignId: { in: campaigns.map((c) => c.id) },
      },
      _count: { _all: true },
    })
    for (const row of grouped) {
      todayByCampaign.set(row.campaignId, row._count._all)
    }
  }

  return NextResponse.json({
    campaigns: campaigns.map((c) => ({
      ...c,
      sentToday: todayByCampaign.get(c.id) ?? 0,
      pendingCount: c._count.recipients,
      skippedCount: Math.max(
        c.totalCount - c.sentCount - c.failedCount - c._count.recipients,
        0
      ),
    })),
  })
}
