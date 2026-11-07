"use client"

import { useCallback, useEffect, useState } from "react"
import toast from "react-hot-toast"
import { bi } from "@/components/admin/bilingual"
import { fetchJsonResponse, responseErrorMessage } from "@/lib/json-response"

type CampaignRow = {
  id: string
  subject: string
  status: "SENDING" | "PAUSED" | "COMPLETED" | "STOPPED" | "FAILED"
  delayMs: number
  dailyQuota: number
  nextRunAt: string | null
  totalCount: number
  sentCount: number
  failedCount: number
  pendingCount: number
  sentToday: number
  stopRequested: boolean
  startedAt: string
  completedAt: string | null
}

type FailedRow = { id: string; email: string; error: string | null }

const POLL_MS = 3000

const STATUS_STYLE: Record<CampaignRow["status"], string> = {
  SENDING: "border-charcoal text-charcoal",
  PAUSED: "border-blue-700 text-blue-700",
  COMPLETED: "border-emerald-700 text-emerald-700",
  STOPPED: "border-amber-700 text-amber-700",
  FAILED: "border-red-700 text-red-700",
}

const STATUS_LABEL: Record<CampaignRow["status"], [string, string]> = {
  SENDING: ["Sending", "发送中"],
  PAUSED: ["Paused", "已暂停"],
  COMPLETED: ["Completed", "已完成"],
  STOPPED: ["Stopped", "已停止"],
  FAILED: ["Failed", "异常"],
}

