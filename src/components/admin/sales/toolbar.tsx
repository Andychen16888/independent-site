"use client"

import { btnGhost, btnPrimary, selectCls } from "./ui"

/**
 * Page controls shared by the enquiry, quotation, mail and follow-up lists.
 *
 * Filters live in the URL rather than component state so a filtered view can be
 * bookmarked, shared with a colleague, or reached from the sidebar's stage links,
 * and so the browser back button steps through the filter history.
 */
export function ListToolbar({
  search,
  onSearch,
  onSubmitSearch,
  children,
  right,
}: {
  search: string
  onSearch: (value: string) => void
  onSubmitSearch: () => void
  children?: React.ReactNode
  right?: React.ReactNode
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3 border border-mist bg-white p-3">
      <input
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSubmitSearch()
        }}
        className="min-w-[200px] flex-1 px-3 py-2 text-sm border border-mist focus:border-charcoal focus:outline-none"
      />
      {children}
      <button onClick={onSubmitSearch} className={btnPrimary}>
        Search
      </button>
      {right}
    </div>
  )
}

export function SelectFilter({
  value,
  onChange,
  options,
  className,
}: {
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  className?: string
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={`${selectCls} ${className ?? ""}`}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

export function Pager({
  page,
  totalPages,
  total,
  pageSize,
  onPage,
}: {
  page: number
  totalPages: number
  total: number
  pageSize: number
  onPage: (page: number) => void
}) {
  if (totalPages <= 1) {
    return <p className="mt-3 text-xs text-stone">{total} total</p>
  }
  const from = (page - 1) * pageSize + 1
  const to = Math.min(total, page * pageSize)
  return (
    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-stone">
      <span>
        {from}–{to} of {total}
      </span>
      <div className="ml-auto flex items-center gap-2">
        <button onClick={() => onPage(page - 1)} disabled={page <= 1} className={btnGhost}>
          Prev
        </button>
        <span className="tabular-nums">
          {page} / {totalPages}
        </span>
        <button onClick={() => onPage(page + 1)} disabled={page >= totalPages} className={btnGhost}>
          Next
        </button>
      </div>
    </div>
  )
}

export function Loading({ label = "Loading..." }: { label?: string }) {
  return <div className="py-12 text-center text-sm text-stone">{label}</div>
}
