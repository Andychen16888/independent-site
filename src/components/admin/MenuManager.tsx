"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { toast } from "react-hot-toast"
import { bi } from "@/components/admin/bilingual"

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
      if (!res.ok) throw new Error(bi("Failed to load menus", "加载菜单失败"))
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
          <span className="bg-sage/10 text-sage px-2 py-1 text-[10px] uppercase tracking-wider">{bi("Active", "启用")}</span>
        ) : (
          <span className="bg-rosegold/10 text-rosegold px-2 py-1 text-[10px] uppercase tracking-wider">{bi("Inactive", "停用")}</span>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2 text-[10px]">
          <Link href={`/admin/menus/${m.id}`} className="btn-outline px-2 py-1.5 inline-flex items-center gap-1">{bi("Edit", "编辑")}</Link>
          <button
            onClick={async () => {
              if (!confirm(`${bi("Delete menu item", "删除菜单项")} "${m.label}"?`)) return
              const res = await fetch(`/api/admin/menus/${m.id}`, { method: "DELETE" })
              const data = await res.json()
              if (!res.ok) {
                toast.error(data.error || bi("Delete failed", "删除失败"))
                return
              }
              toast.success(bi("Item deleted", "菜单项已删除"))
              load()
            }}
            className="text-rosegold hover:underline"
          >
            {bi("Delete", "删除")}
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
          <h1 className="heading-md">{bi("Navigation Menu", "导航菜单")}</h1>
          <p className="text-body text-sm mt-1">{rows.length} {bi("menu items — ordered by sort order in the storefront header.", "个菜单项，按排序值显示在前台头部。")}</p>
        </div>
        <Link href="/admin/menus/new" className="btn-primary text-xs">{bi("Add Menu Item", "添加菜单项")}</Link>
      </div>

      {error && <div className="bg-rosegold/10 border border-rosegold/20 text-sm p-3 mb-6">{error}</div>}

      {loading ? (
        <div className="text-sm text-stone py-12 text-center">{bi("Loading menu...", "正在加载菜单...")}</div>
      ) : rows.length === 0 ? (
        <div className="bg-white border border-mist p-12 text-center text-sm text-stone">
          {bi("No menu items yet. Click", "暂无菜单项，点击")} &ldquo;{bi("Add Menu Item", "添加菜单项")}&rdquo; {bi("to build the navigation.", "开始构建导航。")}
        </div>
      ) : (
        <div className="bg-white border border-mist">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-mist text-left">
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">{bi("Item", "菜单项")}</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">{bi("Order", "排序")}</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">{bi("Status", "状态")}</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">{bi("Actions", "操作")}</th>
              </tr>
            </thead>
            <tbody>{topLevel.map((m) => renderRow(m, 0))}</tbody>
          </table>
        </div>
      )}
    </div>
  )
}
