"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { bi } from "@/components/admin/bilingual"
import {
  INQUIRY_SOURCES,
  INQUIRY_STATUS,
  INQUIRY_STAGES,
  formatMoney,
  formatQuantity,
} from "@/lib/sales/status-meta"
import { ListToolbar, Loading, Pager, SelectFilter } from "./toolbar"
import { EmptyNote, ErrorNote, Ref, StatusPill } from "./ui"

const PAGE_SIZE = 20

interface InquiryRow {
  id: string
  inquiryNo: string
  customerName: string | null
  companyName: string | null
  country: string | null
  email: string | null
  productName: string | null
  quantity: number | null
  unit: string | null
  currency: string | null
  targetPrice: number | null
  status: string
  source: string
  createdAt: string
  assignedUser: { displayName: string } | null
  _count: { quotations: number; emailRecords: number; followUps: number }
}

/**
 * Enquiry list.
 *
 * The status filter is driven by the stage segment in the path
 * (/admin/inquiries/new, /admin/quotations, ...) as well as a query parameter, so
 * the sidebar links and the in-page dropdown stay in agreement: both write the
 * filter, and both highlight off the same source of truth.
 */
export function InquiryList({ lockedStatus }: { lockedStatus?: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  const [rows, setRows] = useState<InquiryRow[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const searchParam = params.get("search") ?? ""
  const [searchInput, setSearchInput] = useState(searchParam)
  const page = Math.max(1, Number(params.get("page")) || 1)
  const statusParam = params.get("status") ?? ""
  const status = lockedStatus ?? statusParam

  useEffect(() => setSearchInput(searchParam), [searchParam])

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const qs = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) })
      if (searchParam) qs.set("search", searchParam)
      if (status) qs.set("status", status)
      const res = await fetch(`/api/admin/inquiries?${qs}`, { cache: "no-store" })
      if (!res.ok) throw new Error(`Failed to load enquiries (${res.status})`)
      const data = await res.json()
      setRows(data.items ?? [])
      setTotal(data.pagination?.total ?? 0)
      setTotalPages(data.pagination?.totalPages ?? 1)
      setStatusCounts(data.statusCounts ?? {})
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load enquiries")
    } finally {
      setLoading(false)
    }
  }, [page, searchParam, status])

  useEffect(() => {
    load()
  }, [load])

  /** Writes a filter into the URL, resetting to page 1 so the view is never empty by accident. */
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

  const stage = INQUIRY_STAGES.find((s) => s.status === status)

  return (
    <div>
      <div className="mb-6">
        <h1 className="heading-md">
          {stage ? bi(stage.label, stage.labelZh) : bi("Inquiries", "询盘")}
        </h1>
        <p className="mt-1 text-sm text-stone">
          {bi(
            `${total} matching ${total === 1 ? "enquiry" : "enquiries"}`,
            `匹配 ${total} 条询盘`
          )}
        </p>
      </div>

      <ListToolbar
        search={searchInput}
        onSearch={setSearchInput}
        onSubmitSearch={() => setFilter("search", searchInput.trim())}
        right={
          searchParam || status ? (
            <button
              onClick={() => {
                setSearchInput("")
                router.push(pathname)
              }}
              className="text-xs text-stone hover:text-charcoal"
            >
              {bi("Reset", "重置")}
            </button>
          ) : null
        }
      >
        {!lockedStatus && (
          <SelectFilter
            value={status}
            onChange={(v) => setFilter("status", v)}
            options={[
              { value: "", label: bi("All Statuses", "全部状态") },
              ...Object.entries(INQUIRY_STATUS).map(([value, meta]) => ({
                value,
                label: `${bi(meta.label, meta.labelZh)} (${statusCounts[value] ?? 0})`,
              })),
            ]}
          />
        )}
        {lockedStatus && (
          <span className="text-xs text-stone">
            {bi("Filtered by sidebar stage", "已按侧边栏阶段筛选")}
          </span>
        )}
      </ListToolbar>

      <ErrorNote>{error}</ErrorNote>

      {loading ? (
        <Loading label={bi("Loading enquiries...", "正在加载询盘...")} />
      ) : rows.length === 0 ? (
        <EmptyNote>
          {searchParam || status
            ? bi("No enquiries match this filter.", "没有符合筛选条件的询盘。")
            : bi("No enquiries yet.", "暂无询盘。")}
        </EmptyNote>
      ) : (
        <div className="overflow-x-auto border border-mist bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-mist text-left">
                <Th>{bi("Ref", "编号")}</Th>
                <Th>{bi("Customer", "客户")}</Th>
                <Th>{bi("Product", "产品")}</Th>
                <Th>{bi("Requirement", "需求")}</Th>
                <Th>{bi("Source", "来源")}</Th>
                <Th>{bi("Status", "状态")}</Th>
                <Th>{bi("Received", "接收时间")}</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-mist/50 transition-colors hover:bg-ivory/40">
                  <Td>
                    <Link href={`/admin/inquiries/${r.id}`} className="hover:underline">
                      <Ref>{r.inquiryNo}</Ref>
                    </Link>
                    {r._count.quotations > 0 && (
                      <span className="ml-2 text-[10px] text-stone">
                        {bi(`${r._count.quotations} quote`, `${r._count.quotations} 报价`)}
                      </span>
                    )}
                  </Td>
                  <Td>
                    <div className="font-medium">{r.companyName || r.customerName || "—"}</div>
                    <div className="text-xs text-stone">
                      {[r.customerName, r.country].filter(Boolean).join(" · ")}
                    </div>
                  </Td>
                  <Td className="max-w-[220px] truncate">{r.productName || "—"}</Td>
                  <Td className="whitespace-nowrap text-xs">
                    {r.quantity != null ? formatQuantity(r.quantity, r.unit) : "—"}
                    {r.targetPrice != null && (
                      <div className="text-stone">
                        {formatMoney(r.targetPrice, r.currency || "USD")}
                      </div>
                    )}
                  </Td>
                  <Td className="text-xs text-stone">
                    {INQUIRY_SOURCES[r.source as keyof typeof INQUIRY_SOURCES] ?? r.source}
                  </Td>
                  <Td>
                    <StatusPill meta={INQUIRY_STATUS[r.status as keyof typeof INQUIRY_STATUS]} />
                  </Td>
                  <Td className="whitespace-nowrap text-xs text-stone">
                    {new Date(r.createdAt).toLocaleString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Td>
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

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-wider text-stone">
      {children}
    </th>
  )
}

function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 align-top ${className ?? ""}`}>{children}</td>
}
