"use client"

import { cn } from "@/lib/utils/cn"
import { bi } from "@/components/admin/bilingual"
import type { StatusMeta } from "@/lib/sales/status-meta"

export function StatusPill({
  meta,
  className,
}: {
  meta: StatusMeta | undefined
  className?: string
}) {
  if (!meta) return <span className="text-stone">—</span>
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ring-1 ring-inset",
        meta.className,
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} aria-hidden />
      {bi(meta.label, meta.labelZh)}
    </span>
  )
}

/** Monospace reference number, kept selectable so staff can copy it into mail. */
export function Ref({ children }: { children: React.ReactNode }) {
  return <span className="font-mono text-xs tracking-tight">{children}</span>
}

export function Panel({
  title,
  action,
  children,
  className,
}: {
  title?: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn("mb-8 bg-white border border-mist", className)}>
      {(title || action) && (
        <header className="flex items-center justify-between gap-4 border-b border-mist px-4 py-3">
          {title ? (
            <h2 className="text-[10px] uppercase tracking-wider text-stone font-medium">{title}</h2>
          ) : (
            <span />
          )}
          {action}
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  )
}

export const inputCls =
  "w-full px-3 py-2 text-sm bg-white border border-mist focus:border-charcoal focus:outline-none"

export const selectCls =
  "px-3 py-2 text-xs bg-white border border-mist focus:border-charcoal focus:outline-none"

export const btnPrimary =
  "px-4 py-2 bg-charcoal text-white text-xs uppercase tracking-wider hover:bg-charcoal/90 disabled:opacity-50"

export const btnGhost =
  "px-3 py-2 border border-mist text-xs uppercase tracking-wider hover:border-charcoal disabled:opacity-50"

export const btnDanger =
  "px-3 py-2 border border-rosegold/40 text-rosegold text-xs uppercase tracking-wider hover:bg-rosegold/10 disabled:opacity-50"

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string
  hint?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1 block text-[10px] uppercase tracking-wider text-stone font-medium">
        {label}
      </span>
      {children}
      {hint && <span className="mt-1 block text-[10px] text-stone/80">{hint}</span>}
    </label>
  )
}

/** Labelled value pair used across the detail panels. */
export function ReadOnly({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] uppercase tracking-wider text-stone font-medium">{label}</dt>
      <dd className="mt-0.5 text-sm break-words">{children}</dd>
    </div>
  )
}

export function ErrorNote({ children }: { children: React.ReactNode }) {
  if (!children) return null
  return (
    <div className="mb-4 border border-rosegold/30 bg-rosegold/10 px-3 py-2 text-sm text-rosegold">
      {children}
    </div>
  )
}

export function EmptyNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="border border-dashed border-mist px-4 py-8 text-center text-sm text-stone">
      {children}
    </div>
  )
}
