"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "react-hot-toast"
import { bi } from "@/components/admin/bilingual"
import { localeNames } from "@/i18n/routing"
import { slugify } from "@/lib/utils/format"
import { canonicalCategorySlug } from "@/lib/categories/slug"
import { fetchJsonOrThrow, fetchJsonResponse, responseErrorMessage } from "@/lib/json-response"
import ImageUploader from "@/components/admin/ImageUploader"

interface CatOption { id: string; name: string; slug: string; parentId: string | null }
const TRANS_LOCALES = Object.keys(localeNames).filter((l) => l !== "en")

export default function CategoryForm({ mode, categoryId }: { mode: "new" | "edit"; categoryId?: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(mode === "edit")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [notFound, setNotFound] = useState(false)
  const [categories, setCategories] = useState<CatOption[]>([])
  const [form, setForm] = useState({
    name: "", slug: "", parentId: "", sortOrder: "0",
    isActive: true, isFeatured: false,
    image: "", description: "",
    seoTitle: "", seoDescription: "", seoKeywords: "",
  })
  const [translations, setTranslations] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchJsonResponse<any>("/api/admin/categories", { cache: "no-store" })
      .then(({ parsed, data }) => {
        if (!parsed.ok) return
        const payload = (data || {}) as any
        setCategories((payload.categories || []).filter((c: any) => c.id !== categoryId))
      })
      .catch(() => {})
  }, [categoryId])

  useEffect(() => {
    if (mode !== "edit" || !categoryId) return
    fetchJsonResponse<any>(`/api/admin/categories/${categoryId}`, { cache: "no-store" })
      .then(({ res, parsed, data }) => {
        if (res.status === 404) { setNotFound(true); return }
        if (!parsed.ok) throw new Error(responseErrorMessage(parsed, bi("Failed to load category", "加载分类失败")))
        const payload = (data || {}) as any
        const c = payload.category
        setForm({
          name: c.name, slug: c.slug, parentId: c.parentId || "",
          sortOrder: String(c.sortOrder ?? 0),
          isActive: c.isActive !== false, isFeatured: c.isFeatured || false,
          image: c.image || "", description: c.description || "",
          seoTitle: c.seoTitle || "", seoDescription: c.seoDescription || "", seoKeywords: c.seoKeywords || "",
        })
        const nextTranslations: Record<string, string> = {}
        for (const t of c.translations || []) {
          if (t?.locale) nextTranslations[t.locale] = t.name || ""
        }
        setTranslations(nextTranslations)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [mode, categoryId])

  const update = (patch: Partial<typeof form>) => setForm((prev) => ({ ...prev, ...patch }))

  const handleName = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target
    update({ name: value, ...(form.slug === "" ? { slug: slugify(value) } : {}) })
  }

  // Slug must stay URL-safe: "LED Lighting" would otherwise be stored verbatim
  // and produce /categories/led%20lighting.
  const handleSlugBlur = () => {
    const canonical = canonicalCategorySlug(form.slug, form.name)
    if (canonical !== form.slug) update({ slug: canonical })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError("")
    try {
      const url = mode === "edit" ? `/api/admin/categories/${categoryId}` : "/api/admin/categories"
      await fetchJsonOrThrow(
        url,
        {
          method: mode === "edit" ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...form,
            parentId: form.parentId || null,
            sortOrder: form.sortOrder !== "" ? form.sortOrder : 0,
            image: form.image || null,
            translations,
            autoTranslate: true,
            overwriteTranslations: true,
          }),
        },
        bi("Failed to save category", "保存分类失败")
      )
      toast.success(mode === "edit" ? bi("Category updated", "分类已更新") : bi("Category created", "分类已创建"))
      router.push("/admin/categories")
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="text-sm text-stone p-8">{bi("Loading category...", "正在加载分类...")}</div>
  if (notFound) return <div className="text-sm text-rosegold p-8">{bi("Category not found.", "未找到分类。")}</div>

  const input = "w-full border border-mist bg-white px-3 py-2 text-sm outline-none focus:border-charcoal transition-colors"
  const label = "block text-xs uppercase tracking-wider text-stone font-medium mb-1.5"
  const setTranslation = (locale: string, value: string) => {
    setTranslations((prev) => ({ ...prev, [locale]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      {error && <div className="bg-rosegold/10 border border-rosegold/20 text-sm p-3">{error}</div>}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={label}>{bi("Name *", "名称 *")}</label>
          <input value={form.name} onChange={handleName} required className={input} />
        </div>
        <div>
          <label className={label}>Slug</label>
          <input
            value={form.slug}
            onChange={(e) => update({ slug: e.target.value })}
            onBlur={handleSlugBlur}
            className={input}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={label}>{bi("Parent Category", "父级分类")}</label>
          <select value={form.parentId} onChange={(e) => update({ parentId: e.target.value })} className={input}>
            <option value="">{bi("None (top-level)", "无（顶级）")}</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className={label}>{bi("Display Sort Order", "显示排序")}</label>
          <input type="number" value={form.sortOrder} onChange={(e) => update({ sortOrder: e.target.value })} className={input} />
        </div>
      </div>

      <div className="flex items-end gap-6 pb-2">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={form.isActive} onChange={(e) => update({ isActive: e.target.checked })} className="w-4 h-4" />
          {bi("Active", "启用")}
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={form.isFeatured} onChange={(e) => update({ isFeatured: e.target.checked })} className="w-4 h-4" />
          {bi("Featured", "推荐")}
        </label>
      </div>

      <div>
          <label className={label}>{bi("Description", "描述")}</label>
        <textarea value={form.description} onChange={(e) => update({ description: e.target.value })} rows={3} className={input} />
      </div>

      <div>
          <label className={label}>{bi("Listing Image", "列表图片")}</label>
        <ImageUploader value={form.image} onChange={(url) => update({ image: url })} />
      </div>

      <div className="border-t border-mist pt-6 space-y-4">
        <label className="block text-xs uppercase tracking-wider text-stone font-medium mb-1">
          {bi("Category Name Translations", "分类名称翻译")}
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {TRANS_LOCALES.map((loc) => (
            <div key={loc}>
              <label className={label}>{localeNames[loc]}</label>
              <input
                value={translations[loc] || ""}
                onChange={(e) => setTranslation(loc, e.target.value)}
                placeholder={bi("Optional localized category name", "可选：该语言分类名称")}
                className={input}
              />
            </div>
          ))}
        </div>
      </div>

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

      <div className="flex items-center gap-3 pt-4 border-t border-mist">
        <button type="submit" disabled={saving} className="btn-primary text-xs">
          {saving ? bi("Saving...", "保存中...") : mode === "edit" ? bi("Save Category", "保存分类") : bi("Create Category", "创建分类")}
        </button>
        <button type="button" onClick={() => router.push("/admin/categories")} className="text-xs text-stone hover:text-charcoal transition-colors">{bi("Cancel", "取消")}</button>
      </div>
    </form>
  )
}
