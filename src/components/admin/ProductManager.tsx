"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { formatPrice } from "@/lib/utils/format"

interface ProductRow {
  id: string
  name: string
  slug: string
  sku: string | null
  brand: string | null
  model: string | null
  unitPrice: number
  originalPrice: number | null
  stock: number
  status: string
  isFeatured: boolean
  isHomeFeatured: boolean
  deletedAt: string | null
  updatedAt: string
  images: { url: string; alt: string }[]
  categories: { category: { id: string; name: string; slug: string } }[]
}

interface CatOption { id: string; name: string; slug: string }

const PAGE_SIZE = 20

export default function ProductManager() {
  const [rows, setRows] = useState<ProductRow[]>([])
  const [categories, setCategories] = useState<CatOption[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [status, setStatus] = useState("")
  const [featured, setFeatured] = useState("")
  const [includeDeleted, setIncludeDeleted] = useState(false)
  const [sort, setSort] = useState("newest")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selected, setSelected] = useState<string[]>([])
  const [busy, setBusy] = useState(false)

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE), sort })
      if (searchInput.trim()) params.set("q", searchInput.trim())
      if (categoryId) params.set("categoryId", categoryId)
      if (status) params.set("status", status)
      if (featured === "featured") params.set("isFeatured", "true")
      if (featured === "home") params.set("isHomeFeatured", "true")
      if (includeDeleted) params.set("includeDeleted", "true")
      const res = await fetch(`/api/admin/products?${params}`, { cache: "no-store" })
      if (!res.ok) throw new Error("Failed to load products")
      const data = await res.json()
      setRows(data.products || [])
      setTotal(data.pagination?.total ?? 0)
      setSelected((prev) => prev.filter((id) => data.products?.some((p: ProductRow) => p.id === id)))
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [page, searchInput, categoryId, status, featured, sort, includeDeleted])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    fetch("/api/admin/categories", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setCategories(d.categories || []))
      .catch(() => {})
  }, [])

  const toggleAll = () => {
    setSelected(selected.length === rows.length ? [] : rows.map((r) => r.id))
  }

  const toggleOne = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const runBatch = async (action: string, confirmMessage?: string) => {
    if (selected.length === 0) return
    if (confirmMessage && !confirm(confirmMessage)) return
    setBusy(true)
    try {
      const res = await fetch("/api/admin/products/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selected, action }),
      })
      if (!res.ok) throw new Error("Batch operation failed")
      setSelected([])
      load()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  const singleAction = async (ids: string[], action: string, confirmMessage?: string) => {
    if (confirmMessage && !confirm(confirmMessage)) return
    setBusy(true)
    try {
      const res = await fetch("/api/admin/products/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, action }),
      })
      if (!res.ok) throw new Error("Operation failed")
      load()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  const resetFilters = () => {
    setSearchInput("")
    setCategoryId("")
    setStatus("")
    setFeatured("")
    setIncludeDeleted(false)
    setSort("newest")
    setPage(1)
  }

  const statusBadge = (status: string, deleted: boolean) => {
    const text = deleted ? "DELETED" : status
    const cls =
      status === "ACTIVE" ? "bg-sage/10 text-sage"
        : status === "DRAFT" ? "bg-stone/10 text-stone"
        : "bg-rosegold/10 text-rosegold"
    return <span className={`text-[10px] uppercase tracking-wider px-2 py-1 ${cls}`}>{text}</span>
  }

  const selectCls = "border border-mist bg-white px-3 py-2 text-xs outline-none focus:border-charcoal transition-colors"
  const inputCls = "border border-mist bg-white px-3 py-2 text-xs outline-none focus:border-charcoal transition-colors w-64"

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="heading-md">Products</h1>
          <p className="text-body text-sm mt-1">{total} match current filters.</p>
        </div>
        <Link href="/admin/products/new" className="btn-primary text-xs">Add Product</Link>
      </div>

      {/* Filters */}
      <div className="bg-white border border-mist p-4 mb-6 flex flex-wrap items-center gap-3">
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") setPage(1) }}
          placeholder="Search name / SKU / brand / model / tags..."
          className={inputCls}
        />
        <button
          onClick={() => setPage(1)}
          className="px-3 py-2 bg-charcoal text-white text-xs tracking-wider uppercase disabled:opacity-50"
        >
          Search
        </button>
        <select value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setPage(1) }} className={selectCls}>
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }} className={selectCls}>
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="DRAFT">Draft</option>
          <option value="INACTIVE">Inactive</option>
          <option value="ARCHIVED">Archived</option>
        </select>
        <select value={featured} onChange={(e) => { setFeatured(e.target.value); setPage(1) }} className={selectCls}>
          <option value="">Featured: All</option>
          <option value="featured">Featured only</option>
          <option value="home">Homepage picks only</option>
        </select>
        <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1) }} className={selectCls}>
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="price-asc">Price: Low–High</option>
          <option value="price-desc">Price: High–Low</option>
          <option value="stock">Stock low first</option>
          <option value="updated">Recently updated</option>
        </select>
        <label className="flex items-center gap-2 text-xs cursor-pointer ml-auto">
          <input type="checkbox" checked={includeDeleted} onChange={(e) => { setIncludeDeleted(e.target.checked); setPage(1) }} className="w-4 h-4" />
          Include deleted
        </label>
        <button onClick={resetFilters} className="text-xs text-stone hover:text-charcoal">Reset</button>
      </div>

      {error && <div className="bg-rosegold/10 border border-rosegold/20 text-sm p-3 mb-6">{error}</div>}

      {/* Batch toolbar */}
      {selected.length > 0 && (
        <div className="bg-charcoal text-white text-xs px-4 py-3 mb-4 flex flex-wrap items-center gap-3">
          <span>{selected.length} selected</span>
          <button onClick={() => runBatch("activate")} className="hover:underline disabled:opacity-50" disabled={busy}>Activate</button>
          <button onClick={() => runBatch("deactivate")} className="hover:underline disabled:opacity-50" disabled={busy}>Deactivate</button>
          <button onClick={() => runBatch("feature")} className="hover:underline disabled:opacity-50" disabled={busy}>Feature</button>
          <button onClick={() => runBatch("unfeature")} className="hover:underline disabled:opacity-50" disabled={busy}>Unfeature</button>
          {includeDeleted ? (
            <button onClick={() => runBatch("restore")} className="hover:underline disabled:opacity-50" disabled={busy}>Restore</button>
          ) : (
            <button onClick={() => runBatch("delete", `Delete ${selected.length} product(s)? This hides them from the storefront and order history stays intact.`)} className="hover:underline text-rosegold disabled:opacity-50" disabled={busy}>Delete</button>
          )}
          <button onClick={() => setSelected([])} className="ml-auto hover:underline">Clear</button>
        </div>
      )}

      {loading ? (
        <div className="text-sm text-stone py-12 text-center">Loading products...</div>
      ) : rows.length === 0 ? (
        <div className="bg-white border border-mist p-12 text-center text-sm text-stone">
          No products found. {includeDeleted ? "Move the &ldquo;Include deleted&rdquo; toggle to hide deleted items, or" : "Try changing filters or click"} &ldquo;Add Product&rdquo; to create one.
        </div>
      ) : (
        <div className="bg-white border border-mist overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-mist text-left">
                <th className="px-4 py-3 w-8">
                  <input type="checkbox" checked={selected.length === rows.length && rows.length > 0} onChange={toggleAll} className="w-4 h-4" />
                </th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">Product</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">SKU</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">Categories</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">Price</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">Stock</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">Flags</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">Status</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className={`border-b border-mist/50 hover:bg-ivory/50 transition-colors ${p.deletedAt ? "opacity-50" : ""}`}>
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selected.includes(p.id)} onChange={() => toggleOne(p.id)} className="w-4 h-4" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.images[0] && <img src={p.images[0].url} alt="" className="w-10 h-10 object-cover" />}
                      <div className="min-w-0">
                        <p className="font-medium truncate max-w-[220px]">{p.name}</p>
                        <p className="text-xs text-stone truncate max-w-[220px]">{p.brand}{p.brand && p.model ? " · " : ""}{p.model}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-stone text-xs">{p.sku}</td>
                  <td className="px-4 py-3 text-xs text-stone max-w-[160px] truncate">
                    {p.categories.map((c) => c.category.name).slice(0, 2).join(", ")}
                  </td>
                  <td className="px-4 py-3">
                    {p.originalPrice ? (
                      <span>
                        <span className="text-stone line-through mr-1 text-xs">{formatPrice(Number(p.originalPrice))}</span>
                        {formatPrice(Number(p.unitPrice))}
                      </span>
                    ) : formatPrice(Number(p.unitPrice))}
                  </td>
                  <td className="px-4 py-3">
                    <span className={p.stock > 0 ? "text-sage" : "text-rosegold"}>{p.stock}</span>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <span className="flex gap-1">
                      {p.isFeatured && <span className="text-rosegold">Featured</span>}
                      {p.isHomeFeatured && <span className="text-sage">Home</span>}
                      {!p.isFeatured && !p.isHomeFeatured && <span className="text-mist">—</span>}
                    </span>
                  </td>
                  <td className="px-4 py-3">{statusBadge(p.status, Boolean(p.deletedAt))}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 text-[10px]">
                      <Link href={`/admin/products/${p.id}`} className="btn-outline flex-1 px-2 py-1.5 inline-flex items-center justify-center gap-1">Edit</Link>
                      {p.deletedAt ? (
                        <button onClick={() => singleAction([p.id], "restore")} className="text-sage hover:underline" disabled={busy}>Restore</button>
                      ) : (
                        <button
                          onClick={() => singleAction([p.id], "delete", `Delete "${p.name}"? It will be hidden from the storefront (order history stays intact).`)}
                          className="text-rosegold hover:underline"
                          disabled={busy}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-6 text-sm">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-2 border border-mist hover:border-charcoal disabled:opacity-40 disabled:cursor-not-allowed text-xs"
          >
            Prev
          </button>
          <span className="text-stone text-xs">Page {page} of {totalPages} ({total} items)</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-3 py-2 border border-mist hover:border-charcoal disabled:opacity-40 disabled:cursor-not-allowed text-xs"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}