"use client"

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import { v4 as uuidv4 } from "uuid"
import { detectClientDeviceType } from "@/lib/tracking/device"

const COOKIE_NAME = "visitor_id"
const DAYS = 365

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

function setVisitorCookie(value: string): void {
  const expires = new Date(Date.now() + DAYS * 24 * 60 * 60 * 1000)
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`
}

export function VisitorBeacon() {
  const pathname = usePathname()
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const visitorId = useRef<string | null>(null)

  useEffect(() => {
    let id = readCookie(COOKIE_NAME)
    if (!id) {
      id = uuidv4()
      setVisitorCookie(id)
    }
    visitorId.current = id

    const send = () => {
      if (pathname.startsWith("/api/") || pathname.startsWith("/_next")) return
      try {
        const url = window.location.href
        // 落地 URL 上的 UTM 参数是邮件/广告推广归因的关键，客户端直接读取上报，
        // 避免服务端从完整 URL 再解析时因缺列降级而丢失来源。
        const params = new URLSearchParams(window.location.search)
        const data = {
          visitorId: visitorId.current,
          path: pathname,
          url,
          title: document.title,
          referrer: document.referrer,
          utmSource: params.get("utm_source"),
          utmMedium: params.get("utm_medium"),
          utmCampaign: params.get("utm_campaign"),
          // 客户端识别设备类型（比 UA 更准，可识别 iPadOS 等平板）上报给 /api/track
          deviceType: detectClientDeviceType(),
        }
        if (navigator.sendBeacon) {
          navigator.sendBeacon("/api/track", new Blob([JSON.stringify(data)], { type: "application/json" }))
        } else {
          fetch("/api/track", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          }).catch(() => {})
        }
      } catch (error) {
        // 静默忽略上报错误
      }
    }

    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(send, 500)
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [pathname])

  return null
}