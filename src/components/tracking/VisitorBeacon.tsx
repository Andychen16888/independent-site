"use client"

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import { v4 as uuidv4 } from "uuid"

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
        const data = {
          visitorId: visitorId.current,
          path: pathname,
          url,
          title: document.title,
          referrer: document.referrer,
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