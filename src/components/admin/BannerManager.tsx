"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { toast } from "react-hot-toast"
import { bi } from "@/components/admin/bilingual"
import { fetchJsonResponse, responseErrorMessage } from "@/lib/json-response"

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
      const { parsed, data } = await fetchJsonResponse<any>("/api/admin/banners", { cache: "no-store" })
      if (!parsed.ok) throw new Error(responseErrorMessage(parsed, bi("Failed to load banners", "加载横幅失败")))
      const payload = (data || {}) as any
      setRows(payload.banners || [])
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
          <h1 className="heading-md">{bi("Banners", "横幅")}</h1>
          <p className="text-body text-sm mt-1">{rows.length} {bi("banners — ordered by sort order on the homepage.", "个横幅，按排序值显示在首页。")}</p>
        </div>
        <Link href="/admin/banners/new" className="btn-primary text-xs">{bi("Add Banner", "添加横幅")}</Link>
      </div>

      {error && <div className="bg-rosegold/10 border border-rosegold/20 text-sm p-3 mb-6">{error}</div>}

      {loading ? (
        <div className="text-sm text-stone py-12 text-center">{bi("Loading banners...", "正在加载横幅...")}</div>
      ) : rows.length === 0 ? (
        <div className="bg-white border border-mist p-12 text-center text-sm text-stone">
          {bi("No banners yet. Click", "暂无横幅，点击")} &ldquo;{bi("Add Banner", "添加横幅")}&rdquo; {bi("to get started.", "开始创建。")}
        </div>
      ) : (
        <div className="space-y-4">
          {sorted.map((b) => (
            <div key={b.id} className={`bg-white border border-mist p-4 flex items-center gap-4 ${!b.isActive ? "opacity-60" : ""}`}>
              {b.image && <img src={b.image} alt={b.title} className="w-32 h-20 object-cover border border-mist" />}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{b.title}</p>
                  {!b.isActive && <span className="bg-rosegold/10 text-rosegold px-2 py-0.5 text-[10px] uppercase tracking-wider">{bi("Inactive", "停用")}</span>}
                  {b.eyebrow && <span className="text-xs text-stone">{b.eyebrow}</span>}
                </div>
                {b.subtitle && <p className="text-xs text-stone truncate">{b.subtitle}</p>}
                <p className="text-xs text-mist mt-1">{bi("Order", "排序")} {b.sortOrder}{b.link ? ` · ${b.link}` : ""}</p>
              </div>
              <div className="flex items-center gap-3 text-[10px] shrink-0">
                <Link href={`/admin/banners/${b.id}`} className="btn-outline px-3 py-1.5 inline-flex items-center gap-1">{bi("Edit", "编辑")}</Link>
                <button
                  onClick={async () => {
                    if (!confirm(`${bi("Delete banner", "删除横幅")} "${b.title}"?`)) return
                    const res = await fetch(`/api/admin/banners/${b.id}`, { method: "DELETE" })
                    if (!res.ok) { toast.error(bi("Delete failed", "删除失败")); return }
                    toast.success(bi("Banner deleted", "横幅已删除"))
                    load()
                  }}
                  className="text-rosegold hover:underline"
                >
                  {bi("Delete", "删除")}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
