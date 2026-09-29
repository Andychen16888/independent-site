"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "react-hot-toast"
import { bi } from "@/components/admin/bilingual"
import {
  INQUIRY_SOURCES,
  INQUIRY_STATUS,
  QUOTATION_STATUS,
  formatMoney,
  formatQuantity,
} from "@/lib/sales/status-meta"
import { QuotationEditor } from "./QuotationEditor"
import { SendQuotationDialog } from "./SendQuotationDialog"
import { FollowUpList } from "./FollowUpList"
import {
  EmptyNote,
  ErrorNote,
  Panel,
  ReadOnly,
  Ref,
  StatusPill,
  btnDanger,
  btnGhost,
  btnPrimary,
  inputCls,
  selectCls,
} from "./ui"

interface QuotationItem {
  id: string
  productName: string
  specification: string | null
  quantity: number
  unit: string | null
  unitPrice: number
  amount: number
}

interface Quotation {
  id: string
  quotationNo: string
  status: string
  currency: string
  totalAmount: number
  moq: string | null
  leadTime: string | null
  paymentTerms: string | null
  shippingTerms: string | null
  validityDays: number
  note: string | null
  validUntil: string
  sentAt: string | null
  acceptedAt: string | null
  createdAt: string
  items: QuotationItem[]
}

interface FollowUp {
  id: string
  followUpDate: string
  note: string | null
  nextAction: string | null
  status: string
  completedAt: string | null
}

interface EmailRow {
  id: string
  emailNo: string
  subject: string | null
  direction: string
  purpose: string
  status: string
  receiver: string | null
  createdAt: string
}

interface InquiryDetail {
  id: string
  inquiryNo: string
  status: string
  source: string
  customerName: string | null
  companyName: string | null
  email: string | null
  phone: string | null
  whatsapp: string | null
  country: string | null
  city: string | null
  address: string | null
  jobTitle: string | null
  linkedin: string | null
  website: string | null
  productId: string | null
  productName: string | null
  productSpec: string | null
  quantity: number | null
  unit: string | null
  targetPrice: number | null
  recommendedPrice: number | null
  currency: string | null
  application: string | null
  message: string | null
  internalNote: string | null
  lostReason: string | null
  customerIntent: string | null
  aiReply: string | null
  createdAt: string
  updatedAt: string
  product: { id: string; slug: string; name: string } | null
  assignedUser: { id: string; firstName: string | null; lastName: string | null; email: string } | null
  quotations: Quotation[]
  emailRecords: EmailRow[]
  followUps: FollowUp[]
}

const textValue = (v: string | null | undefined) => v ?? ""

