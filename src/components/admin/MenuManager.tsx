"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { toast } from "react-hot-toast"

interface MenuRow {
  id: string
  label: string
  url: string
  parentId: string | null
  sortOrder: number
  isActive: boolean
  children?: MenuRow[]
}

export default function MenuManager() {
  const [rows, setRows] = useState<MenuRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/admin/menus", { cache: "no-store" })
      if (!res.ok) throw new Error("Failed to load menus")
      const data = await res.json()
      setRows(data.menus || [])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const sorted = [...rows].sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label))
  const topLevel = sorted.filter((m) => !m.parentId)

  const renderRow = (m: MenuRow, depth: number): React.ReactNode => [
    <tr key={m.id} className="border-b border-mist/50 hover:bg-ivory/50 transition-colors">
      <td className="px-4 py-3">
        <div style={{ paddingLeft: depth * 20 }}>
          <p className="font-medium">{m.label}</p>
          <p className="text-xs text-stone">{m.url}</p>
        </div>
      </td>
      <td className="px-4 py-3 text-xs text-stone">{m.sortOrder}</td>
      <td className="px-4 py-3">
        {m.isActive ? (
          <span className="bg-sage/10 text-sage px-2 py-1 text-[10px] uppercase tracking-wider">Active</span>
        ) : (
          <span className="bg-rosegold/10 text-rosegold px-2 py-1 text-[10px] uppercase tracking-wider">Inactive</span>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2 text-[10px]">
          <Link href={`/admin/menus/${m.id}`} className="btn-outline px-2 py-1.5 inline-flex items-center gap-1">Edit</Link>
          <button
            onClick={async () => {
              if (!confirm(`Delete menu item "${m.label}"?`)) return
              const res = await fetch(`/api/admin/menus/${m.id}`, { method: "DELETE" })
              const data = await res.json()
              if (!res.ok) {
                toast.error(data.error || "Delete failed")
                return
              }
              toast.success("Item deleted")
              load()
            }}
            className="text-rosegold hover:underline"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>,
    (m.children || [])
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((child) => renderRow(child, depth + 1)),
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="heading-md">Navigation Menu</h1>
          <p className="text-body text-sm mt-1">{rows.length} menu items — ordered by sort order in the storefront header.</p>
        </div>
        <Link href="/admin/menus/new" className="btn-primary text-xs">Add Menu Item</Link>
      </div>

      {error && <div className="bg-rosegold/10 border border-rosegold/20 text-sm p-3 mb-6">{error}</div>}

      {loading ? (
        <div className="text-sm text-stone py-12 text-center">Loading menu...</div>
      ) : rows.length === 0 ? (
        <div className="bg-white border border-mist p-12 text-center text-sm text-stone">
          No menu items yet. Click &ldquo;Add Menu Item&rdquo; to build the navigation.
        </div>
      ) : (
        <div className="bg-white border border-mist">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-mist text-left">
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">Item</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">Order</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">Status</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>{topLevel.map((m) => renderRow(m, 0))}</tbody>
          </table>
        </div>
      )}
    </div>
  )
}