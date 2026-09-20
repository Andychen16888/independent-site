"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { bi } from "@/components/admin/bilingual"

type HealthStatus = "ok" | "warning" | "critical"

interface MetricsSummary {
  status: HealthStatus
  cpu: { percent: number; status: HealthStatus }
  memory: { percent: number; status: HealthStatus }
  storage: { percent: number; status: HealthStatus }
  process: { percent: number; status: HealthStatus }
}

const DOT_COLOR: Record<HealthStatus, string> = {
  ok: "bg-sage",
  warning: "bg-gold",
  critical: "bg-rosegold",
}

const TEXT_COLOR: Record<HealthStatus, string> = {
  ok: "text-sage",
  warning: "text-gold",
  critical: "text-rosegold",
}

const STATUS_LABEL: Record<HealthStatus, string> = {
  ok: "运行正常",
  warning: "负载偏高",
  critical: "需要关注",
}

export function SystemStatusWidget() {
  const [data, setData] = useState<MetricsSummary | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let active = true
    const controller = new AbortController()

    async function load() {
      try {
        const res = await fetch("/api/admin/monitoring", { cache: "no-store", signal: controller.signal })
        if (!res.ok) throw new Error("unavailable")
        const json = await res.json()
        if (active) {
          setData(json)
          setError(false)
        }
      } catch (e) {
        if (active && (e as Error).name !== "AbortError") setError(true)
      }
    }

    load()
    const timer = setInterval(load, 15000)
    return () => {
      active = false
      controller.abort()
      clearInterval(timer)
    }
  }, [])

  if (error) {
    return (
      <div className="px-2 py-3 text-xs text-stone">
        System Monitoring <span className="opacity-60">系统监控</span>
        <p className="mt-1 text-rosegold">监控不可用 / Unavailable</p>
      </div>
    )
  }

  const status = data?.status ?? "ok"

  return (
    <Link
      href="/admin/monitoring"
      className="block px-2 py-3 rounded transition-colors hover:bg-white/5"
      title={bi("Open system monitoring", "打开系统监控")}
    >
      <span className="flex items-center justify-between text-xs">
        <span className="text-[10px] tracking-widest uppercase text-stone">
          {bi("System", "系统状态")}
        </span>
        <span className={`flex items-center gap-1.5 text-[10px] font-medium ${TEXT_COLOR[status]}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${DOT_COLOR[status]} ${status === "ok" ? "animate-pulse" : ""}`} />
          {STATUS_LABEL[status]}
        </span>
      </span>
    </Link>
  )
}
