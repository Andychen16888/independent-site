"use client"

import { useMemo, useState } from "react"
import { toast } from "react-hot-toast"
import { bi } from "@/components/admin/bilingual"
import { CURRENCIES } from "@/lib/sales/currencies"
import { QUOTATION_STATUS, formatMoney } from "@/lib/sales/status-meta"
import { btnGhost, btnPrimary, inputCls, selectCls } from "./ui"

interface DraftItem {
  productName: string
  specification: string
  quantity: string
  unit: string
  unitPrice: string
}

export interface QuotationDraft {
  id?: string
  quotationNo?: string
  status: string
  currency: string
  moq: string | null
  leadTime: string | null
  paymentTerms: string | null
  shippingTerms: string | null
  validityDays: number
  note: string | null
  totalAmount?: number
  items: {
    id?: string
    productName: string
    specification: string | null
    quantity: number
    unit: string | null
    unitPrice: number
    amount?: number
  }[]
}

const emptyItem = (): DraftItem => ({
  productName: "",
  specification: "",
  quantity: "1",
  unit: "pcs",
  unitPrice: "0",
})

/**
 * Create / edit form for a quotation.
 *
 * Line amounts and the total are recomputed here as the user types so the figure
 * on screen always matches what the server will store; the server recomputes
 * again and is the authority, so this is a preview and not a second source of
 * truth.
 */
