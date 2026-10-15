/**
 * Unit checks for the tracking modules: admin exclusion, subjects, session
 * splitting and the no-drop visit scheduler. No database and no browser needed,
 * so these run in CI.
 *
 *   npx tsx scripts/test-tracking.ts   (or: npm run test:tracking)
 */

import { ADMIN_TRACKING_EMAIL, isAdminTrackingEmail, normalizeEmail } from "@/lib/tracking/identity"
import {
  classifyTrackingSubject,
  shouldWriteVisitEvent,
  shouldWriteVisitorAggregates,
} from "@/lib/tracking/policy"
import { SESSION_IDLE_MS, shouldStartNewSession, sessionGroupKey } from "@/lib/tracking/session"
import { isTrackablePath } from "@/lib/tracking/beacon"
import { isDatacenterIp } from "@/lib/tracking/datacenter-ip"
import { createVisitScheduler } from "@/lib/tracking/visit-scheduler"

let passed = 0
let failed = 0

function check(name: string, condition: boolean, detail?: unknown) {
  if (condition) {
    passed++
    console.log(`  PASS  ${name}`)
  } else {
    failed++
    console.log(`  FAIL  ${name}${detail !== undefined ? ` -> ${JSON.stringify(detail)}` : ""}`)
  }
}

function createFakeTimers() {
  let current = 0
  let nextId = 1
  const timers = new Map<number, { at: number; fn: () => void }>()
  return {
    now: () => current,
    setTimeout: (fn: () => void, ms: number) => {
      const id = nextId++
      timers.set(id, { at: current + ms, fn })
      return id
    },
    clearTimeout: (id: unknown) => {
      timers.delete(id as number)
    },
    advanceBy: (ms: number) => {
      current += ms
      for (const [id, t] of [...timers]) {
        if (t.at <= current) {
          timers.delete(id)
          t.fn()
        }
      }
    },
  }
}

console.log("admin identity")
check("admin email is excluded", isAdminTrackingEmail(ADMIN_TRACKING_EMAIL))
check("admin email is trimmed + case-insensitive", isAdminTrackingEmail(`  ${ADMIN_TRACKING_EMAIL.toUpperCase()}  `))
check("another email is not the admin", !isAdminTrackingEmail("owner@example.com"))
check("empty / null is not the admin", !isAdminTrackingEmail("") && !isAdminTrackingEmail(null) && !isAdminTrackingEmail(undefined))
check("normalizeEmail trims and lowercases", normalizeEmail("  A@B.COM ") === "a@b.com")

console.log("\ntracking subject + write policy")
check("admin wins over bot", classifyTrackingSubject({ email: ADMIN_TRACKING_EMAIL, isBot: true }) === "admin")
check("bot classified as bot", classifyTrackingSubject({ email: null, isBot: true }) === "bot")
check("normal visitor", classifyTrackingSubject({ email: null, isBot: false }) === "visitor")
check("logged-in non-admin is a visitor", classifyTrackingSubject({ email: "user@example.com", isBot: false }) === "visitor")
check("admin writes no visit event", !shouldWriteVisitEvent("admin"))
check("bot still writes a visit event (for diagnosis)", shouldWriteVisitEvent("bot"))
check("visitor writes a visit event", shouldWriteVisitEvent("visitor"))
check("admin writes no aggregates", !shouldWriteVisitorAggregates("admin"))
check("bot writes no aggregates", !shouldWriteVisitorAggregates("bot"))
check("visitor writes aggregates", shouldWriteVisitorAggregates("visitor"))

console.log("\nsession splitting")
check("no prior activity starts a new session", shouldStartNewSession(null, Date.now()))
check("29 min gap stays in the same session", !shouldStartNewSession(0, SESSION_IDLE_MS - 60_000))
check("exactly 30 min starts a new session", shouldStartNewSession(0, SESSION_IDLE_MS))
check("2 h gap starts a new session", shouldStartNewSession(0, 2 * 60 * 60 * 1000))
check("invalid last activity starts a new session", shouldStartNewSession(new Date("invalid"), Date.now()))
check("session key uses sessionId when present", sessionGroupKey("v1", "s1") === "s:v1:s1")
check("session key falls back to legacy when missing", sessionGroupKey("v1", null) === "legacy:v1")
check("session key falls back to legacy when empty", sessionGroupKey("v1", "") === "legacy:v1")

console.log("\ntrackable path")
check("/api/ is not tracked", !isTrackablePath("/api/track"))
check("/_next is not tracked", !isTrackablePath("/_next/static/chunk.js"))
check("home is tracked", isTrackablePath("/"))
check("product page is tracked", isTrackablePath("/products/widget"))
check("null path is not tracked", !isTrackablePath(null))

