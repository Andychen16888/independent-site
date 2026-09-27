import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth/admin-guard"
import { prisma } from "@/lib/db/prisma"
import { resumeStalledCampaigns } from "@/lib/newsletter/campaign-runner"

export const dynamic = "force-dynamic"

/** Campaign history, newest first. */
export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req)
  if (authError) return authError

  // A campaign left SENDING by a deploy or restart is picked up here, on the
  // first poll after the process came back.
  await resumeStalledCampaigns().catch(() => undefined)

  const campaigns = await prisma.newsletterCampaign.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      subject: true,
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
      /*
       * Counted from the recipient rows rather than derived from the campaign
       * totals: a recipient skipped because they unsubscribed mid-run is
       * neither sent nor failed, so arithmetic on the counters would report it
       * as still pending forever.
       */
      _count: { select: { recipients: { where: { status: "PENDING" } } } },
    },
  })

  return NextResponse.json({
    campaigns: campaigns.map((c) => ({
      ...c,
      pendingCount: c._count.recipients,
      skippedCount: Math.max(
        c.totalCount - c.sentCount - c.failedCount - c._count.recipients,
        0
      ),
    })),
  })
}
