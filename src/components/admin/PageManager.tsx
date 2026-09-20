"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { toast } from "react-hot-toast"
import { bi } from "@/components/admin/bilingual"

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
      if (!res.ok) throw new Error(bi("Failed to load pages", "加载页面失败"))
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
          <h1 className="heading-md">{bi("Pages", "页面")}</h1>
          <p className="text-body text-sm mt-1">{rows.length} {bi("pages — about, contact, shipping, privacy, terms, and any custom content.", "个页面，可用于关于我们、联系信息、配送、隐私条款及自定义内容。")}</p>
        </div>
        <Link href="/admin/pages/new" className="btn-primary text-xs">{bi("Add Page", "添加页面")}</Link>
      </div>

      {error && <div className="bg-rosegold/10 border border-rosegold/20 text-sm p-3 mb-6">{error}</div>}

      {loading ? (
        <div className="text-sm text-stone py-12 text-center">{bi("Loading pages...", "正在加载页面...")}</div>
      ) : rows.length === 0 ? (
        <div className="bg-white border border-mist p-12 text-center text-sm text-stone">
          {bi("No pages yet. Click", "暂无页面，点击")} &ldquo;{bi("Add Page", "添加页面")}&rdquo; {bi("to get started.", "开始创建。")}
        </div>
      ) : (
        <div className="bg-white border border-mist">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-mist text-left">
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">{bi("Page", "页面")}</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">URL</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">{bi("Status", "状态")}</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">{bi("Updated", "更新时间")}</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">{bi("Actions", "操作")}</th>
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
                      <span className="bg-sage/10 text-sage px-2 py-1 text-[10px] uppercase tracking-wider">{bi("Published", "已发布")}</span>
                    ) : (
                      <span className="bg-stone/10 text-stone px-2 py-1 text-[10px] uppercase tracking-wider">{bi("Draft", "草稿")}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-stone">{new Date(p.updatedAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 text-[10px]">
                      <Link href={`/admin/pages/${p.id}`} className="btn-outline px-2 py-1.5 inline-flex items-center gap-1">{bi("Edit", "编辑")}</Link>
                      <button
                        onClick={async () => {
                          if (!confirm(`${bi("Delete page", "删除页面")} "${p.title}"?`)) return
                          const res = await fetch(`/api/admin/pages/${p.id}`, { method: "DELETE" })
                          if (!res.ok) { toast.error(bi("Delete failed", "删除失败")); return }
                          toast.success(bi("Page deleted", "页面已删除"))
                          load()
                        }}
                        className="text-rosegold hover:underline"
                      >
                        {bi("Delete", "删除")}
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
