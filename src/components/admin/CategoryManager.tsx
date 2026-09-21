"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { toast } from "react-hot-toast"
import { bi } from "@/components/admin/bilingual"

interface CategoryRow {
  id: string
  name: string
  slug: string
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
      if (!res.ok) throw new Error(bi("Failed to load categories", "加载分类失败"))
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
        <td className="px-4 py-3 text-xs text-stone">{c._count.children} sub / {c._count.products} products</td>
        <td className="px-4 py-3 text-xs">
          <span className="flex gap-1">
            {c.isFeatured && <span className="text-rosegold">{bi("Featured", "推荐")}</span>}
            {!c.isFeatured && !c.parentId && <span className="text-mist">—</span>}
          </span>
        </td>
        <td className="px-4 py-3 text-xs">
          {c.isActive ? <span className="bg-sage/10 text-sage px-2 py-1 text-[10px] uppercase tracking-wider">{bi("Active", "启用")}</span>
            : <span className="bg-rosegold/10 text-rosegold px-2 py-1 text-[10px] uppercase tracking-wider">{bi("Inactive", "停用")}</span>}
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2 text-[10px]">
            <Link href={`/admin/categories/${c.id}`} className="btn-outline px-2 py-1.5 inline-flex items-center gap-1">{bi("Edit", "编辑")}</Link>
            <button
              onClick={async () => {
                if (!confirm(`Delete "${c.name}"?`)) return
                const res = await fetch(`/api/admin/categories/${c.id}`, { method: "DELETE" })
                const data = await res.json()
                if (!res.ok) {
                  if (data.code === "CATEGORY_HAS_PRODUCTS") toast.error(`${bi("Cannot delete:", "无法删除：")}${data.productCount} ${bi("product(s) still assigned.", "个产品仍在该分类下。")}`)
                  else if (data.code === "CATEGORY_HAS_CHILDREN") toast.error(`${bi("Cannot delete:", "无法删除：")}${data.childCount} ${bi("child category(ies) still exist.", "个子分类仍存在。")}`)
                  else toast.error(data.error || bi("Delete failed", "删除失败"))
                  return
                }
                toast.success(bi("Category deleted", "分类已删除"))
                load()
              }}
              className="text-rosegold hover:underline"
            >
              {bi("Delete", "删除")}
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
          <h1 className="heading-md">{bi("Categories", "分类")}</h1>
          <p className="text-body text-sm mt-1">{rows.length} {bi("categories — support multiple levels via parent selection.", "个分类，可通过父级创建多层级。")}</p>
        </div>
        <Link href="/admin/categories/new" className="btn-primary text-xs">{bi("Add Category", "添加分类")}</Link>
      </div>

      {error && <div className="bg-rosegold/10 border border-rosegold/20 text-sm p-3 mb-6">{error}</div>}

      {loading ? (
        <div className="text-sm text-stone py-12 text-center">{bi("Loading categories...", "正在加载分类...")}</div>
      ) : rows.length === 0 ? (
        <div className="bg-white border border-mist p-12 text-center text-sm text-stone">
          {bi("No categories yet. Click", "暂无分类，点击")}&nbsp;&ldquo;{bi("Add Category", "添加分类")}&rdquo;&nbsp;{bi("to get started.", "开始创建。")}
        </div>
      ) : (
        <div className="bg-white border border-mist overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-mist text-left">
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">{bi("Category", "分类")}</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">{bi("Contents", "内容")}</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">{bi("Flags", "标记")}</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">{bi("Status", "状态")}</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">{bi("Actions", "操作")}</th>
              </tr>
            </thead>
            <tbody>{topLevel.map((c) => renderRow(c, 0))}</tbody>
          </table>
        </div>
      )}
    </div>
  )
}
