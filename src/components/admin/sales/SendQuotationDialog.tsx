"use client"

import { useState } from "react"
import { toast } from "react-hot-toast"
import { bi } from "@/components/admin/bilingual"
import { fetchJsonResponse, responseErrorMessage } from "@/lib/json-response"
import { btnGhost, btnPrimary, inputCls } from "./ui"

/**
 * Sends a quotation PDF to the customer.
 *
 * The recipient defaults to the enquiry's own address but stays editable, because
 * a buyer frequently asks for the quote to go to a colleague or a trading agent.
 * The server ignores any recipient the enquiry does not sanction and re-validates
 * the address, so this field narrows nothing and widens nothing unsafe.
 */
export function SendQuotationDialog({
  quotationId,
  quotationNo,
  defaultTo,
  onClose,
  onSent,
}: {
  quotationId: string
  quotationNo: string
  defaultTo: string
  onClose: () => void
  onSent: () => void
}) {
  const [to, setTo] = useState(defaultTo)
  const [subject, setSubject] = useState(`Quotation ${quotationNo}`)
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)

  const submit = async () => {
    setSending(true)
    try {
      const { res, parsed, data } = await fetchJsonResponse<any>(`/api/admin/quotations/${quotationId}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: to.trim(),
          subject: subject.trim() || undefined,
          message: message.trim() || undefined,
        }),
      })
      const json = (data || {}) as any
      if (!parsed.ok) throw new Error(responseErrorMessage(parsed, `Send failed (${res.status})`))
      toast.success(bi("Quotation sent", `报价单已发送 (${json.emailNo})`))
      onSent()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Send failed")
    } finally {
      setSending(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/40 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-lg border border-mist bg-white p-6">
        <h2 className="mb-1 text-sm font-medium">
          {bi("Send quotation", "发送报价单")} {quotationNo}
        </h2>
        <p className="mb-4 text-xs text-stone">
          {bi(
            "The quotation PDF is attached to the email and the record is logged.",
            "报价单 PDF 将作为附件发送，并记录到邮件记录。"
          )}
        </p>

        <div className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-stone">
              {bi("To", "收件人")}
            </span>
            <input value={to} onChange={(e) => setTo(e.target.value)} className={inputCls} />
          </label>
          <label className="block">
            <span className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-stone">
              {bi("Subject", "主题")}
            </span>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} className={inputCls} />
          </label>
          <label className="block">
            <span className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-stone">
              {bi("Message (optional)", "留言（可选）")}
            </span>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className={inputCls}
            />
          </label>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button className={btnGhost} onClick={onClose} disabled={sending}>
            {bi("Cancel", "取消")}
          </button>
          <button className={btnPrimary} onClick={submit} disabled={sending || !to.trim()}>
            {sending ? bi("Sending...", "发送中...") : bi("Send", "发送")}
          </button>
        </div>
      </div>
    </div>
  )
}
