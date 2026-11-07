"use client"

import { useState } from "react"
import Link from "next/link"
import { toast } from "react-hot-toast"
import { bi } from "@/components/admin/bilingual"
import { FOLLOW_UP_STATUS } from "@/lib/sales/status-meta"
import { fetchJsonResponse, responseErrorMessage } from "@/lib/json-response"
import { EmptyNote, Panel, StatusPill, btnGhost, btnPrimary, inputCls } from "./ui"

export interface FollowUpRow {
  id: string
  followUpDate: string
  note: string | null
  nextAction: string | null
  status: string
  completedAt: string | null
}

const isOverdue = (f: FollowUpRow) =>
  f.status === "PENDING" && new Date(f.followUpDate).getTime() < Date.now()

/** YYYY-MM-DD in local time, which is what <input type="date"> expects. */
function todayOffset(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`
}

export function FollowUpList({
  inquiryId,
  followUps,
  onChanged,
}: {
  inquiryId: string
  followUps: FollowUpRow[]
  onChanged: () => void
}) {
  const [date, setDate] = useState(() => todayOffset(1))
  const [note, setNote] = useState("")
  const [nextAction, setNextAction] = useState("")
  const [busy, setBusy] = useState(false)

  const create = async () => {
    setBusy(true)
    try {
      const { res, parsed } = await fetchJsonResponse(`/api/admin/inquiries/${inquiryId}/follow-ups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followUpDate: date, note, nextAction }),
      })
      if (!parsed.ok) throw new Error(responseErrorMessage(parsed, `Failed (${res.status})`))
      setNote("")
      setNextAction("")
      toast.success(bi("Follow-up scheduled", "已安排跟进"))
      onChanged()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed")
    } finally {
      setBusy(false)
    }
  }

  const update = async (id: string, body: Record<string, unknown>, message: string) => {
    setBusy(true)
    try {
      const { res, parsed } = await fetchJsonResponse(`/api/admin/follow-ups/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!parsed.ok) throw new Error(responseErrorMessage(parsed, `Failed (${res.status})`))
      toast.success(message)
      onChanged()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed")
    } finally {
      setBusy(false)
    }
  }

  const remove = async (id: string) => {
    if (!confirm(bi("Delete this follow-up?", "删除此跟进记录？"))) return
    setBusy(true)
    try {
      const { res, parsed } = await fetchJsonResponse(`/api/admin/follow-ups/${id}`, { method: "DELETE" })
      if (!parsed.ok) {
        throw new Error(responseErrorMessage(parsed, `Failed (${res.status})`))
      }
      onChanged()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed")
    } finally {
      setBusy(false)
    }
  }

  const pending = followUps.filter((f) => f.status === "PENDING")

  return (
    <Panel
      title={`${bi("Follow-ups", "跟进")} (${pending.length})`}
      action={
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-2 py-1 text-xs border border-mist focus:border-charcoal focus:outline-none"
          />
          <input
            value={nextAction}
            onChange={(e) => setNextAction(e.target.value)}
            placeholder={bi("Next action", "下一步")}
            className="w-44 px-2 py-1 text-xs border border-mist focus:border-charcoal focus:outline-none"
          />
          <button className={btnPrimary} onClick={create} disabled={busy || !date}>
            {bi("Schedule", "安排")}
          </button>
        </div>
      }
    >
      <label className="mb-4 block">
        <span className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-stone">
          {bi("Note for the next entry", "下次跟进备注")}
        </span>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className={inputCls} />
      </label>

      {followUps.length === 0 ? (
        <EmptyNote>{bi("No follow-ups scheduled.", "暂无跟进安排。")}</EmptyNote>
      ) : (
        <ul className="divide-y divide-mist">
          {followUps.map((f) => (
            <li key={f.id} className="flex flex-wrap items-center gap-3 py-2 text-sm">
              <span className="tabular-nums text-xs">
                {new Date(f.followUpDate).toLocaleDateString("en-GB")}
              </span>
              {isOverdue(f) && (
                <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] uppercase tracking-wider text-rose-200">
                  {bi("Overdue", "逾期")}
                </span>
              )}
              <StatusPill meta={FOLLOW_UP_STATUS[f.status as keyof typeof FOLLOW_UP_STATUS]} />
              <span className="min-w-0 flex-1">
                {f.nextAction && <span className="font-medium">{f.nextAction}</span>}
                {f.note && <span className="ml-2 text-xs text-stone">{f.note}</span>}
              </span>
              {f.status === "PENDING" && (
                <>
                  <button
                    className={btnGhost}
                    disabled={busy}
                    onClick={() => update(f.id, { status: "DONE" }, bi("Marked done", "已标记完成"))}
                  >
                    {bi("Done", "完成")}
                  </button>
                  <button
                    className={btnGhost}
                    disabled={busy}
                    onClick={() =>
                      update(
                        f.id,
                        { followUpDate: todayOffset(7) },
                        bi("Rescheduled a week", "已顺延一周")
                      )
                    }
                  >
                    +7d
                  </button>
                </>
              )}
              <button className={btnGhost} disabled={busy} onClick={() => remove(f.id)}>
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-3 text-xs text-stone">
        <Link href="/admin/follow-ups" className="hover:underline">
          {bi("All follow-ups", "全部跟进")} →
        </Link>
      </p>
    </Panel>
  )
}
