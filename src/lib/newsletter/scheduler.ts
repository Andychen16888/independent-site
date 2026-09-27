import { resumeStalledCampaigns } from "@/lib/newsletter/campaign-runner"

/** How often to look for a campaign that has become due. */
const TICK_MS = 60_000

/*
 * Next.js re-evaluates route modules on every request in development, so a bare
 * module-level flag would install a new interval on each one. Hanging the marker
 * off globalThis makes the timer survive module re-evaluation, which is also how
 * it should behave in a long-lived production process.
 */
const GLOBAL_KEY = "__newsletterSchedulerStarted"

export function ensureScheduler(): void {
  const g = globalThis as unknown as Record<string, unknown>
  if (g[GLOBAL_KEY]) return
  g[GLOBAL_KEY] = true

  /*
   * First tick is immediate so a campaign left mid-flight by the restart that
   * just brought this process up resumes without waiting out the interval.
   */
  const tick = () => {
    resumeStalledCampaigns().catch((e) =>
      console.error("[newsletter] scheduler tick failed:", e)
    )
  }

  tick()
  const timer = setInterval(tick, TICK_MS)

  // Do not hold the event loop open on shutdown.
  if (typeof timer.unref === "function") timer.unref()
}
