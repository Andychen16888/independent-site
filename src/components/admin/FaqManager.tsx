"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { toast } from "react-hot-toast"
import { bi } from "@/components/admin/bilingual"
import { fetchJsonResponse, responseErrorMessage } from "@/lib/json-response"

interface FaqRow {
  id: string
  sortOrder: number
  isActive: boolean
  updatedAt: string
  translations: { id: string; locale: string; question: string; answer: string }[]
}

export default function FaqManager() {
  const [rows, setRows] = useState<FaqRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const { parsed, data } = await fetchJsonResponse<any>("/api/admin/faqs", { cache: "no-store" })
      if (!parsed.ok) throw new Error(responseErrorMessage(parsed, bi("Failed to load FAQs", "加载 FAQ 失败")))
      const payload = (data || {}) as any
      setRows(payload.faqs || [])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const english = (t: any) => t?.locale === "en"

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="heading-md">{bi("FAQ", "常见问题")}</h1>
          <p className="text-body text-sm mt-1">{rows.length} {bi("FAQs — each item is stored in English plus translations for all locale pages.", "条 FAQ，每条保存英文并支持所有语言页面翻译。")}</p>
        </div>
        <Link href="/admin/faq/new" className="btn-primary text-xs">{bi("Add FAQ", "添加 FAQ")}</Link>
      </div>

      {error && <div className="bg-rosegold/10 border border-rosegold/20 text-sm p-3 mb-6">{error}</div>}

      {loading ? (
        <div className="text-sm text-stone py-12 text-center">{bi("Loading FAQs...", "正在加载 FAQ...")}</div>
      ) : rows.length === 0 ? (
        <div className="bg-white border border-mist p-12 text-center text-sm text-stone">
          {bi("No FAQs yet. Click", "暂无 FAQ，点击")} &ldquo;{bi("Add FAQ", "添加 FAQ")}&rdquo; {bi("to get started.", "开始创建。")}
        </div>
      ) : (
        <div className="bg-white border border-mist">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-mist text-left">
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">{bi("Order", "排序")}</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">{bi("Question", "问题")}</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">{bi("Translations", "翻译")}</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">{bi("Status", "状态")}</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">{bi("Actions", "操作")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((f) => {
                const en = f.translations.find(english)
                const localeCount = f.translations.length
                return (
                  <tr key={f.id} className="border-b border-mist/50 hover:bg-ivory/50 transition-colors">
                    <td className="px-4 py-3 text-xs text-stone">{f.sortOrder}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{en?.question || "—"}</p>
                      {en?.answer && <p className="text-xs text-stone truncate max-w-[420px] mt-0.5">{en.answer}</p>}
                    </td>
                    <td className="px-4 py-3 text-xs text-stone">{localeCount} {bi("locales", "种语言")}</td>
                    <td className="px-4 py-3">
                      {f.isActive ? (
                        <span className="bg-sage/10 text-sage px-2 py-1 text-[10px] uppercase tracking-wider">{bi("Active", "启用")}</span>
                      ) : (
                        <span className="bg-stone/10 text-stone px-2 py-1 text-[10px] uppercase tracking-wider">{bi("Hidden", "隐藏")}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-[10px]">
                        <Link href={`/admin/faq/${f.id}`} className="btn-outline px-2 py-1.5 inline-flex items-center gap-1">{bi("Edit", "编辑")}</Link>
                        <button
                          onClick={async () => {
                            if (!confirm(`${bi("Delete FAQ", "删除 FAQ")} "${en?.question || bi("this item", "该条目")}"?`)) return
                            const res = await fetch(`/api/admin/faqs/${f.id}`, { method: "DELETE" })
                            if (!res.ok) { toast.error(bi("Delete failed", "删除失败")); return }
                            toast.success(bi("FAQ deleted", "FAQ 已删除"))
                            load()
                          }}
                          className="text-rosegold hover:underline"
                        >
                          {bi("Delete", "删除")}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
