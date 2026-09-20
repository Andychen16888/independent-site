"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { HiOutlineArrowPath } from "react-icons/hi2"
import { bi } from "@/components/admin/bilingual"

export function MonitoringRefresh({ intervalSeconds = 30 }: { intervalSeconds?: number }) {
  const router = useRouter()
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [spinning, setSpinning] = useState(false)

  function refresh() {
    setSpinning(true)
    router.refresh()
    setLastRefresh(new Date())
    setTimeout(() => setSpinning(false), 600)
  }

  useEffect(() => {
    const timer = setInterval(refresh, intervalSeconds * 1000)
    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intervalSeconds])

  return (
    <div className="flex items-center gap-3">
      {lastRefresh && (
        <span className="text-xs text-stone">
          {bi("Updated", "更新时间")} {lastRefresh.toLocaleTimeString("en-US", { hour12: false })}
        </span>
      )}
      <button
        onClick={refresh}
        className="flex items-center gap-2 border border-mist bg-white px-3 py-2 text-sm text-charcoal hover:border-sage hover:text-sage transition-colors"
        aria-label={bi("Refresh monitoring data", "刷新监控数据")}
      >
        <HiOutlineArrowPath className={`w-4 h-4 ${spinning ? "animate-spin" : ""}`} />
        {bi("Refresh", "刷新")}
      </button>
    </div>
  )
}
