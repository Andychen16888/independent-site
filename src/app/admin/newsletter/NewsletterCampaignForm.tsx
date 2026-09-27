"use client"

import { useMemo, useState } from "react"
import toast from "react-hot-toast"
import { bi } from "@/components/admin/bilingual"

/** Mirrors the server ceiling; the dashboard slices the list into batches of this size. */
const BATCH_SIZE = 10

type Failure = { email: string; error: string }

const INPUT_CLS =
  "w-full border border-mist px-4 py-3 text-sm bg-white focus:border-charcoal focus:outline-none"

export function NewsletterCampaignForm({
  activeEmails,
  adminEmail,
}: {
  activeEmails: string[]
  adminEmail?: string
}) {
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [sending, setSending] = useState(false)
  const [sentCount, setSentCount] = useState(0)
  const [failures, setFailures] = useState<Failure[]>([])

  const total = activeEmails.length
  const percent = total > 0 ? Math.round((sentCount / total) * 100) : 0

  const batches = useMemo(() => {
    const out: string[][] = []
    for (let i = 0; i < activeEmails.length; i += BATCH_SIZE) {
      out.push(activeEmails.slice(i, i + BATCH_SIZE))
    }
    return out
  }, [activeEmails])

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

  async function post(payload: Record<string, unknown>) {
    const res = await fetch("/api/admin/newsletter/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject: subject.trim(), body: body.trim(), ...payload }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || bi("Request failed", "请求失败"))
    return data as { sent: number; failed: number; failures?: Failure[]; test?: boolean; to?: string }
  }

  async function sendTest() {
    if (!validate() || sending) return
    setSending(true)
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
      setSending(false)
    }
  }

  async function sendBulk() {
    if (!validate() || sending) return
    if (total === 0) {
      toast.error(bi("There are no active subscribers", "暂无有效订阅用户"))
      return
    }

    const confirmed = window.confirm(
      bi(
        `Send this campaign to ${total} active subscribers? This cannot be undone.`,
        `确定要向 ${total} 位有效订阅用户发送此邮件吗？发送后无法撤回。`
      )
    )
    if (!confirmed) return

    setSending(true)
    setSentCount(0)
    setFailures([])

    let sent = 0
    const allFailures: Failure[] = []

    try {
      /*
       * One request per batch instead of one long request for everyone: each
       * call returns quickly, so the send survives a slow SMTP relay without
       * tripping the request timeout, and the progress bar reflects real work.
       */
      for (const batch of batches) {
        const data = await post({ emails: batch })
        sent += data.sent
        if (data.failures?.length) allFailures.push(...data.failures)
        setSentCount(sent)
        setFailures([...allFailures])
      }

      if (allFailures.length === 0) {
        toast.success(bi(`Sent to ${sent} subscribers`, `已成功发送给 ${sent} 位订阅用户`))
      } else {
        toast.error(
          bi(
            `Sent to ${sent}, ${allFailures.length} failed`,
            `成功 ${sent} 封，失败 ${allFailures.length} 封`
          )
        )
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : bi("Campaign stopped", "发送中断"))
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="bg-white border border-mist p-8 space-y-6">
      <div>
        <h2 className="font-serif text-lg mb-1">{bi("Send a Campaign", "发送邮件")}</h2>
        <p className="text-[11px] text-stone">
          {bi(
            "Plain text only. Line breaks are preserved and the unsubscribe link is added automatically.",
            "仅支持纯文本。换行会保留，退订链接会自动附加。"
          )}
        </p>
      </div>

      <div>
        <label className="block text-[11px] uppercase tracking-wider text-stone mb-2">
          {bi("Subject", "主题")}
        </label>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          maxLength={200}
          placeholder={bi("e.g. March price list — PVC and carbon black", "例如：3月报价单 — PVC 与炭黑")}
          className={INPUT_CLS}
        />
      </div>

      <div>
        <label className="block text-[11px] uppercase tracking-wider text-stone mb-2">
          {bi("Body", "正文")}
        </label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={20000}
          rows={10}
          placeholder={bi("Write your message here...", "在此输入邮件内容...")}
          className={INPUT_CLS}
        />
        <div className="text-[11px] text-stone mt-1 text-right">{body.length} / 20000</div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={sendTest}
          disabled={sending}
          className="inline-flex items-center justify-center px-6 py-3 border border-charcoal text-charcoal text-xs tracking-widest uppercase transition-colors hover:bg-charcoal hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {bi("Send Test", "发送测试")}
        </button>
        <button
          type="button"
          onClick={sendBulk}
          disabled={sending || total === 0}
          className="inline-flex items-center justify-center px-6 py-3 bg-charcoal text-white text-xs tracking-widest uppercase transition-colors hover:bg-charcoal/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sending
            ? bi("Sending...", "发送中...")
            : bi(`Send to ${total} Subscribers`, `发送给 ${total} 位订阅用户`)}
        </button>
        {adminEmail && (
          <span className="text-[11px] text-stone">
            {bi("Test goes to", "测试收件人")} {adminEmail}
          </span>
        )}
      </div>

      {total === 0 && (
        <p className="text-[11px] text-stone">
          {bi("No active subscribers to send to.", "暂无有效订阅用户可发送。")}
        </p>
      )}

      {(sending || sentCount > 0) && total > 0 && (
        <div className="space-y-2 pt-2">
          <div className="h-1 w-full bg-mist">
            <div
              className="h-1 bg-charcoal transition-all duration-300"
              style={{ width: `${percent}%` }}
            />
          </div>
          <div className="text-[11px] text-stone">
            {sentCount} / {total} ({percent}%)
          </div>
        </div>
      )}

      {failures.length > 0 && (
        <div className="border border-stone/30 p-4 space-y-2">
          <div className="text-[11px] uppercase tracking-wider text-stone">
            {bi("Failed recipients", "失败收件人")} ({failures.length})
          </div>
          <ul className="space-y-1 max-h-40 overflow-y-auto">
            {failures.map((f) => (
              <li key={f.email} className="text-[11px] text-stone break-all">
                {f.email} — {f.error}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