function formatWhen(iso: string | null): string {
  if (!iso) return "—"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

/** Send history: every campaign with its per-run outcome and recovery actions. */
export function NewsletterCampaignHistory({ refreshKey }: { refreshKey?: number }) {
  const [rows, setRows] = useState<CampaignRow[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)
  const [failed, setFailed] = useState<FailedRow[]>([])
  const [busyId, setBusyId] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  const load = useCallback(async () => {
    try {
      const { parsed, data } = await fetchJsonResponse<any>("/api/admin/newsletter/campaigns", { cache: "no-store" })
      if (!parsed.ok) return
      const payload = (data || {}) as any
      setRows(payload.campaigns ?? [])
      setLoaded(true)
    } catch {
      // Non-fatal.
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load, refreshKey])

  // Keep polling while something is in flight, and while a daily-quota campaign
  // is waiting for tomorrow so its automatic resume shows up without a reload.
  const anyRunning = rows.some(
    (r) => r.status === "SENDING" || r.status === "PAUSED"
  )
  useEffect(() => {
    if (!anyRunning) return
    const timer = setInterval(() => void load(), POLL_MS)
    return () => clearInterval(timer)
  }, [anyRunning, load])

  async function toggleDetail(id: string) {
    if (expanded === id) {
      setExpanded(null)
      setFailed([])
      return
    }
    setExpanded(id)
    setFailed([])
    try {
      const { parsed, data } = await fetchJsonResponse<any>(`/api/admin/newsletter/campaigns/${id}`, { cache: "no-store" })
      if (!parsed.ok) return
      const payload = (data || {}) as any
      setFailed(payload.failed ?? [])
    } catch {
      // Non-fatal.
    }
  }

  async function act(id: string, action: "stop" | "resume") {
    setBusyId(id)
    try {
      const { parsed } = await fetchJsonResponse(`/api/admin/newsletter/campaigns/${id}/${action}`, {
        method: "POST",
      })
      if (!parsed.ok) throw new Error(responseErrorMessage(parsed, bi("Request failed", "请求失败")))
      toast.success(
        action === "stop"
          ? bi("Stopping after the current message", "将在当前这封发送完毕后停止")
          : bi("Campaign resumed", "群发任务已继续")
      )
      await load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : bi("Request failed", "请求失败"))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="bg-white border border-mist p-8 space-y-4">
      <div>
        <h2 className="font-serif text-lg mb-1">{bi("Send History", "发送历史")}</h2>
        <p className="text-[11px] text-stone">
          {bi(
            "Every bulk run is recorded with its outcome per recipient. A stopped run can be resumed and will only contact the addresses it never reached.",
            "每次群发都会按收件人记录结果。被停止的任务可以继续，只会补发给尚未收到的地址。"
          )}
        </p>
      </div>

      {!loaded ? (
        <p className="text-[11px] text-stone">{bi("Loading...", "加载中...")}</p>
      ) : rows.length === 0 ? (
        <p className="text-[11px] text-stone">
          {bi("No campaigns have been sent yet.", "尚未发送过任何群发任务。")}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-mist text-[11px] uppercase tracking-wider text-stone">
                <th className="py-2 pr-3 font-normal">{bi("Subject", "主题")}</th>
                <th className="py-2 pr-3 font-normal">{bi("Status", "状态")}</th>
                <th className="py-2 pr-3 font-normal">{bi("Result", "结果")}</th>
                <th className="py-2 pr-3 font-normal">{bi("Started", "开始时间")}</th>
                <th className="py-2 pr-3 font-normal">{bi("Finished", "结束时间")}</th>
                <th className="py-2 font-normal"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const done = r.sentCount + r.failedCount
                const percent = r.totalCount > 0 ? Math.round((done / r.totalCount) * 100) : 0
                return (
                  <tr key={r.id} className="border-b border-mist/60 align-top">
                    <td className="py-3 pr-3 text-xs">
                      <div className="max-w-[280px]">
                        <div className="truncate">{r.subject}</div>
                        <div className="text-[10px] text-stone mt-0.5">
                          {bi("every", "间隔")} {Math.round(r.delayMs / 1000)}s
                          {r.dailyQuota > 0
                            ? ` · ${bi("max", "上限")} ${r.dailyQuota}${bi("/day", "/天")}`
                            : ""}
                        </div>
                      </div>
                      {r.status === "PAUSED" && r.nextRunAt && (
                        <div className="text-[10px] text-blue-700 mt-1">
                          {bi("Resumes", "下次")} {formatWhen(r.nextRunAt)}
                        </div>
                      )}
                    </td>
                    <td className="py-3 pr-3">
                      <span
                        className={`inline-block border px-2 py-1 text-[10px] uppercase tracking-wider ${STATUS_STYLE[r.status]}`}
                      >
                        {bi(...STATUS_LABEL[r.status])}
                      </span>
                    </td>
                    <td className="py-3 pr-3 text-xs whitespace-nowrap">
                      <div>
                        {r.sentCount} / {r.totalCount} ({percent}%)
                      </div>
                      {r.dailyQuota > 0 && (
                        <div className="text-[10px] text-stone mt-0.5">
                          {bi("today", "今日")} {r.sentToday} / {r.dailyQuota}
                        </div>
                      )}
                      {r.failedCount > 0 && (
                        <div className="text-[10px] text-red-700 mt-0.5">
                          {bi("failed", "失败")} {r.failedCount}
                        </div>
                      )}
                    </td>
                    <td className="py-3 pr-3 text-[11px] text-stone whitespace-nowrap">
                      {formatWhen(r.startedAt)}
                    </td>
                    <td className="py-3 pr-3 text-[11px] text-stone whitespace-nowrap">
                      {formatWhen(r.completedAt)}
                    </td>
                    <td className="py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        {r.status === "SENDING" && (
                          <button
                            type="button"
                            onClick={() => act(r.id, "stop")}
                            disabled={busyId === r.id || r.stopRequested}
                            className="px-3 py-1.5 border border-charcoal text-charcoal text-[10px] uppercase tracking-wider transition-colors hover:bg-charcoal hover:text-white disabled:opacity-50"
                          >
                            {r.stopRequested ? bi("Stopping", "停止中") : bi("Stop", "停止")}
                          </button>
                        )}
                        {r.status !== "SENDING" && r.pendingCount > 0 && (
                          <button
                            type="button"
                            onClick={() => act(r.id, "resume")}
                            disabled={busyId === r.id}
                            title={
                              r.status === "PAUSED"
                                ? bi(
                                    "Send the next batch now instead of waiting for tomorrow. Today's limit still applies.",
                                    "立即发送下一批而不必等到明天。今日上限仍然生效。"
                                  )
                                : undefined
                            }
                            className="px-3 py-1.5 border border-charcoal text-charcoal text-[10px] uppercase tracking-wider transition-colors hover:bg-charcoal hover:text-white disabled:opacity-50"
                          >
                            {r.status === "PAUSED"
                              ? bi("Send now", "立即发送")
                              : bi("Resume", "继续")}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => toggleDetail(r.id)}
                          className="px-3 py-1.5 border border-stone/40 text-stone text-[10px] uppercase tracking-wider transition-colors hover:border-charcoal"
                        >
                          {expanded === r.id ? bi("Hide", "收起") : bi("Detail", "详情")}
                        </button>
                      </div>

                      {expanded === r.id && (
                        <div className="mt-3 text-left border border-mist p-3 space-y-2">
                          {failed.length === 0 ? (
                            <p className="text-[10px] text-stone">
                              {bi("No failed recipients.", "没有失败的收件人。")}
                            </p>
                          ) : (
                            <>
                              <p className="text-[10px] uppercase tracking-wider text-stone">
                                {bi("Failed recipients", "失败收件人")} ({failed.length})
                              </p>
                              <ul className="space-y-1 max-h-40 overflow-y-auto">
                                {failed.map((f) => (
                                  <li key={f.id} className="text-[10px] text-stone break-all">
                                    {f.email} — {f.error}
                                  </li>
                                ))}
                              </ul>
                            </>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
