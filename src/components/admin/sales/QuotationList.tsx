"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { bi } from "@/components/admin/bilingual"
import { QUOTATION_STATUS, formatMoney } from "@/lib/sales/status-meta"
import { ListToolbar, Loading, Pager, SelectFilter } from "./toolbar"
import { EmptyNote, ErrorNote, Ref, StatusPill } from "./ui"

const PAGE_SIZE = 20

interface QuotationRow {
  id: string
  quotationNo: string
  status: string
  currency: string
  totalAmount: number
  validUntil: string
  sentAt: string | null
  acceptedAt: string | null
  createdAt: string
  inquiry: { id: string; inquiryNo: string; customerName: string | null; companyName: string | null; country: string | null }
  _count: { items: number }
}

export function QuotationList() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  const [rows, setRows] = useState<QuotationRow[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const searchParam = params.get("search") ?? ""
  const [searchInput, setSearchInput] = useState(searchParam)
  const page = Math.max(1, Number(params.get("page")) || 1)
  const status = params.get("status") ?? ""

  useEffect(() => setSearchInput(searchParam), [searchParam])

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const qs = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) })
      if (searchParam) qs.set("search", searchParam)
      if (status) qs.set("status", status)
      const res = await fetch(`/api/admin/quotations?${qs}`, { cache: "no-store" })
      if (!res.ok) throw new Error(`Failed to load quotations (${res.status})`)
      const data = await res.json()
      setRows(data.items ?? [])
      setTotal(data.pagination?.total ?? 0)
      setTotalPages(data.pagination?.totalPages ?? 1)
      setStatusCounts(data.statusCounts ?? {})
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load quotations")
    } finally {
      setLoading(false)
    }
  }, [page, searchParam, status])

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
        <h1 className="heading-md">{bi("Quotations", "报价单")}</h1>
        <p className="mt-1 text-sm text-stone">
          {bi(`${total} quotation${total === 1 ? "" : "s"}`, `共 ${total} 份报价单`)}
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
            ...Object.entries(QUOTATION_STATUS).map(([value, meta]) => ({
              value,
              label: `${bi(meta.label, meta.labelZh)} (${statusCounts[value] ?? 0})`,
            })),
          ]}
        />
      </ListToolbar>

      <ErrorNote>{error}</ErrorNote>

      {loading ? (
        <Loading label={bi("Loading quotations...", "正在加载报价单...")} />
      ) : rows.length === 0 ? (
        <EmptyNote>
          {searchParam || status
            ? bi("No quotations match this filter.", "没有符合筛选条件的报价单。")
            : bi(
                "No quotations yet. Open an enquiry to create one.",
                "暂无报价单。请打开询盘以创建报价单。"
              )}
        </EmptyNote>
      ) : (
        <div className="overflow-x-auto border border-mist bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-mist text-left">
                {[
                  bi("Ref", "编号"),
                  bi("Customer", "客户"),
                  bi("Lines", "行数"),
                  bi("Total", "金额"),
                  bi("Status", "状态"),
                  bi("Created", "创建时间"),
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
              {rows.map((q) => (
                <tr key={q.id} className="border-b border-mist/50 transition-colors hover:bg-ivory/40">
                  <td className="px-4 py-3 align-top">
                    <Link href={`/admin/quotations/${q.id}`} className="hover:underline">
                      <Ref>{q.quotationNo}</Ref>
                    </Link>
                    <div className="mt-0.5 text-[10px] text-stone">
                      {bi("valid until", "有效期至")}{" "}
                      {new Date(q.validUntil).toLocaleDateString("en-GB")}
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="font-medium">
                      {q.inquiry.companyName || q.inquiry.customerName || "—"}
                    </div>
                    <Link
                      href={`/admin/inquiries/${q.inquiry.id}`}
                      className="text-xs text-stone hover:underline"
                    >
                      {q.inquiry.inquiryNo}
                    </Link>
                  </td>
                  <td className="px-4 py-3 align-top tabular-nums">{q._count.items}</td>
                  <td className="whitespace-nowrap px-4 py-3 align-top font-medium">
                    {formatMoney(q.totalAmount, q.currency)}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <StatusPill meta={QUOTATION_STATUS[q.status as keyof typeof QUOTATION_STATUS]} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 align-top text-xs text-stone">
                    {new Date(q.createdAt).toLocaleString("en-GB", {
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
