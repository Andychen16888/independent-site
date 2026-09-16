"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { toast } from "react-hot-toast"

interface BannerRow {
  id: string
  title: string
  subtitle: string | null
  eyebrow: string | null
  image: string
  link: string | null
  sortOrder: number
  isActive: boolean
}

export default function BannerManager() {
  const [rows, setRows] = useState<BannerRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/admin/banners", { cache: "no-store" })
      if (!res.ok) throw new Error("Failed to load banners")
      const data = await res.json()
      setRows(data.banners || [])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const sorted = [...rows].sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="heading-md">Banners</h1>
          <p className="text-body text-sm mt-1">{rows.length} banners — ordered by sort order on the homepage.</p>
        </div>
        <Link href="/admin/banners/new" className="btn-primary text-xs">Add Banner</Link>
      </div>

      {error && <div className="bg-rosegold/10 border border-rosegold/20 text-sm p-3 mb-6">{error}</div>}

      {loading ? (
        <div className="text-sm text-stone py-12 text-center">Loading banners...</div>
      ) : rows.length === 0 ? (
        <div className="bg-white border border-mist p-12 text-center text-sm text-stone">
          No banners yet. Click &ldquo;Add Banner&rdquo; to get started.
        </div>
      ) : (
        <div className="space-y-4">
          {sorted.map((b) => (
            <div key={b.id} className={`bg-white border border-mist p-4 flex items-center gap-4 ${!b.isActive ? "opacity-60" : ""}`}>
              {b.image && <img src={b.image} alt={b.title} className="w-32 h-20 object-cover border border-mist" />}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{b.title}</p>
                  {!b.isActive && <span className="bg-rosegold/10 text-rosegold px-2 py-0.5 text-[10px] uppercase tracking-wider">Inactive</span>}
                  {b.eyebrow && <span className="text-xs text-stone">{b.eyebrow}</span>}
                </div>
                {b.subtitle && <p className="text-xs text-stone truncate">{b.subtitle}</p>}
                <p className="text-xs text-mist mt-1">Order {b.sortOrder}{b.link ? ` · ${b.link}` : ""}</p>
              </div>
              <div className="flex items-center gap-3 text-[10px] shrink-0">
                <Link href={`/admin/banners/${b.id}`} className="btn-outline px-3 py-1.5 inline-flex items-center gap-1">Edit</Link>
                <button
                  onClick={async () => {
                    if (!confirm(`Delete banner "${b.title}"?`)) return
                    const res = await fetch(`/api/admin/banners/${b.id}`, { method: "DELETE" })
                    if (!res.ok) { toast.error("Delete failed"); return }
                    toast.success("Banner deleted")
                    load()
                  }}
                  className="text-rosegold hover:underline"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}