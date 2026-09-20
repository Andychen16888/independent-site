"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "react-hot-toast"
import { bi } from "@/components/admin/bilingual"
import { slugify } from "@/lib/utils/format"
import RichEditor from "@/components/admin/RichEditor"
import ImageUploader from "@/components/admin/ImageUploader"
import TranslationsEditor, { type TranslationFields } from "@/components/admin/TranslationsEditor"

export default function PageForm({ mode, pageId }: { mode: "new" | "edit"; pageId?: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(mode === "edit")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [notFound, setNotFound] = useState(false)
  const [form, setForm] = useState({
    title: "", slug: "", excerpt: "", content: "", coverImage: "",
    isPublished: false, seoTitle: "", seoDescription: "", seoKeywords: "",
  })
  const [translations, setTranslations] = useState<TranslationFields[]>([])

  useEffect(() => {
    if (mode !== "edit" || !pageId) return
    fetch(`/api/admin/pages/${pageId}`, { cache: "no-store" })
      .then(async (res) => {
        if (res.status === 404) { setNotFound(true); return }
        if (!res.ok) throw new Error(bi("Failed to load page", "加载页面失败"))
        const data = await res.json()
        const p = data.page
        setForm({
          title: p.title, slug: p.slug, excerpt: p.excerpt || "", content: p.content || "",
          coverImage: p.coverImage || "", isPublished: p.isPublished === true,
          seoTitle: p.seoTitle || "", seoDescription: p.seoDescription || "", seoKeywords: p.seoKeywords || "",
        })
        setTranslations(
          (p.translations || []).map((t: any) => ({
            locale: t.locale,
            title: t.title || "",
            excerpt: t.excerpt || "",
            content: t.content || "",
            seoTitle: t.seoTitle || "",
            seoDescription: t.seoDescription || "",
            seoKeywords: t.seoKeywords || "",
          }))
        )
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [mode, pageId])

  const update = (patch: Partial<typeof form>) => setForm((prev) => ({ ...prev, ...patch }))

  const handleTitle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target
    update({ title: value, ...(form.slug === "" ? { slug: slugify(value) } : {}) })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError("")
    try {
      const url = mode === "edit" ? `/api/admin/pages/${pageId}` : "/api/admin/pages"
      const res = await fetch(url, {
        method: mode === "edit" ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, coverImage: form.coverImage || null, translations }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || bi("Failed to save page", "保存页面失败"))
      toast.success(mode === "edit" ? bi("Page updated", "页面已更新") : bi("Page created", "页面已创建"))
      router.push("/admin/pages")
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="text-sm text-stone p-8">{bi("Loading page...", "正在加载页面...")}</div>
  if (notFound) return <div className="text-sm text-rosegold p-8">{bi("Page not found.", "未找到页面。")}</div>

  const input = "w-full border border-mist bg-white px-3 py-2 text-sm outline-none focus:border-charcoal transition-colors"
  const label = "block text-xs uppercase tracking-wider text-stone font-medium mb-1.5"

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      {error && <div className="bg-rosegold/10 border border-rosegold/20 text-sm p-3">{error}</div>}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={label}>{bi("Title *", "标题 *")}</label>
          <input value={form.title} onChange={handleTitle} required className={input} />
        </div>
        <div>
          <label className={label}>Slug</label>
          <input value={form.slug} onChange={(e) => update({ slug: e.target.value })} className={input} />
        </div>
      </div>

      <div>
          <label className={label}>{bi("Excerpt", "摘要")}</label>
        <textarea value={form.excerpt} onChange={(e) => update({ excerpt: e.target.value })} rows={2} className={input} />
      </div>

      <div>
          <label className={label}>{bi("Content *", "内容 *")}</label>
          <RichEditor value={form.content} onChange={(html) => update({ content: html })} placeholder={bi("Enter page content...", "请输入页面内容...")} minHeight={300} />
      </div>

      <div>
          <label className={label}>{bi("Cover Image", "封面图片")}</label>
        <ImageUploader value={form.coverImage} onChange={(url) => update({ coverImage: url })} />
      </div>

      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input type="checkbox" checked={form.isPublished} onChange={(e) => update({ isPublished: e.target.checked })} className="w-4 h-4" />
        {bi("Published (visible on the storefront)", "发布（前台可见）")}
      </label>

      <div className="border-t border-mist pt-6 space-y-4">
        <label className="block text-xs uppercase tracking-wider text-stone font-medium mb-1">SEO</label>
        <div>
          <label className={label}>{bi("SEO Title", "SEO 标题")}</label>
          <input value={form.seoTitle} onChange={(e) => update({ seoTitle: e.target.value })} className={input} />
        </div>
        <div>
          <label className={label}>{bi("SEO Description", "SEO 描述")}</label>
          <textarea value={form.seoDescription} onChange={(e) => update({ seoDescription: e.target.value })} rows={2} className={input} />
        </div>
        <div>
          <label className={label}>{bi("SEO Keywords", "SEO 关键词")}</label>
          <input value={form.seoKeywords} onChange={(e) => update({ seoKeywords: e.target.value })} className={input} />
        </div>
      </div>

      <div className="border-t border-mist pt-6 space-y-4">
        <label className="block text-xs uppercase tracking-wider text-stone font-medium mb-1">{bi("Translations", "多语言翻译")}</label>
        <TranslationsEditor value={translations} onChange={setTranslations} includeContent />
      </div>

      <div className="flex items-center gap-3 pt-4 border-t border-mist">
        <button type="submit" disabled={saving} className="btn-primary text-xs">
          {saving ? bi("Saving...", "保存中...") : mode === "edit" ? bi("Save Page", "保存页面") : bi("Create Page", "创建页面")}
        </button>
        <button type="button" onClick={() => router.push("/admin/pages")} className="text-xs text-stone hover:text-charcoal transition-colors">{bi("Cancel", "取消")}</button>
      </div>
    </form>
  )
}