export function QuotationEditor({
  inquiryId,
  quotation,
  productName,
  specification,
  suggestedQuantity,
  suggestedUnit,
  onClose,
  onSaved,
}: {
  inquiryId: string
  quotation?: QuotationDraft
  productName?: string | null
  specification?: string | null
  suggestedQuantity?: number | null
  suggestedUnit?: string | null
  onClose: () => void
  onSaved: () => void
}) {
  const [status, setStatus] = useState(quotation?.status ?? "DRAFT")
  const [currency, setCurrency] = useState(quotation?.currency ?? "USD")
  const [validityDays, setValidityDays] = useState(String(quotation?.validityDays ?? 30))
  const [moq, setMoq] = useState(quotation?.moq ?? "")
  const [leadTime, setLeadTime] = useState(quotation?.leadTime ?? "")
  const [paymentTerms, setPaymentTerms] = useState(quotation?.paymentTerms ?? "")
  const [shippingTerms, setShippingTerms] = useState(quotation?.shippingTerms ?? "")
  const [note, setNote] = useState(quotation?.note ?? "")
  const [saving, setSaving] = useState(false)

  const [items, setItems] = useState<DraftItem[]>(() => {
    if (quotation?.items?.length) {
      return quotation.items.map((i) => ({
        productName: i.productName,
        specification: i.specification ?? "",
        quantity: String(i.quantity),
        unit: i.unit ?? "",
        unitPrice: String(i.unitPrice),
      }))
    }
    return [
      {
        ...emptyItem(),
        productName: productName ?? "",
        specification: specification ?? "",
        quantity:
          suggestedQuantity != null ? String(suggestedQuantity) : emptyItem().quantity,
        unit: suggestedUnit ?? emptyItem().unit,
      },
    ]
  })

  const total = useMemo(
    () =>
      items.reduce((sum, i) => {
        const q = Number(i.quantity)
        const p = Number(i.unitPrice)
        if (!Number.isFinite(q) || !Number.isFinite(p)) return sum
        return sum + Math.round(q * p * 100) / 100
      }, 0),
    [items]
  )

  const update = (index: number, patch: Partial<DraftItem>) =>
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)))

  const submit = async () => {
    const payload = {
      status,
      currency,
      validityDays: Number(validityDays) || 30,
      moq: moq || null,
      leadTime: leadTime || null,
      paymentTerms: paymentTerms || null,
      shippingTerms: shippingTerms || null,
      note: note || null,
      items: items.map((i) => ({
        productName: i.productName,
        specification: i.specification || null,
        quantity: Number(i.quantity),
        unit: i.unit || null,
        unitPrice: Number(i.unitPrice),
      })),
    }

    setSaving(true)
    try {
      const res = await fetch(
        quotation?.id
          ? `/api/admin/quotations/${quotation.id}`
          : `/api/admin/inquiries/${inquiryId}/quotations`,
        {
          method: quotation?.id ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      )
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        const fields = json.fields ? Object.values(json.fields).join("; ") : ""
        throw new Error([json.error || `Save failed (${res.status})`, fields].filter(Boolean).join(" — "))
      }
      toast.success(bi("Quotation saved", "报价单已保存"))
      onSaved()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-medium">
          {quotation?.id
            ? `${bi("Edit", "编辑")} ${quotation.quotationNo ?? ""}`
            : bi("New quotation", "新建报价")}
        </h3>
        <div className="flex items-center gap-2">
          <button className={btnGhost} onClick={onClose} disabled={saving}>
            {bi("Cancel", "取消")}
          </button>
          <button className={btnPrimary} onClick={submit} disabled={saving}>
            {bi("Save", "保存")}
          </button>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <label className="block">
          <span className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-stone">
            {bi("Status", "状态")}
          </span>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectCls}>
            {Object.entries(QUOTATION_STATUS).map(([value, meta]) => (
              <option key={value} value={value}>
                {bi(meta.label, meta.labelZh)}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-stone">
            {bi("Currency", "币种")}
          </span>
          <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={selectCls}>
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-stone">
            {bi("Validity (days)", "有效期（天）")}
          </span>
          <input
            value={validityDays}
            onChange={(e) => setValidityDays(e.target.value)}
            inputMode="numeric"
            className={inputCls}
          />
        </label>
        <div>
          <span className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-stone">
            {bi("Total", "合计")}
          </span>
          <p className="py-2 text-sm font-medium tabular-nums">{formatMoney(total, currency)}</p>
        </div>
      </div>

      <div className="mb-4 overflow-x-auto border border-mist">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-mist text-left">
              <th className="px-3 py-2 text-[10px] font-medium uppercase tracking-wider text-stone">
                {bi("Product", "产品")}
              </th>
              <th className="px-3 py-2 text-[10px] font-medium uppercase tracking-wider text-stone">
                {bi("Specification", "规格")}
              </th>
              <th className="w-28 px-3 py-2 text-[10px] font-medium uppercase tracking-wider text-stone">
                {bi("Quantity", "数量")}
              </th>
              <th className="w-24 px-3 py-2 text-[10px] font-medium uppercase tracking-wider text-stone">
                {bi("Unit", "单位")}
              </th>
              <th className="w-32 px-3 py-2 text-[10px] font-medium uppercase tracking-wider text-stone">
                {bi("Unit price", "单价")}
              </th>
              <th className="w-28 px-3 py-2 text-right text-[10px] font-medium uppercase tracking-wider text-stone">
                {bi("Amount", "金额")}
              </th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => {
              const amount =
                Math.round((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0) * 100) / 100
              return (
                <tr key={index} className="border-b border-mist/50 align-top">
                  <td className="px-3 py-2">
                    <input
                      value={item.productName}
                      onChange={(e) => update(index, { productName: e.target.value })}
                      className={inputCls}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <textarea
                      value={item.specification}
                      onChange={(e) => update(index, { specification: e.target.value })}
                      rows={2}
                      className={inputCls}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      value={item.quantity}
                      onChange={(e) => update(index, { quantity: e.target.value })}
                      inputMode="decimal"
                      className={inputCls}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      value={item.unit}
                      onChange={(e) => update(index, { unit: e.target.value })}
                      className={inputCls}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      value={item.unitPrice}
                      onChange={(e) => update(index, { unitPrice: e.target.value })}
                      inputMode="decimal"
                      className={inputCls}
                    />
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {formatMoney(amount, currency)}
                  </td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => setItems((prev) => prev.filter((_, i) => i !== index))}
                      disabled={items.length === 1}
                      title={bi("Remove line", "删除该行")}
                      className="text-xs text-rosegold disabled:opacity-30"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <button
        className={`${btnGhost} mb-4`}
        onClick={() => setItems((prev) => [...prev, emptyItem()])}
      >
        + {bi("Add line", "添加行")}
      </button>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-stone">
            MOQ
          </span>
          <input value={moq} onChange={(e) => setMoq(e.target.value)} className={inputCls} />
        </label>
        <label className="block">
          <span className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-stone">
            {bi("Lead time", "交货期")}
          </span>
          <input value={leadTime} onChange={(e) => setLeadTime(e.target.value)} className={inputCls} />
        </label>
        <label className="block">
          <span className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-stone">
            {bi("Payment terms", "付款方式")}
          </span>
          <input
            value={paymentTerms}
            onChange={(e) => setPaymentTerms(e.target.value)}
            className={inputCls}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-stone">
            {bi("Shipping terms", "贸易条款")}
          </span>
          <input
            value={shippingTerms}
            onChange={(e) => setShippingTerms(e.target.value)}
            className={inputCls}
          />
        </label>
        <label className="block lg:col-span-2">
          <span className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-stone">
            {bi("Note", "备注")}
          </span>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className={inputCls} />
        </label>
      </div>
    </div>
  )
}
