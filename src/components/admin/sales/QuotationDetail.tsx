"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "react-hot-toast"
import { bi } from "@/components/admin/bilingual"
import {
  EMAIL_STATUS,
  QUOTATION_STATUS,
  formatMoney,
  formatQuantity,
} from "@/lib/sales/status-meta"
import { QuotationEditor, type QuotationDraft } from "./QuotationEditor"
import { SendQuotationDialog } from "./SendQuotationDialog"
import {
  EmptyNote,
  ErrorNote,
  Panel,
  ReadOnly,
  Ref,
  StatusPill,
  btnGhost,
  btnPrimary,
  selectCls,
} from "./ui"

interface QuotationDetail extends QuotationDraft {
  id: string
  quotationNo: string
  validUntil: string
  sentAt: string | null
  acceptedAt: string | null
  createdAt: string
  inquiry: {
    id: string
    inquiryNo: string
    customerName: string | null
    companyName: string | null
    email: string | null
    country: string | null
  }
  emailRecords: {
    id: string
    emailNo: string
    subject: string | null
    direction: string
    purpose: string
    status: string
    receiver: string | null
    createdAt: string
  }[]
}

export function QuotationDetailView({ id }: { id: string }) {
  const router = useRouter()
  const [data, setData] = useState<QuotationDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const [editing, setEditing] = useState(false)
  const [sending, setSending] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch(`/api/admin/quotations/${id}`, { cache: "no-store" })
      if (!res.ok) throw new Error(`Failed to load quotation (${res.status})`)
      setData((await res.json()) as QuotationDetail)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load quotation")
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  const setStatus = async (status: string) => {
    setBusy(true)
    try {
      const res = await fetch(`/api/admin/quotations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || `Failed (${res.status})`)
      toast.success(bi("Status updated", "状态已更新"))
      await load()
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed")
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return <div className="py-16 text-center text-sm text-stone">{bi("Loading...", "正在加载...")}</div>
  }
  if (error || !data) {
    return <ErrorNote>{error || bi("Quotation not found", "未找到报价单")}</ErrorNote>
  }

  // The server refuses edits on a closed offer, so the control is disabled here to
  // match rather than to let the request fail.
  const locked = data.status === "ACCEPTED" || data.status === "EXPIRED"

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/admin/quotations" className="text-xs text-stone hover:text-charcoal">
            ← {bi("All quotations", "全部报价单")}
          </Link>
          <h1 className="heading-md mt-1 flex flex-wrap items-center gap-3">
            <Ref>{data.quotationNo}</Ref>
            <StatusPill meta={QUOTATION_STATUS[data.status as keyof typeof QUOTATION_STATUS]} />
          </h1>
          <p className="mt-1 text-sm text-stone">
            <Link href={`/admin/inquiries/${data.inquiry.id}`} className="hover:underline">
              {data.inquiry.inquiryNo}
            </Link>{" "}
            · {data.inquiry.companyName || data.inquiry.customerName || "—"}
            {data.inquiry.country ? ` · ${data.inquiry.country}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={data.status}
            disabled={busy}
            onChange={(e) => setStatus(e.target.value)}
            className={selectCls}
          >
            {Object.entries(QUOTATION_STATUS).map(([value, meta]) => (
              <option key={value} value={value}>
                {bi(meta.label, meta.labelZh)}
              </option>
            ))}
          </select>
          <a
            href={`/api/admin/quotations/${id}/pdf`}
            target="_blank"
            rel="noreferrer"
            className={btnGhost}
          >
            PDF
          </a>
          <button className={btnPrimary} onClick={() => setSending(true)} disabled={data.status === "ACCEPTED"}>
            {bi("Send", "发送")}
          </button>
        </div>
      </div>

      {locked && (
        <div className="mb-4 border border-amber/40 bg-amber/10 px-3 py-2 text-sm">
          {bi(
            "This quotation is closed and can no longer be edited. Only its status can still change.",
            "此报价单已关闭，无法再编辑，仅可变更状态。"
          )}
        </div>
      )}

      <Panel
        title={bi("Terms", "条款")}
        action={
          !locked && !editing ? (
            <button className={btnPrimary} onClick={() => setEditing(true)}>
              {bi("Edit", "编辑")}
            </button>
          ) : null
        }
      >
        {editing ? (
          <QuotationEditor
            inquiryId={data.inquiry.id}
            quotation={data}
            onClose={() => setEditing(false)}
            onSaved={() => {
              setEditing(false)
              load()
            }}
          />
        ) : (
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <ReadOnly label={bi("Currency", "币种")}>{data.currency}</ReadOnly>
            <ReadOnly label={bi("Validity", "有效期")}>
              {data.validityDays} {bi("days", "天")} ·{" "}
              {new Date(data.validUntil).toLocaleDateString("en-GB")}
            </ReadOnly>
            <ReadOnly label="MOQ">{data.moq || "—"}</ReadOnly>
            <ReadOnly label={bi("Lead time", "交货期")}>{data.leadTime || "—"}</ReadOnly>
            <ReadOnly label={bi("Payment terms", "付款方式")}>
              {data.paymentTerms || "—"}
            </ReadOnly>
            <ReadOnly label={bi("Shipping terms", "贸易条款")}>
              {data.shippingTerms || "—"}
            </ReadOnly>
            <ReadOnly label={bi("Total", "合计")}>
              <span className="font-medium">{formatMoney(data.totalAmount, data.currency)}</span>
            </ReadOnly>
            <ReadOnly label={bi("Sent / Accepted", "发送 / 接受")}>
              <div className="text-xs">
                {data.sentAt ? `Sent ${new Date(data.sentAt).toLocaleDateString("en-GB")}` : "—"}
                {data.acceptedAt
                  ? ` / Accepted ${new Date(data.acceptedAt).toLocaleDateString("en-GB")}`
                  : ""}
              </div>
            </ReadOnly>
            {data.note && (
              <div className="sm:col-span-2 lg:col-span-4">
                <ReadOnly label={bi("Note", "备注")}>
                  <span className="whitespace-pre-wrap">{data.note}</span>
                </ReadOnly>
              </div>
            )}
          </dl>
        )}
      </Panel>

      <Panel title={bi("Line items", "报价明细")}>
        {data.items.length === 0 ? (
          <EmptyNote>{bi("No line items.", "暂无明细。")}</EmptyNote>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-mist text-left">
                  {[
                    bi("Product", "产品"),
                    bi("Specification", "规格"),
                    bi("Quantity", "数量"),
                    bi("Unit price", "单价"),
                    bi("Amount", "金额"),
                  ].map((h, i) => (
                    <th
                      key={h}
                      className={`px-3 py-2 text-[10px] font-medium uppercase tracking-wider text-stone ${
                        i >= 2 ? "text-right" : ""
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.items.map((i) => (
                  <tr key={i.id ?? i.productName} className="border-b border-mist/50 align-top">
                    <td className="px-3 py-2 font-medium">{i.productName}</td>
                    <td className="px-3 py-2 text-xs text-stone">{i.specification || "—"}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">
                      {formatQuantity(i.quantity, i.unit)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">
                      {formatMoney(i.unitPrice, data.currency)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">
                      {formatMoney(i.amount ?? 0, data.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-mist">
                  <td colSpan={4} className="px-3 py-2 text-right text-xs uppercase tracking-wider text-stone">
                    {bi("Total", "合计")}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-right font-medium">
                    {formatMoney(data.totalAmount, data.currency)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Panel>

      <Panel title={bi("Email history", "邮件历史")}>
        {data.emailRecords.length === 0 ? (
          <EmptyNote>{bi("Nothing sent yet.", "尚未发送。")}</EmptyNote>
        ) : (
          <ul className="divide-y divide-mist">
            {data.emailRecords.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center gap-3 py-2 text-sm">
                <Ref>{m.emailNo}</Ref>
                <span className="text-xs text-stone">
                  {m.direction} · {m.purpose}
                </span>
                <StatusPill meta={EMAIL_STATUS[m.status]} />
                <span className="min-w-0 flex-1 truncate">{m.subject}</span>
                <span className="text-xs text-stone">{m.receiver}</span>
                <span className="text-xs text-stone">
                  {new Date(m.createdAt).toLocaleString("en-GB", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {sending && (
        <SendQuotationDialog
          quotationId={id}
          quotationNo={data.quotationNo}
          defaultTo={data.inquiry.email ?? ""}
          onClose={() => setSending(false)}
          onSent={() => {
            setSending(false)
            load()
          }}
        />
      )}
    </div>
  )
}
