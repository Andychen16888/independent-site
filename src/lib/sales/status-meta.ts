// Type-only: this module is imported by client components, and a value import
// would pull the generated Prisma client into the browser bundle. The enum members
// are referenced purely as types here; the API routes are what validate a value
// against the real enum at runtime.
import type {
  FollowUpStatus,
  InquirySource,
  InquiryStatus,
  QuotationStatus,
} from "@prisma/client"

/**
 * Display metadata for the sales pipeline.
 *
 * Statuses are grouped rather than listed in enum order, because the sidebar is
 * a workflow: what arrived, what needs working today, and what closed. A flat
 * list of seven enum values would mix a live lead with a two-year-old win.
 */

export interface StatusMeta {
  label: string
  labelZh: string
  /** CSS classes for the status pill. Kept literal so Tailwind can see them. */
  className: string
  dot: string
}

export const INQUIRY_STATUS: Record<InquiryStatus, StatusMeta> = {
  NEW: {
    label: "New",
    labelZh: "新询盘",
    className: "bg-sky-50 text-sky-700 ring-sky-600/20",
    dot: "bg-sky-500",
  },
  PROCESSING: {
    label: "Processing",
    labelZh: "处理中",
    className: "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
    dot: "bg-indigo-500",
  },
  QUOTATION_SENT: {
    label: "Quotation Sent",
    labelZh: "已报价",
    className: "bg-amber-50 text-amber-700 ring-amber-600/20",
    dot: "bg-amber-500",
  },
  CUSTOMER_REPLIED: {
    label: "Customer Replied",
    labelZh: "客户已回复",
    className: "bg-teal-50 text-teal-700 ring-teal-600/20",
    dot: "bg-teal-500",
  },
  NEGOTIATION: {
    label: "Negotiation",
    labelZh: "议价中",
    className: "bg-violet-50 text-violet-700 ring-violet-600/20",
    dot: "bg-violet-500",
  },
  ORDER_CONFIRMED: {
    label: "Won",
    labelZh: "已成交",
    className: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    dot: "bg-emerald-500",
  },
  LOST: {
    label: "Lost",
    labelZh: "已流失",
    className: "bg-stone-100 text-stone-600 ring-stone-500/20",
    dot: "bg-stone-400",
  },
}

/**
 * The sidebar's six pipeline stages, in the order a lead moves through them.
 * `Won` is a label for ORDER_CONFIRMED; the enum name is an implementation
 * detail and a filter URL should read as the stage does.
 */
export const INQUIRY_STAGES = [
  { key: "new", label: "New", labelZh: "新询盘", status: "NEW" as InquiryStatus },
  { key: "processing", label: "Processing", labelZh: "处理中", status: "PROCESSING" as InquiryStatus },
  {
    key: "quotation-sent",
    label: "Quotation Sent",
    labelZh: "已报价",
    status: "QUOTATION_SENT" as InquiryStatus,
  },
  { key: "negotiation", label: "Negotiation", labelZh: "议价中", status: "NEGOTIATION" as InquiryStatus },
  { key: "won", label: "Won", labelZh: "已成交", status: "ORDER_CONFIRMED" as InquiryStatus },
  { key: "lost", label: "Lost", labelZh: "已流失", status: "LOST" as InquiryStatus },
] as const

/** Reverse lookup for the /admin/inquiries?status= filter. */
export const STAGE_BY_STATUS = new Map<InquiryStatus, string>(
  INQUIRY_STAGES.map((s) => [s.status, s.key])
)

/** CUSTOMER_REPLIED has no sidebar stage of its own; it surfaces under All. */
export const UNGROUPED_INQUIRY_STATUS: InquiryStatus[] = ["CUSTOMER_REPLIED"]

export const QUOTATION_STATUS: Record<QuotationStatus, StatusMeta> = {
  DRAFT: {
    label: "Draft",
    labelZh: "草稿",
    className: "bg-stone-100 text-stone-600 ring-stone-500/20",
    dot: "bg-stone-400",
  },
  SENT: {
    label: "Sent",
    labelZh: "已发送",
    className: "bg-amber-50 text-amber-700 ring-amber-600/20",
    dot: "bg-amber-500",
  },
  ACCEPTED: {
    label: "Accepted",
    labelZh: "已接受",
    className: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    dot: "bg-emerald-500",
  },
  EXPIRED: {
    label: "Expired",
    labelZh: "已过期",
    className: "bg-orange-50 text-orange-700 ring-orange-600/20",
    dot: "bg-orange-400",
  },
  REJECTED: {
    label: "Rejected",
    labelZh: "已拒绝",
    className: "bg-rose-50 text-rose-700 ring-rose-600/20",
    dot: "bg-rose-400",
  },
}

export const EMAIL_STATUS: Record<string, StatusMeta> = {
  PENDING: {
    label: "Pending",
    labelZh: "待发送",
    className: "bg-stone-100 text-stone-600 ring-stone-500/20",
    dot: "bg-stone-400",
  },
  SENT: {
    label: "Sent",
    labelZh: "已发送",
    className: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    dot: "bg-emerald-500",
  },
  FAILED: {
    label: "Failed",
    labelZh: "发送失败",
    className: "bg-rose-50 text-rose-700 ring-rose-600/20",
    dot: "bg-rose-500",
  },
}

export const FOLLOW_UP_STATUS: Record<FollowUpStatus, StatusMeta> = {
  PENDING: {
    label: "Pending",
    labelZh: "待跟进",
    className: "bg-amber-50 text-amber-700 ring-amber-600/20",
    dot: "bg-amber-500",
  },
  DONE: {
    label: "Done",
    labelZh: "已完成",
    className: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    dot: "bg-emerald-500",
  },
  CANCELLED: {
    label: "Cancelled",
    labelZh: "已取消",
    className: "bg-stone-100 text-stone-500 ring-stone-500/20",
    dot: "bg-stone-300",
  },
}

export const INQUIRY_SOURCES: Record<InquirySource, string> = {
  WEBSITE_RFQ: "Website RFQ",
  PRODUCT_PAGE: "Product Page",
  CAMPAIGN: "Campaign",
  AI_AGENT: "AI Agent",
}

// One implementation, re-exported so existing server-side callers keep working.
export { formatMoney } from "./currencies"

/** Quantities are stored to 3 decimals but trailing zeros are noise. */
export function formatQuantity(quantity: number | null | undefined, unit?: string | null): string {
  if (quantity == null) return "—"
  const text = Number.isInteger(quantity) ? String(quantity) : String(Number(quantity.toFixed(3)))
  return unit ? `${text} ${unit}` : text
}
