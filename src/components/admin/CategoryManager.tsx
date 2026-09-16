"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { toast } from "react-hot-toast"

interface CategoryRow {
  id: string
  name: string
  slug: string
  type: string
  parentId: string | null
  parent?: { name: string } | null
  image: string | null
  isActive: boolean
  isFeatured: boolean
  sortOrder: number
  _count: { products: number; children: number }
}

export default function CategoryManager() {
  const [rows, setRows] = useState<CategoryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/admin/categories", { cache: "no-store" })
      if (!res.ok) throw new Error("Failed to load categories")
      const data = await res.json()
      setRows(data.categories || [])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const sorted = [...rows].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
  const topLevel = sorted.filter((c) => !c.parentId)

  const renderRow = (c: CategoryRow, depth: number): React.ReactNode => [
    <tr key={c.id} className="border-b border-mist/50 hover:bg-ivory/50 transition-colors">
        <td className="px-4 py-3">
          <div className="flex items-center gap-3" style={{ paddingLeft: depth * 20 }}>
            {c.image ? (
              <img src={c.image} alt="" className="w-8 h-8 object-cover border border-mist" />
            ) : (
              <span className="w-8 h-8 border border-mist inline-flex items-center justify-center text-[10px] text-stone bg-ivory/50">{c.name[0]}</span>
            )}
            <div>
              <p className="font-medium">{c.name}</p>
              <p className="text-xs text-stone">/{c.slug}</p>
            </div>
          </div>
        </td>
        <td className="px-4 py-3 text-xs">{c.type}</td>
        <td className="px-4 py-3 text-xs text-stone">{c._count.children} sub / {c._count.products} products</td>
        <td className="px-4 py-3 text-xs">
          <span className="flex gap-1">
            {c.isFeatured && <span className="text-rosegold">Featured</span>}
            {!c.isFeatured && !c.parentId && <span className="text-mist">—</span>}
          </span>
        </td>
        <td className="px-4 py-3 text-xs">
          {c.isActive ? <span className="bg-sage/10 text-sage px-2 py-1 text-[10px] uppercase tracking-wider">Active</span>
            : <span className="bg-rosegold/10 text-rosegold px-2 py-1 text-[10px] uppercase tracking-wider">Inactive</span>}
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2 text-[10px]">
            <Link href={`/admin/categories/${c.id}`} className="btn-outline px-2 py-1.5 inline-flex items-center gap-1">Edit</Link>
            <button
              onClick={async () => {
                if (!confirm(`Delete "${c.name}"?`)) return
                const res = await fetch(`/api/admin/categories/${c.id}`, { method: "DELETE" })
                const data = await res.json()
                if (!res.ok) {
                  if (data.code === "CATEGORY_HAS_PRODUCTS") toast.error(`Cannot delete: ${data.productCount} product(s) still assigned.`)
                  else if (data.code === "CATEGORY_HAS_CHILDREN") toast.error(`Cannot delete: ${data.childCount} child category(ies) still exist.`)
                  else toast.error(data.error || "Delete failed")
                  return
                }
                toast.success("Category deleted")
                load()
              }}
              className="text-rosegold hover:underline"
            >
              Delete
            </button>
          </div>
        </td>
      </tr>,
      sorted
        .filter((child) => child.parentId === c.id)
        .map((child) => renderRow(child, depth + 1)),
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="heading-md">Categories</h1>
          <p className="text-body text-sm mt-1">{rows.length} categories — support multiple levels via parent selection.</p>
        </div>
        <Link href="/admin/categories/new" className="btn-primary text-xs">Add Category</Link>
      </div>

      {error && <div className="bg-rosegold/10 border border-rosegold/20 text-sm p-3 mb-6">{error}</div>}

      {loading ? (
        <div className="text-sm text-stone py-12 text-center">Loading categories...</div>
      ) : rows.length === 0 ? (
        <div className="bg-white border border-mist p-12 text-center text-sm text-stone">
          No categories yet. Click &ldquo;Add Category&rdquo; to get started.
        </div>
      ) : (
        <div className="bg-white border border-mist overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-mist text-left">
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">Category</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">Type</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">Contents</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">Flags</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">Status</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>{topLevel.map((c) => renderRow(c, 0))}</tbody>
          </table>
        </div>
      )}
    </div>
  )
}