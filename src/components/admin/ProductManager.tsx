"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { formatPrice } from "@/lib/utils/format"
import { bi } from "@/components/admin/bilingual"

interface ProductRow {
  id: string
  name: string
  slug: string
  sku: string | null
  brand: string | null
  model: string | null
  unitPrice: number | null
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
      if (!res.ok) throw new Error(bi("Failed to load products", "加载产品失败"))
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
      if (!res.ok) throw new Error(bi("Batch operation failed", "批量操作失败"))
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
      if (!res.ok) throw new Error(bi("Operation failed", "操作失败"))
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
    const text = deleted
      ? bi("Deleted", "已删除")
      : status === "ACTIVE"
        ? bi("Active", "在售")
        : status === "DRAFT"
          ? bi("Draft", "草稿")
          : status === "INACTIVE"
            ? bi("Inactive", "下架")
            : status === "ARCHIVED"
              ? bi("Archived", "归档")
              : status
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
          <h1 className="heading-md">{bi("Products", "产品")}</h1>
          <p className="text-body text-sm mt-1">{total} {bi("match current filters.", "条符合当前筛选。")}</p>
        </div>
        <Link href="/admin/products/new" className="btn-primary text-xs">{bi("Add Product", "添加产品")}</Link>
      </div>

      {/* Filters */}
      <div className="bg-white border border-mist p-4 mb-6 flex flex-wrap items-center gap-3">
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") setPage(1) }}
          placeholder={bi("Search name / SKU / brand / model / tags...", "搜索名称 / SKU / 品牌 / 型号 / 标签...")}
          className={inputCls}
        />
        <button
          onClick={() => setPage(1)}
          className="px-3 py-2 bg-charcoal text-white text-xs tracking-wider uppercase disabled:opacity-50"
        >
          {bi("Search", "搜索")}
        </button>
        <select value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setPage(1) }} className={selectCls}>
          <option value="">{bi("All Categories", "全部分类")}</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }} className={selectCls}>
          <option value="">{bi("All Statuses", "全部状态")}</option>
          <option value="ACTIVE">{bi("Active", "在售")}</option>
          <option value="DRAFT">{bi("Draft", "草稿")}</option>
          <option value="INACTIVE">{bi("Inactive", "下架")}</option>
          <option value="ARCHIVED">{bi("Archived", "归档")}</option>
        </select>
        <select value={featured} onChange={(e) => { setFeatured(e.target.value); setPage(1) }} className={selectCls}>
          <option value="">{bi("Featured: All", "推荐：全部")}</option>
          <option value="featured">{bi("Featured only", "仅推荐")}</option>
          <option value="home">{bi("Homepage picks only", "仅首页精选")}</option>
        </select>
        <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1) }} className={selectCls}>
          <option value="newest">{bi("Newest", "最新")}</option>
          <option value="oldest">{bi("Oldest", "最早")}</option>
          <option value="price-asc">{bi("Price: Low–High", "价格：低到高")}</option>
          <option value="price-desc">{bi("Price: High–Low", "价格：高到低")}</option>
          <option value="stock">{bi("Stock low first", "库存低优先")}</option>
          <option value="updated">{bi("Recently updated", "最近更新")}</option>
        </select>
        <label className="flex items-center gap-2 text-xs cursor-pointer ml-auto">
          <input type="checkbox" checked={includeDeleted} onChange={(e) => { setIncludeDeleted(e.target.checked); setPage(1) }} className="w-4 h-4" />
          {bi("Include deleted", "包含已删除")}
        </label>
        <button onClick={resetFilters} className="text-xs text-stone hover:text-charcoal">{bi("Reset", "重置")}</button>
      </div>

      {error && <div className="bg-rosegold/10 border border-rosegold/20 text-sm p-3 mb-6">{error}</div>}

      {/* Batch toolbar */}
      {selected.length > 0 && (
        <div className="bg-charcoal text-white text-xs px-4 py-3 mb-4 flex flex-wrap items-center gap-3">
          <span>{selected.length} {bi("selected", "已选")}</span>
          <button onClick={() => runBatch("activate")} className="hover:underline disabled:opacity-50" disabled={busy}>{bi("Activate", "启用")}</button>
          <button onClick={() => runBatch("deactivate")} className="hover:underline disabled:opacity-50" disabled={busy}>{bi("Deactivate", "停用")}</button>
          <button onClick={() => runBatch("feature")} className="hover:underline disabled:opacity-50" disabled={busy}>{bi("Feature", "推荐")}</button>
          <button onClick={() => runBatch("unfeature")} className="hover:underline disabled:opacity-50" disabled={busy}>{bi("Unfeature", "取消推荐")}</button>
          {includeDeleted ? (
              <button onClick={() => runBatch("restore")} className="hover:underline disabled:opacity-50" disabled={busy}>{bi("Restore", "恢复")}</button>
            ) : (
              <button onClick={() => runBatch("delete", `${bi("Delete", "删除")} ${selected.length} ${bi("product(s)?", "个产品？")} ${bi("This hides them from the storefront and order history stays intact.", "删除后前台将隐藏，订单历史保持不变。")}`)} className="hover:underline text-rosegold disabled:opacity-50" disabled={busy}>{bi("Delete", "删除")}</button>
            )}
          <button onClick={() => setSelected([])} className="ml-auto hover:underline">{bi("Clear", "清空")}</button>
        </div>
      )}

      {loading ? (
        <div className="text-sm text-stone py-12 text-center">{bi("Loading products...", "正在加载产品...")}</div>
      ) : rows.length === 0 ? (
        <div className="bg-white border border-mist p-12 text-center text-sm text-stone">
          {bi("No products found.", "未找到产品。")} {includeDeleted ? bi("Turn off Include deleted to hide deleted items, or", "关闭“包含已删除”可隐藏删除项，或") : bi("Try changing filters or click", "请调整筛选条件或点击")} &ldquo;{bi("Add Product", "添加产品")}&rdquo; {bi("to create one.", "来创建。")}
        </div>
      ) : (
        <div className="bg-white border border-mist overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-mist text-left">
                <th className="px-4 py-3 w-8">
                  <input type="checkbox" checked={selected.length === rows.length && rows.length > 0} onChange={toggleAll} className="w-4 h-4" />
                </th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">{bi("Product", "产品")}</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">SKU</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">{bi("Categories", "分类")}</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">{bi("Price", "价格")}</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">{bi("Stock", "库存")}</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">{bi("Flags", "标记")}</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">{bi("Status", "状态")}</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">{bi("Actions", "操作")}</th>
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
                    {p.unitPrice == null ? (
                      <span className="text-stone text-xs">{bi("On request", "面议")}</span>
                    ) : p.originalPrice ? (
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
                      {p.isFeatured && <span className="text-rosegold">{bi("Featured", "推荐")}</span>}
                      {p.isHomeFeatured && <span className="text-sage">{bi("Home", "首页")}</span>}
                      {!p.isFeatured && !p.isHomeFeatured && <span className="text-mist">—</span>}
                    </span>
                  </td>
                  <td className="px-4 py-3">{statusBadge(p.status, Boolean(p.deletedAt))}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 text-[10px]">
                      <Link href={`/admin/products/${p.id}`} className="btn-outline flex-1 px-2 py-1.5 inline-flex items-center justify-center gap-1">{bi("Edit", "编辑")}</Link>
                      {p.deletedAt ? (
                        <button onClick={() => singleAction([p.id], "restore")} className="text-sage hover:underline" disabled={busy}>{bi("Restore", "恢复")}</button>
                      ) : (
                        <button
                          onClick={() => singleAction([p.id], "delete", `${bi("Delete", "删除")} "${p.name}"? ${bi("It will be hidden from the storefront (order history stays intact).", "删除后前台将隐藏（订单历史保持不变）。")}`)}
                          className="text-rosegold hover:underline"
                          disabled={busy}
                        >
                          {bi("Delete", "删除")}
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
            {bi("Prev", "上一页")}
          </button>
          <span className="text-stone text-xs">{bi("Page", "第")} {page} {bi("of", "页，共")} {totalPages} ({total} {bi("items", "项")})</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-3 py-2 border border-mist hover:border-charcoal disabled:opacity-40 disabled:cursor-not-allowed text-xs"
          >
            {bi("Next", "下一页")}
          </button>
        </div>
      )}
    </div>
  )
}