export function InquiryDetailView({ id }: { id: string }) {
  const router = useRouter()
  const [data, setData] = useState<InquiryDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  // Editable copies. Kept in state so a failed save does not discard typing.
  const [internalNote, setInternalNote] = useState("")
  const [lostReason, setLostReason] = useState("")
  const [recommendedPrice, setRecommendedPrice] = useState("")
  const [editingQuotation, setEditingQuotation] = useState<Quotation | null>(null)
  const [creatingQuotation, setCreatingQuotation] = useState(false)
  const [sendTarget, setSendTarget] = useState<Quotation | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch(`/api/admin/inquiries/${id}`, { cache: "no-store" })
      if (!res.ok) throw new Error(`Failed to load enquiry (${res.status})`)
      const json = (await res.json()) as InquiryDetail
      setData(json)
      setInternalNote(textValue(json.internalNote))
      setLostReason(textValue(json.lostReason))
      setRecommendedPrice(
        json.recommendedPrice != null ? String(json.recommendedPrice) : ""
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load enquiry")
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  const patch = async (body: Record<string, unknown>, message: string) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/inquiries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || `Update failed (${res.status})`)
      toast.success(message)
      await load()
      router.refresh()
      return true
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed")
      return false
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (
      !confirm(
        bi(
          "Delete this enquiry? Only enquiries with no quotation, mail or follow-up can be removed.",
          "删除此询盘？仅无报价、邮件或跟进的询盘可删除。"
        )
      )
    )
      return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/inquiries/${id}`, { method: "DELETE" })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || `Delete failed (${res.status})`)
      toast.success(bi("Enquiry deleted", "询盘已删除"))
      router.push("/admin/inquiries")
    } catch (e) {
      // A 409 is the expected outcome for any enquiry with sales history, so it is
      // surfaced as guidance rather than a raw failure.
      toast.error(
        e instanceof Error
          ? `${e.message} ${bi("Set the status to Lost instead.", "请改为将状态设为“已流失”。")}`
          : "Delete failed"
      )
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="py-16 text-center text-sm text-stone">{bi("Loading...", "正在加载...")}</div>
  }
  if (error || !data) {
    return <ErrorNote>{error || bi("Enquiry not found", "未找到询盘")}</ErrorNote>
  }

  const hasHistory = data.quotations.length + data.emailRecords.length + data.followUps.length > 0

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/admin/inquiries" className="text-xs text-stone hover:text-charcoal">
            ← {bi("All inquiries", "全部询盘")}
          </Link>
          <h1 className="heading-md mt-1 flex flex-wrap items-center gap-3">
            <Ref>{data.inquiryNo}</Ref>
            <StatusPill meta={INQUIRY_STATUS[data.status as keyof typeof INQUIRY_STATUS]} />
          </h1>
          <p className="mt-1 text-sm text-stone">
            {bi("Received", "接收于")}{" "}
            {new Date(data.createdAt).toLocaleString("en-GB", {
              dateStyle: "medium",
              timeStyle: "short",
            })}{" "}
            · {INQUIRY_SOURCES[data.source as keyof typeof INQUIRY_SOURCES] ?? data.source}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={data.status}
            disabled={saving}
            onChange={(e) => patch({ status: e.target.value }, bi("Status updated", "状态已更新"))}
            className={selectCls}
          >
            {Object.entries(INQUIRY_STATUS).map(([value, meta]) => (
              <option key={value} value={value}>
                {bi(meta.label, meta.labelZh)}
              </option>
            ))}
          </select>
          <button
            onClick={remove}
            disabled={saving}
            className={btnDanger}
            title={
              hasHistory
                ? bi(
                    "Has sales history; deletion is refused by the server",
                    "已有销售记录，服务端会拒绝删除"
                  )
                : undefined
            }
          >
            {bi("Delete", "删除")}
          </button>
        </div>
      </div>

      <Panel title={bi("Customer", "客户信息")}>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ReadOnly label={bi("Name", "姓名")}>
            {data.customerName || "—"}
            {data.jobTitle && <div className="text-xs text-stone">{data.jobTitle}</div>}
          </ReadOnly>
          <ReadOnly label={bi("Company", "公司")}>{data.companyName || "—"}</ReadOnly>
          <ReadOnly label="Email">
            {data.email ? (
              <a href={`mailto:${data.email}`} className="hover:underline">
                {data.email}
              </a>
            ) : (
              "—"
            )}
          </ReadOnly>
          <ReadOnly label={bi("Phone", "电话")}>
            {data.phone || "—"}
            {data.whatsapp && (
              <div className="text-xs text-stone">WhatsApp: {data.whatsapp}</div>
            )}
          </ReadOnly>
          <ReadOnly label={bi("Location", "地区")}>
            {[data.city, data.country].filter(Boolean).join(", ") || "—"}
            {data.address && <div className="text-xs text-stone">{data.address}</div>}
          </ReadOnly>
          <ReadOnly label={bi("Website / LinkedIn", "网站 / LinkedIn")}>
            {data.website || data.linkedin ? (
              <span className="break-all">{[data.website, data.linkedin].filter(Boolean).join(" · ")}</span>
            ) : (
              "—"
            )}
          </ReadOnly>
        </dl>
      </Panel>

      <Panel title={bi("Requirement", "采购需求")}>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ReadOnly label={bi("Product", "产品")}>
            {data.productName || "—"}
            {data.product ? (
              <Link
                href={`/admin/products?q=${encodeURIComponent(data.product.name)}`}
                className="ml-2 text-xs text-stone hover:underline"
              >
                {bi("view", "查看")}
              </Link>
            ) : (
              <div className="text-xs text-stone">{bi("snapshot", "快照")}</div>
            )}
          </ReadOnly>
          <ReadOnly label={bi("Quantity", "数量")}>
            {data.quantity != null ? formatQuantity(data.quantity, data.unit) : "—"}
          </ReadOnly>
          <ReadOnly label={bi("Target price", "目标价")}>
            {data.targetPrice != null ? formatMoney(data.targetPrice, data.currency || "USD") : "—"}
          </ReadOnly>
          <ReadOnly label={bi("Application", "应用")}>{data.application || "—"}</ReadOnly>
        </dl>
        {data.productSpec && (
          <p className="mt-3 whitespace-pre-wrap text-sm text-stone">{data.productSpec}</p>
        )}
        {data.message && (
          <div className="mt-3 border-l-2 border-mist pl-3 text-sm whitespace-pre-wrap">
            {data.message}
          </div>
        )}
      </Panel>

      <Panel
        title={bi("Internal notes", "内部备注")}
        action={
          <button
            className={btnPrimary}
            disabled={saving}
            onClick={() =>
              patch(
                {
                  internalNote: internalNote || null,
                  lostReason: lostReason || null,
                  recommendedPrice:
                    recommendedPrice.trim() === "" ? null : Number(recommendedPrice),
                },
                bi("Notes saved", "备注已保存")
              )
            }
          >
            {bi("Save", "保存")}
          </button>
        }
      >
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <label className="block lg:col-span-2">
            <span className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-stone">
              {bi("Note", "备注")}
            </span>
            <textarea
              value={internalNote}
              onChange={(e) => setInternalNote(e.target.value)}
              rows={5}
              className={inputCls}
            />
          </label>
          <div className="space-y-4">
            <label className="block">
              <span className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-stone">
                {bi("Recommended price", "建议报价")}
              </span>
              <input
                value={recommendedPrice}
                onChange={(e) => setRecommendedPrice(e.target.value)}
                inputMode="decimal"
                className={inputCls}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-stone">
                {bi("Lost reason", "流失原因")}
              </span>
              <input
                value={lostReason}
                onChange={(e) => setLostReason(e.target.value)}
                className={inputCls}
              />
            </label>
          </div>
        </div>
        {data.customerIntent && (
          <p className="mt-4 whitespace-pre-wrap text-sm text-stone">
            <span className="mr-2 text-[10px] uppercase tracking-wider">
              {bi("Intent", "意向")}
            </span>
            {data.customerIntent}
          </p>
        )}
        {data.aiReply && (
          <p className="mt-2 whitespace-pre-wrap text-sm text-stone">
            <span className="mr-2 text-[10px] uppercase tracking-wider">
              {bi("AI draft", "AI 草稿")}
            </span>
            {data.aiReply}
          </p>
        )}
      </Panel>

      <Panel
        title={bi("Quotations", "报价单")}
        action={
          !editingQuotation && !creatingQuotation ? (
            <button className={btnPrimary} onClick={() => setCreatingQuotation(true)}>
              {bi("New quotation", "新建报价")}
            </button>
          ) : null
        }
      >
        {creatingQuotation && (
          <div className="mb-6 border border-mist p-4">
            <QuotationEditor
              inquiryId={id}
              productName={data.productName}
              specification={data.productSpec}
              suggestedQuantity={data.quantity}
              suggestedUnit={data.unit}
              onClose={() => setCreatingQuotation(false)}
              onSaved={() => {
                setCreatingQuotation(false)
                load()
              }}
            />
          </div>
        )}

        {editingQuotation && (
          <div className="mb-6 border border-mist p-4">
            <QuotationEditor
              inquiryId={id}
              quotation={editingQuotation}
              onClose={() => setEditingQuotation(null)}
              onSaved={() => {
                setEditingQuotation(null)
                load()
              }}
            />
          </div>
        )}

        {!creatingQuotation && !editingQuotation && data.quotations.length === 0 && (
          <EmptyNote>{bi("No quotations yet.", "暂无报价单。")}</EmptyNote>
        )}

        <div className="space-y-4">
          {data.quotations.map((q) => (
            <article key={q.id} className="border border-mist">
              <header className="flex flex-wrap items-center gap-3 border-b border-mist bg-ivory/40 px-4 py-2">
                <Ref>{q.quotationNo}</Ref>
                <StatusPill
                  meta={QUOTATION_STATUS[q.status as keyof typeof QUOTATION_STATUS]}
                />
                <span className="text-xs text-stone">
                  {new Date(q.createdAt).toLocaleDateString("en-GB")}
                </span>
                <span className="ml-auto font-medium">
                  {formatMoney(q.totalAmount, q.currency)}
                </span>
              </header>
              <table className="w-full text-sm">
                <tbody>
                  {q.items.map((i) => (
                    <tr key={i.id} className="border-b border-mist/40">
                      <td className="px-4 py-2">
                        <div className="font-medium">{i.productName}</div>
                        {i.specification && (
                          <div className="text-xs text-stone">{i.specification}</div>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2 text-right text-xs">
                        {formatQuantity(i.quantity, i.unit)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2 text-right text-xs">
                        {formatMoney(i.unitPrice, q.currency)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2 text-right text-xs">
                        {formatMoney(i.amount, q.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <footer className="flex flex-wrap items-center gap-2 px-4 py-2">
                <a
                  href={`/api/admin/quotations/${q.id}/pdf`}
                  target="_blank"
                  rel="noreferrer"
                  className={btnGhost}
                >
                  PDF
                </a>
                <button className={btnGhost} onClick={() => setSendTarget(q)}>
                  {bi("Send", "发送")}
                </button>
                <button className={btnGhost} onClick={() => setEditingQuotation(q)}>
                  {bi("Edit", "编辑")}
                </button>
                <Link href={`/admin/quotations/${q.id}`} className={btnGhost}>
                  {bi("Open", "打开")}
                </Link>
                <span className="ml-auto text-xs text-stone">
                  {bi("Valid until", "有效期至")} {new Date(q.validUntil).toLocaleDateString("en-GB")}
                </span>
              </footer>
            </article>
          ))}
        </div>
      </Panel>

      {sendTarget && (
        <SendQuotationDialog
          quotationId={sendTarget.id}
          quotationNo={sendTarget.quotationNo}
          defaultTo={data.email ?? ""}
          onClose={() => setSendTarget(null)}
          onSent={() => {
            setSendTarget(null)
            load()
          }}
        />
      )}

      <FollowUpList
        inquiryId={id}
        followUps={data.followUps}
        onChanged={() => load()}
      />

      <Panel title={bi("Email records", "邮件记录")}>
        {data.emailRecords.length === 0 ? (
          <EmptyNote>{bi("No emails logged.", "暂无邮件记录。")}</EmptyNote>
        ) : (
          <ul className="divide-y divide-mist">
            {data.emailRecords.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center gap-3 py-2 text-sm">
                <Ref>{m.emailNo}</Ref>
                <span className="text-xs text-stone">
                  {m.direction} · {m.purpose} · {m.status}
                </span>
                <span className="min-w-0 flex-1 truncate">{m.subject}</span>
                <span className="text-xs text-stone">
                  {m.receiver} ·{" "}
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
    </div>
  )
}
