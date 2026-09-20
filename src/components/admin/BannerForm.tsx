"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "react-hot-toast"
import ImageUploader from "@/components/admin/ImageUploader"
import { bi } from "@/components/admin/bilingual"

export default function BannerForm({ mode, bannerId }: { mode: "new" | "edit"; bannerId?: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(mode === "edit")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [notFound, setNotFound] = useState(false)
  const [form, setForm] = useState({
    title: "", subtitle: "", eyebrow: "", description: "",
    ctaText: "", alignment: "left", image: "", link: "",
    sortOrder: "0", isActive: true,
  })

  useEffect(() => {
    if (mode !== "edit" || !bannerId) return
    fetch(`/api/admin/banners/${bannerId}`, { cache: "no-store" })
      .then(async (res) => {
        if (res.status === 404) { setNotFound(true); return }
        if (!res.ok) throw new Error(bi("Failed to load banner", "加载横幅失败"))
        const data = await res.json()
        const b = data.banner
        setForm({
          title: b.title, subtitle: b.subtitle || "", eyebrow: b.eyebrow || "",
          description: b.description || "", ctaText: b.ctaText || "",
          alignment: b.alignment || "left", image: b.image, link: b.link || "",
          sortOrder: String(b.sortOrder ?? 0), isActive: b.isActive !== false,
        })
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [mode, bannerId])

  const update = (patch: Partial<typeof form>) => setForm((prev) => ({ ...prev, ...patch }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError("")
    try {
      const url = mode === "edit" ? `/api/admin/banners/${bannerId}` : "/api/admin/banners"
      const res = await fetch(url, {
        method: mode === "edit" ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, sortOrder: form.sortOrder !== "" ? form.sortOrder : 0 }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || bi("Failed to save banner", "保存横幅失败"))
      toast.success(mode === "edit" ? bi("Banner updated", "横幅已更新") : bi("Banner created", "横幅已创建"))
      router.push("/admin/banners")
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="text-sm text-stone p-8">{bi("Loading banner...", "正在加载横幅...")}</div>
  if (notFound) return <div className="text-sm text-rosegold p-8">{bi("Banner not found.", "未找到横幅。")}</div>

  const input = "w-full border border-mist bg-white px-3 py-2 text-sm outline-none focus:border-charcoal transition-colors"
  const label = "block text-xs uppercase tracking-wider text-stone font-medium mb-1.5"

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      {error && <div className="bg-rosegold/10 border border-rosegold/20 text-sm p-3">{error}</div>}

      <div>
        <label className={label}>{bi("Title *", "标题 *")}</label>
        <input value={form.title} onChange={(e) => update({ title: e.target.value })} required className={input} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={label}>{bi("Eyebrow", "上方短标题")}</label>
          <input value={form.eyebrow} onChange={(e) => update({ eyebrow: e.target.value })} placeholder={bi("Small overline text", "简短引导文字")} className={input} />
        </div>
        <div>
          <label className={label}>{bi("Subtitle", "副标题")}</label>
          <input value={form.subtitle} onChange={(e) => update({ subtitle: e.target.value })} className={input} />
        </div>
      </div>

      <div>
        <label className={label}>{bi("Description", "描述")}</label>
        <textarea value={form.description} onChange={(e) => update({ description: e.target.value })} rows={2} className={input} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={label}>{bi("CTA Text", "按钮文案")}</label>
          <input value={form.ctaText} onChange={(e) => update({ ctaText: e.target.value })} placeholder={bi("e.g. Shop Now", "例如：立即购买")} className={input} />
        </div>
        <div>
          <label className={label}>{bi("Link URL", "链接地址")}</label>
          <input value={form.link} onChange={(e) => update({ link: e.target.value })} placeholder="/products or https://..." className={input} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={label}>{bi("Text Alignment", "文字对齐")}</label>
          <select value={form.alignment} onChange={(e) => update({ alignment: e.target.value })} className={input}>
            <option value="left">{bi("Left", "左对齐")}</option>
            <option value="center">{bi("Center", "居中")}</option>
            <option value="right">{bi("Right", "右对齐")}</option>
          </select>
        </div>
        <div>
          <label className={label}>{bi("Sort Order", "排序")}</label>
          <input type="number" value={form.sortOrder} onChange={(e) => update({ sortOrder: e.target.value })} className={input} />
        </div>
      </div>

      <div>
        <label className={label}>{bi("Background Image *", "背景图 *")}</label>
        <ImageUploader value={form.image} onChange={(url) => update({ image: url })} />
      </div>

      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input type="checkbox" checked={form.isActive} onChange={(e) => update({ isActive: e.target.checked })} className="w-4 h-4" />
        {bi("Active", "启用")}
      </label>

      <div className="flex items-center gap-3 pt-4 border-t border-mist">
        <button type="submit" disabled={saving} className="btn-primary text-xs">
          {saving ? bi("Saving...", "保存中...") : mode === "edit" ? bi("Save Banner", "保存横幅") : bi("Create Banner", "创建横幅")}
        </button>
        <button type="button" onClick={() => router.push("/admin/banners")} className="text-xs text-stone hover:text-charcoal transition-colors">{bi("Cancel", "取消")}</button>
      </div>
    </form>
  )
}
