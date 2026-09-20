"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

type HealthStatus = "ok" | "warning" | "critical"

interface MetricsSummary {
  status: HealthStatus
  cpu: { percent: number; status: HealthStatus }
  memory: { percent: number; status: HealthStatus }
  storage: { percent: number; status: HealthStatus }
  process: { percent: number; status: HealthStatus }
}

const BAR_COLOR: Record<HealthStatus, string> = {
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

function Gauge({ label, labelZh, percent, status }: { label: string; labelZh: string; percent: number; status: HealthStatus }) {
  return (
    <div>
      <div className="flex items-center justify-between text-[11px] leading-tight">
        <span className="text-stone">
          {label} <span className="opacity-60">{labelZh}</span>
        </span>
        <span className={`font-medium ${TEXT_COLOR[status]}`}>{percent}%</span>
      </div>
      <div className="mt-1 h-1.5 w-full bg-white/10 overflow-hidden rounded-sm">
        <div
          className={`h-full rounded-sm transition-all duration-500 ${BAR_COLOR[status]}`}
          style={{ width: `${Math.max(0, Math.min(percent, 100))}%` }}
        />
      </div>
    </div>
  )
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
      title="Open system monitoring"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] tracking-widest uppercase text-stone">
          System <span className="opacity-60">系统状态</span>
        </span>
        <span className={`flex items-center gap-1.5 text-[10px] font-medium ${TEXT_COLOR[status]}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${BAR_COLOR[status]} ${status === "ok" ? "animate-pulse" : ""}`} />
          {STATUS_LABEL[status]}
        </span>
      </div>

      {data ? (
        <div className="space-y-2">
          <Gauge label="CPU" labelZh="处理器" percent={data.cpu.percent} status={data.cpu.status} />
          <Gauge label="Memory" labelZh="内存" percent={data.memory.percent} status={data.memory.status} />
          <Gauge label="Storage" labelZh="存储" percent={data.storage.percent} status={data.storage.status} />
          <Gauge label="App" labelZh="应用" percent={data.process.percent} status={data.process.status} />
        </div>
      ) : (
        <div className="space-y-2" aria-hidden>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-4 bg-white/5 rounded-sm animate-pulse" />
          ))}
        </div>
      )}
    </Link>
  )
}
