import { prisma } from "@/lib/db/prisma"
import { sendNewsletterEmail } from "@/lib/email/resend"
import { buildUnsubscribeUrl, generateUnsubscribeToken } from "@/lib/newsletter/token"
import { MAX_DELAY_MS } from "@/lib/newsletter/constants"

/** How many recipients to claim per database round-trip. */
const CHUNK = 25

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Campaign id currently being drained by this process.
 *
 * The runner is deliberately a module-level singleton rather than a queue: the
 * app runs as a long-lived PM2 process, so one in-memory loop is enough, and it
 * doubles as the lock that stops two campaigns from interleaving their
 * deliveries. A second start request for an already-running campaign is a no-op.
 */
let activeCampaignId: string | null = null

export function getActiveCampaignId(): string | null {
  return activeCampaignId
}

/**
 * Start of the current calendar day in server-local time.
 *
 * Counting deliveries from here is what makes a daily quota self-healing: a run
 * interrupted by a restart picks the count back up from the delivery timestamps
 * already in the table rather than from any in-memory total, so a quota is
 * never accidentally doubled by resuming.
 */
function startOfToday(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

/** Next local midnight, used as the resume time for a quota-exhausted run. */
function nextMidnight(): Date {
  const d = startOfToday()
  d.setDate(d.getDate() + 1)
  return d
}

/**
 * Atomically move a campaign into SENDING, returning false if somebody else
 * got there first.
 *
 * The in-memory lock above is enough for the current single-process PM2 setup,
 * but this makes the claim correct at the database level too, so scaling out or
 * a stray second process cannot produce two loops draining the same campaign.
 */
async function claimForSending(id: string): Promise<boolean> {
  const claimed = await prisma.newsletterCampaign.updateMany({
    where: { id, status: { in: ["PAUSED", "SENDING"] } },
    data: { status: "SENDING", nextRunAt: null },
  })
  return claimed.count > 0
}

/**
 * Stand a campaign down until tomorrow without calling it finished.
 *
 * Deliberately releases the process lock instead of sleeping until midnight: a
 * multi-hour timer would pin the event loop, and the resume would die with the
 * next deploy anyway. The scheduler picks the campaign back up.
 */
async function pauseUntilTomorrow(campaignId: string): Promise<void> {
  await prisma.newsletterCampaign
    .update({
      where: { id: campaignId },
      data: { status: "PAUSED", nextRunAt: nextMidnight() },
    })
    .catch((e) => console.error(`[newsletter] could not pause ${campaignId}:`, e))
}

/**
 * Drive one campaign to completion, strictly one message at a time.
 *
 * Delivery is serial on purpose. Batching the sends makes a provider see a burst
 * of near-simultaneous connections from one IP, which is the pattern that gets a
 * sending domain throttled or blacklisted, and it is also the behaviour that
 * bulk-mail rules target. The pause between messages is configurable per campaign
 * for the same reason.
 *
 * Not awaited by callers: the HTTP request returns as soon as the campaign row
 * exists and the dashboard polls for progress instead.
 */
export async function runCampaign(campaignId: string): Promise<void> {
  if (activeCampaignId) {
    // A campaign is already draining. Leave it alone; the poller will pick this
    // one up once the running one finishes.
    return
  }
  activeCampaignId = campaignId

  try {
    const campaign = await prisma.newsletterCampaign.findUnique({
      where: { id: campaignId },
      select: { subject: true, body: true, delayMs: true, dailyQuota: true },
    })
    if (!campaign) return

    const delay = Math.min(Math.max(campaign.delayMs, 0), MAX_DELAY_MS)
    const quota = campaign.dailyQuota

    /*
     * Deliveries already made today, read back from the table rather than
     * carried in memory, so a resumed or restarted run cannot overshoot the
     * quota by starting the count from zero.
     */
    const countSentToday = () =>
      prisma.newsletterSend.count({
        where: { campaignId, status: "SENT", sentAt: { gte: startOfToday() } },
      })

    let sentToday = quota ? await countSentToday() : 0
    let countedForDay = startOfToday().getTime()

    /*
     * At-least-once delivery. A crash between the SMTP handoff and the row
     * update leaves the recipient PENDING, so a resumed run can send that
     * message a second time. Preferring a duplicate over a silent gap is the
     * right trade for marketing mail; a strict exactly-once guarantee would need
     * an idempotency key at the receiving side, which SMTP does not offer.
     */
    for (;;) {
      const stop = await prisma.newsletterCampaign.findUnique({
        where: { id: campaignId },
        select: { stopRequested: true },
      })
      if (stop?.stopRequested) {
        await finish(campaignId, "STOPPED")
        return
      }

      /*
       * A run that is still going when the date rolls over must not carry
       * yesterday's total into today, or the new day would start with the quota
       * already partly spent. Recount once the day changes.
       */
      if (quota > 0) {
        const currentDay = startOfToday().getTime()
        if (currentDay !== countedForDay) {
          sentToday = await countSentToday()
          countedForDay = currentDay
        }
      }

      // Daily ceiling reached: stand down until tomorrow rather than pushing on.
      if (quota > 0 && sentToday >= quota) {
        await pauseUntilTomorrow(campaignId)
        return
      }

      const chunk = await prisma.newsletterSend.findMany({
        where: { campaignId, status: "PENDING" },
        orderBy: { createdAt: "asc" },
        take: CHUNK,
        select: { id: true, email: true },
      })
      if (chunk.length === 0) {
        await finish(campaignId, "COMPLETED")
        return
      }

      for (let i = 0; i < chunk.length; i++) {
        // Re-checked per message so a stop requested mid-chunk takes effect
        // within one delivery rather than after the whole chunk.
        const stillRunning = await prisma.newsletterCampaign.findUnique({
          where: { id: campaignId },
          select: { stopRequested: true },
        })
        if (stillRunning?.stopRequested) break

        // Re-checked per message so the quota is honoured exactly, not up to a
        // chunk boundary.
        if (quota > 0 && sentToday >= quota) {
          await pauseUntilTomorrow(campaignId)
          return
        }

        const delivered = await deliver(
          campaignId,
          campaign.subject,
          campaign.body,
          chunk[i].id,
          chunk[i].email
        )
        // Only real deliveries count against the quota. A skip or a failure did
        // not reach a mailbox, so it must not eat into tomorrow's allowance.
        if (delivered) sentToday += 1

        /*
         * Pace between messages but not after the last one. A short chunk means
         * the table is drained, a full chunk means there may be more, which
         * avoids a per-message COUNT just to decide whether to sleep.
         */
        const moreToCome = i < chunk.length - 1 || chunk.length === CHUNK
        if (moreToCome && delay > 0) await sleep(delay)
      }
    }
  } catch (error) {
    console.error(`[newsletter] campaign ${campaignId} crashed:`, error)
    await prisma.newsletterCampaign
      .update({
        where: { id: campaignId },
        data: {
          status: "FAILED",
          error: error instanceof Error ? error.message : String(error),
          completedAt: new Date(),
        },
      })
      .catch(() => undefined)
  } finally {
    activeCampaignId = null
    /*
     * Chain any campaign that was created while this one held the lock, so a
     * queue drains without an admin having to keep the dashboard open.
     */
    void resumeStalledCampaigns().catch(() => undefined)
  }
}

/** Fire-and-forget start. Safe to call repeatedly for the same campaign. */
export function startCampaign(campaignId: string): void {
  if (activeCampaignId === campaignId) return
  void runCampaign(campaignId)
}

async function deliver(
  campaignId: string,
  subject: string,
  body: string,
  sendId: string,
  email: string
): Promise<boolean> {
  try {
    /*
     * Respect an opt-out that landed after the campaign was created but before
     * this message went out, and mark it skipped rather than failed so it does
     * not pollute the error list.
     */
    const subscriber = await prisma.newsletter.findUnique({
      where: { email },
      select: { isActive: true, unsubscribeToken: true },
    })
    if (!subscriber || !subscriber.isActive) {
      await prisma.newsletterSend.update({
        where: { id: sendId },
        data: { status: "SKIPPED", error: "Unsubscribed before delivery" },
      })
      return false
    }

    // Backfill tokens for subscribers created before the column existed.
    let token = subscriber.unsubscribeToken
    if (!token) {
      token = generateUnsubscribeToken()
      await prisma.newsletter.update({
        where: { email },
        data: { unsubscribeToken: token },
      })
    }

    await sendNewsletterEmail({
      to: email,
      subject,
      body,
      unsubscribeUrl: buildUnsubscribeUrl(token),
    })

    await prisma.$transaction([
      prisma.newsletterSend.update({
        where: { id: sendId },
        data: { status: "SENT", sentAt: new Date(), error: null },
      }),
      prisma.newsletterCampaign.update({
        where: { id: campaignId },
        data: { sentCount: { increment: 1 } },
      }),
    ])

    return true
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    /*
     * If this write fails the row is still PENDING, and the drain loop would
     * pick it up again on the next pass and retry the same address forever.
     * Letting the error escape fails the whole campaign instead, which is
     * recoverable via resume; a livelock is not.
     */
    await prisma.$transaction([
      prisma.newsletterSend.update({
        where: { id: sendId },
        data: { status: "FAILED", error: message.slice(0, 500) },
      }),
      prisma.newsletterCampaign.update({
        where: { id: campaignId },
        data: { failedCount: { increment: 1 } },
      }),
    ])

    // Nothing reached a mailbox, so this does not count against the quota.
    return false
  }
}

async function finish(campaignId: string, status: "COMPLETED" | "STOPPED"): Promise<void> {
  await prisma.newsletterCampaign
    .update({
      where: { id: campaignId },
      data: { status, completedAt: new Date() },
    })
    .catch((e) => console.error(`[newsletter] could not finalise ${campaignId}:`, e))
}

/**
 * Start the oldest campaign that has work to do.
 *
 * Covers two cases: a run interrupted by a process restart (deploy, OOM, manual
 * `pm2 restart`), and a run that paused itself at its daily quota and is now due
 * again. Called from the status endpoint the dashboard already polls and from
 * the in-process scheduler, so a daily batch resumes with or without anyone
 * watching the dashboard.
 */
export async function resumeStalledCampaigns(): Promise<void> {
  if (activeCampaignId) return

  const now = new Date()

  const due = await prisma.newsletterCampaign.findMany({
    where: {
      stopRequested: false,
      status: { in: ["SENDING", "PAUSED"] },
      // A paused campaign is only eligible once its resume time has passed.
      OR: [{ nextRunAt: null }, { nextRunAt: { lte: now } }],
    },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      _count: { select: { recipients: { where: { status: "PENDING" } } } },
    },
  })

  for (const campaign of due) {
    if (campaign._count.recipients === 0) {
      await prisma.newsletterCampaign.update({
        where: { id: campaign.id },
        data: { status: "COMPLETED", completedAt: new Date(), nextRunAt: null },
      })
      continue
    }

    // Compare-and-set so a second process cannot start a duplicate loop.
    if (!(await claimForSending(campaign.id))) continue

    void runCampaign(campaign.id)
    // One at a time: the runner holds the in-process lock, and the rest are
    // picked up oldest-first on the next tick.
    return
  }
}
