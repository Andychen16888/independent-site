"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { toast } from "react-hot-toast"

interface PageRow {
  id: string
  title: string
  slug: string
  excerpt: string | null
  isPublished: boolean
  updatedAt: string
}

export default function PageManager() {
  const [rows, setRows] = useState<PageRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/admin/pages", { cache: "no-store" })
      if (!res.ok) throw new Error("Failed to load pages")
      const data = await res.json()
      setRows(data.pages || [])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="heading-md">Pages</h1>
          <p className="text-body text-sm mt-1">{rows.length} pages — about, contact, shipping, privacy, terms, and any custom content.</p>
        </div>
        <Link href="/admin/pages/new" className="btn-primary text-xs">Add Page</Link>
      </div>

      {error && <div className="bg-rosegold/10 border border-rosegold/20 text-sm p-3 mb-6">{error}</div>}

      {loading ? (
        <div className="text-sm text-stone py-12 text-center">Loading pages...</div>
      ) : rows.length === 0 ? (
        <div className="bg-white border border-mist p-12 text-center text-sm text-stone">
          No pages yet. Click &ldquo;Add Page&rdquo; to get started.
        </div>
      ) : (
        <div className="bg-white border border-mist">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-mist text-left">
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">Page</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">URL</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">Status</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">Updated</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className="border-b border-mist/50 hover:bg-ivory/50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium">{p.title}</p>
                    {p.excerpt && <p className="text-xs text-stone truncate max-w-[360px]">{p.excerpt}</p>}
                  </td>
                  <td className="px-4 py-3 text-xs text-stone">/pages/{p.slug}</td>
                  <td className="px-4 py-3">
                    {p.isPublished ? (
                      <span className="bg-sage/10 text-sage px-2 py-1 text-[10px] uppercase tracking-wider">Published</span>
                    ) : (
                      <span className="bg-stone/10 text-stone px-2 py-1 text-[10px] uppercase tracking-wider">Draft</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-stone">{new Date(p.updatedAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 text-[10px]">
                      <Link href={`/admin/pages/${p.id}`} className="btn-outline px-2 py-1.5 inline-flex items-center gap-1">Edit</Link>
                      <button
                        onClick={async () => {
                          if (!confirm(`Delete page "${p.title}"?`)) return
                          const res = await fetch(`/api/admin/pages/${p.id}`, { method: "DELETE" })
                          if (!res.ok) { toast.error("Delete failed"); return }
                          toast.success("Page deleted")
                          load()
                        }}
                        className="text-rosegold hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}