console.log("\ndatacenter / crawler IPs")
check("Meta IPv6 (observed 2a03:2880:*) is datacenter", isDatacenterIp("2a03:2880::1"))
check("Meta IPv6 /40 is datacenter", isDatacenterIp("2620:0:1c00::5"))
check("Meta IPv4 is datacenter", isDatacenterIp("157.240.10.5"))
check("AWS IPv4 (observed 16.145.79.163) is datacenter", isDatacenterIp("16.145.79.163"))
check("AWS 3.0.0.0/8 is datacenter", isDatacenterIp("3.5.1.1"))
check("AWS 52.0.0.0/8 is datacenter", isDatacenterIp("52.94.1.1"))
check("GCP 34.0.0.0/8 is datacenter", isDatacenterIp("34.64.1.1"))
check("Azure 20.0.0.0/8 is datacenter", isDatacenterIp("20.42.10.176"))
check("DigitalOcean 159.65.0.0/16 is datacenter", isDatacenterIp("159.65.1.1"))
check("Hetzner 5.9.0.0/16 is datacenter", isDatacenterIp("5.9.1.1"))
check("IPv4-mapped IPv6 is classified as IPv4", isDatacenterIp("::ffff:16.145.79.163"))
check("AWS IPv6 is datacenter", isDatacenterIp("2600:1f00::1"))
check("public DNS (8.8.8.8) is not datacenter", !isDatacenterIp("8.8.8.8"))
check("Google public DNS IPv6 is not datacenter", !isDatacenterIp("2001:4860:4860::8888"))
check("China residential-looking IP is not datacenter", !isDatacenterIp("114.114.114.114"))
check("loopback is not datacenter", !isDatacenterIp("127.0.0.1"))
check("private 10/8 is not datacenter", !isDatacenterIp("10.0.0.5"))
check("unknown sentinel is not datacenter", !isDatacenterIp("unknown"))
check("null / empty is not datacenter", !isDatacenterIp(null) && !isDatacenterIp(""))
check("invalid IPv4 is not datacenter", !isDatacenterIp("999.1.1.1"))
check("garbage string is not datacenter", !isDatacenterIp("not-an-ip"))

console.log("\nvisit scheduler: no-drop")
{
  const timers = createFakeTimers()
  const emitted: string[] = []
  const scheduler = createVisitScheduler({
    emit: (payload) => emitted.push(payload.path as string),
    delayMs: 500,
    minRepeatMs: 1000,
    now: timers.now,
    setTimeout: timers.setTimeout,
    clearTimeout: timers.clearTimeout,
  })
  scheduler.visit({ path: "/a", build: () => ({ path: "/a" }) })
  // Jumping away before the 500ms delay must not drop /a (old clearTimeout bug).
  scheduler.visit({ path: "/b", build: () => ({ path: "/b" }) })
  check("previous page flushed on quick navigation", emitted.join(",") === "/a", emitted)
  timers.advanceBy(500)
  check("new page emitted after delay", emitted.join(",") === "/a,/b", emitted)
}

console.log("\nvisit scheduler: dedupe + flush")
{
  const timers = createFakeTimers()
  const emitted: string[] = []
  const scheduler = createVisitScheduler({
    emit: (payload) => emitted.push(payload.path as string),
    delayMs: 500,
    minRepeatMs: 1000,
    now: timers.now,
    setTimeout: timers.setTimeout,
    clearTimeout: timers.clearTimeout,
  })
  scheduler.visit({ path: "/x", build: () => ({ path: "/x" }) })
  timers.advanceBy(500)
  scheduler.visit({ path: "/x", build: () => ({ path: "/x" }) })
  timers.advanceBy(400)
  check("same path within repeat window is deduped", emitted.length === 1, emitted)
  check("pendingPath reflects the queued visit", scheduler.pendingPath() === "/x", scheduler.pendingPath())
  scheduler.flush()
  check("flush clears the pending page", scheduler.pendingPath() === null)
}
{
  const timers = createFakeTimers()
  const emitted: string[] = []
  const scheduler = createVisitScheduler({
    emit: (payload) => emitted.push(payload.path as string),
    delayMs: 500,
    minRepeatMs: 0,
    now: timers.now,
    setTimeout: timers.setTimeout,
    clearTimeout: timers.clearTimeout,
  })
  scheduler.visit({ path: "/keep", build: () => ({ path: "/keep" }) })
  scheduler.reset()
  timers.advanceBy(500)
  check("reset drops the pending page", emitted.length === 0, emitted)
}

console.log("\napi/track policy simulation")
{
  const decide = (email: string | null, isBot: boolean) => {
    const subject = classifyTrackingSubject({ email, isBot })
    return {
      excluded: subject === "admin",
      visitEvent: shouldWriteVisitEvent(subject),
      aggregates: shouldWriteVisitorAggregates(subject),
    }
  }
  const admin = decide(ADMIN_TRACKING_EMAIL, false)
  check("admin request excluded entirely", admin.excluded && !admin.visitEvent && !admin.aggregates, admin)
  const bot = decide(null, true)
  check("bot request writes only a visit event", !bot.excluded && bot.visitEvent && !bot.aggregates, bot)
  const visitor = decide(null, false)
  check("visitor request writes everything", !visitor.excluded && visitor.visitEvent && visitor.aggregates, visitor)
}

console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
