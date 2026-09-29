"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { toast } from "react-hot-toast"
import { bi } from "@/components/admin/bilingual"
import { FOLLOW_UP_STATUS, INQUIRY_STATUS } from "@/lib/sales/status-meta"
import { ListToolbar, Loading, Pager, SelectFilter } from "./toolbar"
import { EmptyNote, ErrorNote, StatusPill, btnGhost } from "./ui"

const PAGE_SIZE = 20

interface FollowUpRow {
  id: string
  followUpDate: string
  note: string | null
  nextAction: string | null
  status: string
  completedAt: string | null
  inquiry: {
    id: string
    inquiryNo: string
    customerName: string | null
    companyName: string | null
    status: string
  }
}

function todayOffset(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`
}

export function FollowUpBoard() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  const [rows, setRows] = useState<FollowUpRow[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [overdue, setOverdue] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  const searchParam = params.get("search") ?? ""
  const [searchInput, setSearchInput] = useState(searchParam)
  const page = Math.max(1, Number(params.get("page")) || 1)
  const status = params.get("status") ?? ""
  const due = params.get("due") ?? "1"

  useEffect(() => setSearchInput(searchParam), [searchParam])

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const qs = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) })
      if (searchParam) qs.set("search", searchParam)
      if (status) qs.set("status", status)
      if (due) qs.set("due", due)
      const res = await fetch(`/api/admin/follow-ups?${qs}`, { cache: "no-store" })
      if (!res.ok) throw new Error(`Failed to load follow-ups (${res.status})`)
      const data = await res.json()
      setRows(data.items ?? [])
      setTotal(data.pagination?.total ?? 0)
      setTotalPages(data.pagination?.totalPages ?? 1)
      setOverdue(data.overdueCount ?? 0)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load follow-ups")
    } finally {
      setLoading(false)
    }
  }, [page, searchParam, status, due])

  useEffect(() => {
    load()
  }, [load])

  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString())
    if (value) next.set(key, value)
    else next.delete(key)
    // Changing a filter returns to page 1, but paging must not delete the page
    // it just set.
    if (key !== "page") next.delete("page")
    const qs = next.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }

  const patch = async (id: string, body: Record<string, unknown>, message: string) => {
    setBusy(true)
    try {
      const res = await fetch(`/api/admin/follow-ups/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || `Failed (${res.status})`)
      toast.success(message)
      load()
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="heading-md">{bi("Follow-ups", "跟进")}</h1>
          <p className="mt-1 text-sm text-stone">
            {due === "1"
              ? bi(
                  "Pending and due today or earlier.",
                  "待跟进且已到期（含今日）。"
                )
              : bi("All scheduled follow-ups.", "全部已安排的跟进。")}
            {overdue > 0 && (
              <span className="ml-2 rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] uppercase tracking-wider text-rose-200">
                {overdue} {bi("overdue", "逾期")}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter("due", due === "1" ? "" : "1")}
            className={btnGhost}
          >
            {due === "1" ? bi("Show all", "显示全部") : bi("Show due only", "仅看到期")}
          </button>
        </div>
      </div>

      <ListToolbar
        search={searchInput}
        onSearch={setSearchInput}
        onSubmitSearch={() => setFilter("search", searchInput.trim())}
      >
        <SelectFilter
          value={status}
          onChange={(v) => setFilter("status", v)}
          options={[
            { value: "", label: bi("All Statuses", "全部状态") },
            ...Object.entries(FOLLOW_UP_STATUS).map(([value, meta]) => ({
              value,
              label: bi(meta.label, meta.labelZh),
            })),
          ]}
        />
      </ListToolbar>

      <ErrorNote>{error}</ErrorNote>

      {loading ? (
        <Loading label={bi("Loading follow-ups...", "正在加载跟进...")} />
      ) : rows.length === 0 ? (
        <EmptyNote>
          {bi(
            "Nothing to follow up. Either everything is done, or the due filter is hiding future work.",
            "暂无待跟进事项。可能是全部已完成，或“仅看到期”筛选隐藏了未来的跟进。"
          )}
        </EmptyNote>
      ) : (
        <ul className="space-y-2">
          {rows.map((f) => {
            const late =
              f.status === "PENDING" && new Date(f.followUpDate).getTime() < Date.now()
            return (
              <li
                key={f.id}
                className="flex flex-wrap items-center gap-3 border border-mist bg-white px-4 py-3"
              >
                <span className="w-24 shrink-0 text-sm tabular-nums">
                  {new Date(f.followUpDate).toLocaleDateString("en-GB")}
                </span>
                {late && (
                  <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] uppercase tracking-wider text-rose-200">
                    {bi("Overdue", "逾期")}
                  </span>
                )}
                <StatusPill meta={FOLLOW_UP_STATUS[f.status as keyof typeof FOLLOW_UP_STATUS]} />
                <div className="min-w-[200px] flex-1">
                  <Link
                    href={`/admin/inquiries/${f.inquiry.id}`}
                    className="text-sm font-medium hover:underline"
                  >
                    {f.inquiry.companyName || f.inquiry.customerName || "—"}
                  </Link>
                  <div className="text-xs text-stone">
                    {f.inquiry.inquiryNo} ·{" "}
                    <StatusPill
                      meta={INQUIRY_STATUS[f.inquiry.status as keyof typeof INQUIRY_STATUS]}
                      className="align-middle"
                    />
                  </div>
                </div>
                <div className="min-w-0 flex-2 text-sm">
                  {f.nextAction && <div className="font-medium">{f.nextAction}</div>}
                  {f.note && <div className="text-xs text-stone">{f.note}</div>}
                </div>
                {f.status === "PENDING" && (
                  <div className="flex gap-2">
                    <button
                      className={btnGhost}
                      disabled={busy}
                      onClick={() => patch(f.id, { status: "DONE" }, bi("Marked done", "已标记完成"))}
                    >
                      {bi("Done", "完成")}
                    </button>
                    <button
                      className={btnGhost}
                      disabled={busy}
                      onClick={() =>
                        patch(
                          f.id,
                          { followUpDate: todayOffset(7) },
                          bi("Rescheduled a week", "已顺延一周")
                        )
                      }
                    >
                      +7d
                    </button>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}

      <Pager
        page={page}
        totalPages={totalPages}
        total={total}
        pageSize={PAGE_SIZE}
        onPage={(p) => setFilter("page", String(p))}
      />
    </div>
  )
}
