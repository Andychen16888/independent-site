"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { toast } from "react-hot-toast"

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
      const res = await fetch("/api/admin/faqs", { cache: "no-store" })
      if (!res.ok) throw new Error("Failed to load FAQs")
      const data = await res.json()
      setRows(data.faqs || [])
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
          <h1 className="heading-md">FAQ</h1>
          <p className="text-body text-sm mt-1">{rows.length} FAQs — each item is stored in English plus translations for all locale pages.</p>
        </div>
        <Link href="/admin/faq/new" className="btn-primary text-xs">Add FAQ</Link>
      </div>

      {error && <div className="bg-rosegold/10 border border-rosegold/20 text-sm p-3 mb-6">{error}</div>}

      {loading ? (
        <div className="text-sm text-stone py-12 text-center">Loading FAQs...</div>
      ) : rows.length === 0 ? (
        <div className="bg-white border border-mist p-12 text-center text-sm text-stone">
          No FAQs yet. Click &ldquo;Add FAQ&rdquo; to get started.
        </div>
      ) : (
        <div className="bg-white border border-mist">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-mist text-left">
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">Order</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">Question</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">Translations</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">Status</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">Actions</th>
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
                    <td className="px-4 py-3 text-xs text-stone">{localeCount} locales</td>
                    <td className="px-4 py-3">
                      {f.isActive ? (
                        <span className="bg-sage/10 text-sage px-2 py-1 text-[10px] uppercase tracking-wider">Active</span>
                      ) : (
                        <span className="bg-stone/10 text-stone px-2 py-1 text-[10px] uppercase tracking-wider">Hidden</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-[10px]">
                        <Link href={`/admin/faq/${f.id}`} className="btn-outline px-2 py-1.5 inline-flex items-center gap-1">Edit</Link>
                        <button
                          onClick={async () => {
                            if (!confirm(`Delete FAQ "${en?.question || "this item"}"?`)) return
                            const res = await fetch(`/api/admin/faqs/${f.id}`, { method: "DELETE" })
                            if (!res.ok) { toast.error("Delete failed"); return }
                            toast.success("FAQ deleted")
                            load()
                          }}
                          className="text-rosegold hover:underline"
                        >
                          Delete
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