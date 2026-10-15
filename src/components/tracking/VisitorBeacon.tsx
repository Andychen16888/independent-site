"use client"

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { v4 as uuidv4 } from "uuid"
import { detectClientDeviceType } from "@/lib/tracking/device"
import { isTrackablePath } from "@/lib/tracking/beacon"
import { createVisitScheduler } from "@/lib/tracking/visit-scheduler"

const COOKIE_NAME = "visitor_id"
const DAYS = 365
// 上报前的小延迟：等 document.title 稳定。注意这里不再"取消"上一个页面，
// 而是由 visit-scheduler 先冲刷再调度，因此快速跳转不会丢页（见 visit-scheduler.ts）。
const FLUSH_DELAY_MS = 500
// 同一路径 1 秒内重复触发只发一次，规避严格模式 / 重复渲染造成的重复上报。
const MIN_REPEAT_MS = 1000

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

function setVisitorCookie(value: string): void {
  const expires = new Date(Date.now() + DAYS * 24 * 60 * 60 * 1000)
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`
}

function ensureVisitorId(): string {
  let id = readCookie(COOKIE_NAME)
  if (!id) {
    id = uuidv4()
    setVisitorCookie(id)
  }
  return id
}

export function VisitorBeacon() {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const visitorId = useRef<string | null>(null)
  const schedulerRef = useRef<ReturnType<typeof createVisitScheduler> | null>(null)

  // 服务端已验证的管理员会在会话上带 analyticsExcluded 标记（见 lib/auth/auth.ts）。
  // 前端据此跳过上报只是「减少无用请求」，最终排除以服务端 /api/track 为准。
  const analyticsExcluded = session?.user?.analyticsExcluded === true

  useEffect(() => {
    if (status === "loading") return
    if (analyticsExcluded) {
      schedulerRef.current?.reset()
      schedulerRef.current = null
      return
    }
    if (schedulerRef.current) return

    const scheduler = createVisitScheduler({
      delayMs: FLUSH_DELAY_MS,
      minRepeatMs: MIN_REPEAT_MS,
      now: () => Date.now(),
      setTimeout: (fn, ms) => window.setTimeout(fn, ms),
      clearTimeout: (id) => window.clearTimeout(id as number),
      emit: (payload) => {
        try {
          if (navigator.sendBeacon) {
            navigator.sendBeacon(
              "/api/track",
              new Blob([JSON.stringify(payload)], { type: "application/json" })
            )
          } else {
            fetch("/api/track", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
              keepalive: true,
            }).catch(() => {})
          }
        } catch {
          // 静默忽略上报错误，绝不影响用户浏览。
        }
      },
    })
    schedulerRef.current = scheduler

    const flushOnUnload = () => scheduler.flush()
    const flushOnHidden = () => {
      if (document.visibilityState === "hidden") scheduler.flush()
    }
    window.addEventListener("pagehide", flushOnUnload)
    document.addEventListener("visibilitychange", flushOnHidden)

    return () => {
      window.removeEventListener("pagehide", flushOnUnload)
      document.removeEventListener("visibilitychange", flushOnHidden)
      scheduler.flush()
    }
  }, [status, analyticsExcluded])

  // 路由变化：记录一次页面访问。首次挂载也会触发一次（首页）。
  useEffect(() => {
    if (status === "loading" || analyticsExcluded) return
    if (!isTrackablePath(pathname)) return
    const scheduler = schedulerRef.current
    if (!scheduler) return

    if (!visitorId.current) visitorId.current = ensureVisitorId()

    scheduler.visit({
      path: pathname,
      build: () => {
        // 落地 URL 上的 UTM 参数是邮件/广告推广归因的关键，客户端直接读取上报，
        // 避免服务端从完整 URL 再解析时因缺列降级而丢失来源。
        const params = new URLSearchParams(window.location.search)
        return {
          visitorId: visitorId.current,
          path: pathname,
          url: window.location.href,
          title: document.title,
          referrer: document.referrer,
          utmSource: params.get("utm_source"),
          utmMedium: params.get("utm_medium"),
          utmCampaign: params.get("utm_campaign"),
          // 客户端识别设备类型（比 UA 更准，可识别 iPadOS 等平板）上报给 /api/track
          deviceType: detectClientDeviceType(),
        }
      },
    })
  }, [pathname, status, analyticsExcluded])

  return null
}
