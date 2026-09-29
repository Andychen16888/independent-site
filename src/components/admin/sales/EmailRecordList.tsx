"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { bi } from "@/components/admin/bilingual"
import { EMAIL_STATUS } from "@/lib/sales/status-meta"
import { ListToolbar, Loading, Pager, SelectFilter } from "./toolbar"
import { EmptyNote, ErrorNote, Ref, StatusPill } from "./ui"

const PAGE_SIZE = 20

interface EmailRow {
  id: string
  emailNo: string
  subject: string | null
  direction: string
  purpose: string
  status: string
  receiver: string | null
  sender: string | null
  errorMessage: string | null
  createdAt: string
  inquiry: { id: string; inquiryNo: string; customerName: string | null; companyName: string | null } | null
  quotation: { quotationNo: string; status: string } | null
}

const DIRECTIONS = [
  { value: "", label: bi("All Directions", "全部方向") },
  { value: "OUTBOUND", label: bi("Outbound", "发出") },
  { value: "INTERNAL", label: bi("Internal", "内部") },
]

const PURPOSES = [
  { value: "", label: bi("All Purposes", "全部类型") },
  { value: "QUOTATION", label: "Quotation" },
  { value: "FOLLOW_UP", label: "Follow-up" },
  { value: "GENERAL", label: "General" },
  { value: "NOTIFICATION", label: "Notification" },
]

export function EmailRecordList() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  const [rows, setRows] = useState<EmailRow[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const searchParam = params.get("search") ?? ""
  const [searchInput, setSearchInput] = useState(searchParam)
  const page = Math.max(1, Number(params.get("page")) || 1)
  const status = params.get("status") ?? ""
  const direction = params.get("direction") ?? ""
  const purpose = params.get("purpose") ?? ""

  useEffect(() => setSearchInput(searchParam), [searchParam])

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const qs = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) })
      if (searchParam) qs.set("search", searchParam)
      if (status) qs.set("status", status)
      if (direction) qs.set("direction", direction)
      if (purpose) qs.set("purpose", purpose)
      const res = await fetch(`/api/admin/emails?${qs}`, { cache: "no-store" })
      if (!res.ok) throw new Error(`Failed to load email records (${res.status})`)
      const data = await res.json()
      setRows(data.items ?? [])
      setTotal(data.pagination?.total ?? 0)
      setTotalPages(data.pagination?.totalPages ?? 1)
      setStatusCounts(data.statusCounts ?? {})
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load email records")
    } finally {
      setLoading(false)
    }
  }, [page, searchParam, status, direction, purpose])

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

  return (
    <div>
      <div className="mb-6">
        <h1 className="heading-md">{bi("Email Records", "邮件记录")}</h1>
        <p className="mt-1 text-sm text-stone">
          {bi(
            "Every message the system sent or logged, newest first.",
            "系统发送或记录的所有邮件，最新在前。"
          )}
        </p>
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
            ...Object.entries(EMAIL_STATUS).map(([value, meta]) => ({
              value,
              label: `${bi(meta.label, meta.labelZh)} (${statusCounts[value] ?? 0})`,
            })),
          ]}
        />
        <SelectFilter
          value={direction}
          onChange={(v) => setFilter("direction", v)}
          options={DIRECTIONS}
        />
        <SelectFilter value={purpose} onChange={(v) => setFilter("purpose", v)} options={PURPOSES} />
      </ListToolbar>

      <ErrorNote>{error}</ErrorNote>

      {loading ? (
        <Loading label={bi("Loading email records...", "正在加载邮件记录...")} />
      ) : rows.length === 0 ? (
        <EmptyNote>
          {searchParam || status || direction || purpose
            ? bi("No emails match this filter.", "没有符合筛选条件的邮件。")
            : bi("No emails logged yet.", "暂无邮件记录。")}
        </EmptyNote>
      ) : (
        <div className="overflow-x-auto border border-mist bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-mist text-left">
                {[
                  bi("Ref", "编号"),
                  bi("Subject", "主题"),
                  bi("Counterparty", "往来方"),
                  bi("Type", "类型"),
                  bi("Status", "状态"),
                  bi("Date", "时间"),
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-[10px] font-medium uppercase tracking-wider text-stone"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((m) => (
                <tr key={m.id} className="border-b border-mist/50 align-top transition-colors hover:bg-ivory/40">
                  <td className="whitespace-nowrap px-4 py-3">
                    <Ref>{m.emailNo}</Ref>
                  </td>
                  <td className="px-4 py-3">
                    <div className="max-w-[320px] truncate font-medium">{m.subject || "—"}</div>
                    {m.errorMessage && (
                      <div className="mt-0.5 max-w-[320px] truncate text-xs text-rosegold">
                        {m.errorMessage}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <div className="break-all">{m.direction === "OUTBOUND" ? m.receiver : m.sender}</div>
                    {m.inquiry && (
                      <Link
                        href={`/admin/inquiries/${m.inquiry.id}`}
                        className="text-stone hover:underline"
                      >
                        {m.inquiry.inquiryNo}
                      </Link>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-stone">
                    {m.direction} · {m.purpose}
                    {m.quotation && (
                      <div className="mt-0.5">{m.quotation.quotationNo}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill meta={EMAIL_STATUS[m.status]} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-stone">
                    {new Date(m.createdAt).toLocaleString("en-GB", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
