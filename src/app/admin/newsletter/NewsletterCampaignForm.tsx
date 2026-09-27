"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import toast from "react-hot-toast"
import { bi } from "@/components/admin/bilingual"

const INPUT_CLS =
  "w-full border border-mist px-4 py-3 text-sm bg-white focus:border-charcoal focus:outline-none"

/** Poll cadence while a campaign drains. */
const POLL_MS = 2000

const DELAY_CHOICES = [
  { value: 1000, label: "1s" },
  { value: 2000, label: "2s" },
  { value: 3000, label: "3s" },
  { value: 5000, label: "5s" },
  { value: 10000, label: "10s" },
  { value: 30000, label: "30s" },
]

type Campaign = {
  id: string
  subject: string
  status: "SENDING" | "COMPLETED" | "STOPPED" | "FAILED"
  delayMs: number
  totalCount: number
  sentCount: number
  failedCount: number
  pendingCount: number
  stopRequested: boolean
  error: string | null
}

type FailedRow = { id: string; email: string; error: string | null }

export function NewsletterCampaignForm({
  subject,
  body,
  onSubjectChange,
  onBodyChange,
  activeCount,
  adminEmail,
}: {
  subject: string
  body: string
  onSubjectChange: (value: string) => void
  onBodyChange: (value: string) => void
  activeCount: number
  adminEmail?: string
}) {
  const [delayMs, setDelayMs] = useState(2000)

  const [busy, setBusy] = useState(false)
  const [stopping, setStopping] = useState(false)
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [failed, setFailed] = useState<FailedRow[]>([])

  // Keeps the poller from stacking overlapping requests against a slow relay.
  const inFlight = useRef(false)

  const running = campaign?.status === "SENDING"

  const poll = useCallback(
    async (id: string) => {
      if (inFlight.current) return
      inFlight.current = true
      try {
        const res = await fetch(`/api/admin/newsletter/campaigns/${id}`, { cache: "no-store" })
        if (!res.ok) return
        const data = await res.json()
        setCampaign(data.campaign as Campaign)
        setFailed((data.failed as FailedRow[]) ?? [])
      } catch {
        // Transient network hiccup; the next tick picks it up.
      } finally {
        inFlight.current = false
      }
    },
    []
  )

  useEffect(() => {
    if (!campaign || campaign.status !== "SENDING") return
    const timer = setInterval(() => {
      void poll(campaign.id)
    }, POLL_MS)
    return () => clearInterval(timer)
  }, [campaign, poll])

  const validate = (): boolean => {
    if (!subject.trim()) {
      toast.error(bi("Subject is required", "请填写邮件主题"))
      return false
    }
    if (!body.trim()) {
      toast.error(bi("Body is required", "请填写邮件正文"))
      return false
    }
    return true
  }

  async function post(payload: Record<string, unknown>, url = "/api/admin/newsletter/send") {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject: subject.trim(), body: body.trim(), ...payload }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || bi("Request failed", "请求失败"))
    return data
  }

  async function sendTest() {
    if (!validate() || busy) return
    setBusy(true)
    try {
      const data = await post({ test: true })
      toast.success(
        data.to
          ? bi(`Test email sent to ${data.to}`, `测试邮件已发送至 ${data.to}`)
          : bi("Test email sent", "测试邮件已发送")
      )
    } catch (e) {
      toast.error(e instanceof Error ? e.message : bi("Failed to send test email", "测试邮件发送失败"))
    } finally {
      setBusy(false)
    }
  }

  async function startCampaign() {
    if (!validate() || busy) return
    if (activeCount === 0) {
      toast.error(bi("There are no active subscribers", "暂无有效订阅用户"))
      return
    }

    const seconds = Math.round(delayMs / 1000)
    const minutes = Math.max(Math.round((activeCount * delayMs) / 60000), 1)
    const confirmed = window.confirm(
      bi(
        `Send to ${activeCount} active subscribers, one at a time with ${seconds}s between each? Roughly ${minutes} min. You can stop it at any time.`,
        `将以串行方式发送给 ${activeCount} 位有效订阅用户，每封间隔 ${seconds} 秒，预计约 ${minutes} 分钟。发送过程中可随时停止。`
      )
    )
    if (!confirmed) return

    setBusy(true)
    setFailed([])
    try {
      const data = await post({ delayMs })
      setCampaign({
        id: data.campaignId,
        subject: subject.trim(),
        status: "SENDING",
        delayMs: data.delayMs,
        totalCount: data.total,
        sentCount: 0,
        failedCount: 0,
        pendingCount: data.total,
        stopRequested: false,
        error: null,
      })
      toast.success(bi("Campaign started", "群发任务已启动"))
    } catch (e) {
      toast.error(e instanceof Error ? e.message : bi("Failed to start campaign", "启动群发失败"))
    } finally {
      setBusy(false)
    }
  }

  async function stopCampaign() {
    if (!campaign) return
    setStopping(true)
    try {
      await post({}, `/api/admin/newsletter/campaigns/${campaign.id}/stop`)
      toast.success(
        bi("Stopping after the current message", "将在当前这封发送完毕后停止")
      )
      void poll(campaign.id)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : bi("Failed to stop", "停止失败"))
    } finally {
      setStopping(false)
    }
  }

  const done = (campaign?.sentCount ?? 0) + (campaign?.failedCount ?? 0)
  const percent =
    campaign && campaign.totalCount > 0
      ? Math.round((done / campaign.totalCount) * 100)
      : 0

  return (
    <div className="bg-white border border-mist p-8 space-y-6">
      <div>
        <h2 className="font-serif text-lg mb-1">{bi("Send a Campaign", "发送邮件")}</h2>
        <p className="text-[11px] text-stone">
          {bi(
            "Plain text only. Line breaks are preserved and the unsubscribe link is added automatically. Delivery is serial: one message at a time, on the server, so closing this page does not interrupt the run.",
            "仅支持纯文本。换行会保留，退订链接会自动附加。发送为服务端串行执行：每次一封，关闭本页面也不会中断。"
          )}
        </p>
      </div>

      <div>
        <label className="block text-[11px] uppercase tracking-wider text-stone mb-2">
          {bi("Subject", "主题")}
        </label>
        <input
          value={subject}
          onChange={(e) => onSubjectChange(e.target.value)}
          maxLength={200}
          placeholder={bi("e.g. March price list — PVC and carbon black", "例如：3月报价单 — PVC 与 炭黑")}
          className={INPUT_CLS}
        />
      </div>

      <div>
        <label className="block text-[11px] uppercase tracking-wider text-stone mb-2">
          {bi("Body", "正文")}
        </label>
        <textarea
          value={body}
          onChange={(e) => onBodyChange(e.target.value)}
          maxLength={20000}
          rows={10}
          placeholder={bi("Write your message here...", "在此输入邮件内容...")}
          className={INPUT_CLS}
        />
        <div className="text-[11px] text-stone mt-1 text-right">{body.length} / 20000</div>
      </div>

      <div className="border border-mist p-4 flex flex-wrap items-center gap-4">
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-stone mb-2">
            {bi("Interval between emails", "每封邮件间隔")}
          </label>
          <div className="flex gap-1">
            {DELAY_CHOICES.map((c) => (
              <button
                key={c.value}
                type="button"
                disabled={running}
                onClick={() => setDelayMs(c.value)}
                className={
                  delayMs === c.value
                    ? "px-3 py-2 bg-charcoal text-white text-xs transition-colors"
                    : "px-3 py-2 border border-mist text-stone text-xs transition-colors hover:border-charcoal disabled:opacity-50"
                }
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
        <p className="text-[11px] text-stone flex-1 min-w-[240px]">
          {bi(
            "Bursts of bulk mail from one IP are what get a sending domain throttled or blacklisted. A few seconds between messages is the cheapest protection; use a longer interval for large lists.",
            "同一 IP 短时间密集群发是导致发件域名被限流或拉黑的主要原因。每封间隔几秒是最廉价的防护手段；订阅量大时请用更长的间隔。"
          )}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={sendTest}
          disabled={busy || running}
          className="inline-flex items-center justify-center px-6 py-3 border border-charcoal text-charcoal text-xs tracking-widest uppercase transition-colors hover:bg-charcoal hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {bi("Send Test", "发送测试")}
        </button>
        <button
          type="button"
          onClick={startCampaign}
          disabled={busy || running || activeCount === 0}
          className="inline-flex items-center justify-center px-6 py-3 bg-charcoal text-white text-xs tracking-widest uppercase transition-colors hover:bg-charcoal/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {running
            ? bi("Sending...", "发送中...")
            : bi(`Send to ${activeCount} Subscribers`, `发送给 ${activeCount} 位订阅用户`)}
        </button>
        {adminEmail && (
          <span className="text-[11px] text-stone">
            {bi("Test goes to", "测试收件人")} {adminEmail}
          </span>
        )}
      </div>

      {activeCount === 0 && !running && (
        <p className="text-[11px] text-stone">
          {bi("No active subscribers to send to.", "暂无有效订阅用户可发送。")}
        </p>
      )}

      {campaign && (
        <div className="border border-mist p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-[11px] uppercase tracking-wider text-stone">
              {running
                ? bi("Sending serially", "串行发送中")
                : bi("Last run", "上次发送")}
            </span>
            {running ? (
              <button
                type="button"
                onClick={stopCampaign}
                disabled={stopping || campaign.stopRequested}
                className="px-4 py-2 border border-charcoal text-charcoal text-[11px] tracking-widest uppercase transition-colors hover:bg-charcoal hover:text-white disabled:opacity-50"
              >
                {campaign.stopRequested
                  ? bi("Stopping...", "正在停止...")
                  : bi("Stop", "停止")}
              </button>
            ) : null}
          </div>

          <div className="h-1 w-full bg-mist">
            <div
              className="h-1 bg-charcoal transition-all duration-300"
              style={{ width: `${percent}%` }}
            />
          </div>

          <div className="flex flex-wrap gap-4 text-[11px] text-stone">
            <span>
              {bi("Delivered", "已发送")} {campaign.sentCount}
            </span>
            <span>
              {bi("Failed", "失败")} {campaign.failedCount}
            </span>
            <span>
              {bi("Remaining", "待发送")} {Math.max(campaign.totalCount - done, 0)}
            </span>
            <span>
              {bi("Interval", "间隔")} {Math.round(campaign.delayMs / 1000)}s
            </span>
          </div>

          {campaign.status === "STOPPED" && (
            <p className="text-[11px] text-stone">
              {bi(
                "Stopped. The remaining recipients were not contacted; you can resume this run from the history below.",
                "已停止。未发送的收件人未被联系，可在下方历史记录中继续发送。"
              )}
            </p>
          )}
          {campaign.status === "FAILED" && campaign.error && (
            <p className="text-[11px] text-stone break-all">
              {bi("Run error", "任务异常")} {campaign.error}
            </p>
          )}
        </div>
      )}

      {failed.length > 0 && (
        <div className="border border-stone/30 p-4 space-y-2">
          <div className="text-[11px] uppercase tracking-wider text-stone">
            {bi("Failed recipients", "失败收件人")} ({failed.length})
          </div>
          <ul className="space-y-1 max-h-40 overflow-y-auto">
            {failed.map((f) => (
              <li key={f.id} className="text-[11px] text-stone break-all">
                {f.email} — {f.error}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
