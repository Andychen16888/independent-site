"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "react-hot-toast"
import { bi } from "@/components/admin/bilingual"
import { slugify } from "@/lib/utils/format"
import { fetchJsonOrThrow, fetchJsonResponse, responseErrorMessage } from "@/lib/json-response"
import RichEditor from "@/components/admin/RichEditor"
import ImageUploader from "@/components/admin/ImageUploader"
import TranslationsEditor, { type TranslationFields } from "@/components/admin/TranslationsEditor"

export interface PageFormInitialData {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string
  coverImage: string | null
  isPublished: boolean
  seoTitle: string | null
  seoDescription: string | null
  seoKeywords: string | null
  translations: {
    locale: string
    title: string | null
    excerpt: string | null
    content: string | null
    seoTitle: string | null
    seoDescription: string | null
    seoKeywords: string | null
  }[]
}

// "about" and "contact" always refresh their translations on save, so their
// overwrite option starts checked and visible to the admin.
function overwriteByDefault(slug: string | null | undefined): boolean {
  return slug === "about" || slug === "contact"
}

function toTranslationFields(rows: any[]): TranslationFields[] {
  return (rows || []).map((t) => ({
    locale: t.locale,
    title: t.title || "",
    excerpt: t.excerpt || "",
    content: t.content || "",
    seoTitle: t.seoTitle || "",
    seoDescription: t.seoDescription || "",
    seoKeywords: t.seoKeywords || "",
  }))
}

export default function PageForm({
  mode,
  pageId,
  initialData,
  redirectTo = "/admin/pages",
  cancelTo = "/admin/pages",
}: {
  mode: "new" | "edit"
  pageId?: string
  initialData?: PageFormInitialData
  redirectTo?: string
  cancelTo?: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(mode === "edit" && !initialData)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [notFound, setNotFound] = useState(false)
  const [resolvedId, setResolvedId] = useState(pageId)
  const [form, setForm] = useState(() =>
    initialData
      ? {
          title: initialData.title,
          slug: initialData.slug,
          excerpt: initialData.excerpt || "",
          content: initialData.content || "",
          coverImage: initialData.coverImage || "",
          isPublished: initialData.isPublished === true,
          seoTitle: initialData.seoTitle || "",
          seoDescription: initialData.seoDescription || "",
          seoKeywords: initialData.seoKeywords || "",
        }
      : {
          title: "", slug: "", excerpt: "", content: "", coverImage: "",
          isPublished: false, seoTitle: "", seoDescription: "", seoKeywords: "",
        }
  )
  const [translations, setTranslations] = useState<TranslationFields[]>(() =>
    (initialData?.translations || []).map((t) => ({
      locale: t.locale,
      title: t.title || "",
      excerpt: t.excerpt || "",
      content: t.content || "",
      seoTitle: t.seoTitle || "",
      seoDescription: t.seoDescription || "",
      seoKeywords: t.seoKeywords || "",
    }))
  )
  const [autoTranslate, setAutoTranslate] = useState(true)
  const [overwriteTranslations, setOverwriteTranslations] = useState(() =>
    overwriteByDefault(initialData?.slug)
  )

  useEffect(() => {
    if (mode !== "edit" || !pageId || initialData) return
    fetchJsonResponse<any>(`/api/admin/pages/${pageId}`, { cache: "no-store" })
      .then(({ res, parsed, data }) => {
        if (res.status === 404) { setNotFound(true); return }
        if (!parsed.ok) throw new Error(responseErrorMessage(parsed, bi("Failed to load page", "加载页面失败")))
        const payload = (data || {}) as any
        const p = payload.page
        setResolvedId(p.id)
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
        setOverwriteTranslations(overwriteByDefault(p.slug))
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [mode, pageId, initialData])

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
      const url = mode === "edit" ? `/api/admin/pages/${resolvedId}` : "/api/admin/pages"
      const { data } = await fetchJsonOrThrow<any>(
        url,
        {
          method: mode === "edit" ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...form,
            coverImage: form.coverImage || null,
            translations,
            autoTranslate,
            overwriteTranslations,
          }),
        },
        bi("Failed to save page", "保存页面失败")
      )
      const payload = (data || {}) as any

      if (Array.isArray(payload.translations)) {
        setTranslations(toTranslationFields(payload.translations))
      }

      const t = payload.translation
      const translated = t?.translated?.length || 0
      const failedList: { locale: string; error: string }[] = t?.failed || []
      const failed = failedList.length
      const hint = failedList[0]?.error ? ` (${failedList[0].error})` : ""

      if (payload.translationError) {
        toast.error(bi(
          `Saved, but auto-translation failed: ${payload.translationError}`,
          `已保存，但自动翻译失败：${payload.translationError}`
        ))
      } else if (failed > 0) {
        if (translated > 0) {
          toast.success(bi(`Saved. Auto-translated into ${translated} language(s).`, `已保存，并自动翻译为 ${translated} 种语言。`))
        }
        toast.error(bi(
          `Page saved, but ${failed} language(s) failed to translate${hint}. Check OPENAI_API_KEY on the server.`,
          `页面已保存，但 ${failed} 种语言翻译失败${hint}。请检查服务器上的 OPENAI_API_KEY。`
        ))
      } else if (translated > 0) {
        toast.success(bi(`Saved. Auto-translated into ${translated} language(s).`, `已保存，并自动翻译为 ${translated} 种语言。`))
      } else {
        toast.success(mode === "edit" ? bi("Page updated", "页面已更新") : bi("Page created", "页面已创建"))
      }
      router.push(redirectTo)
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
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={autoTranslate} onChange={(e) => setAutoTranslate(e.target.checked)} className="w-4 h-4" />
          {bi("Auto-translate into all languages on save", "保存时自动翻译成所有语言")}
        </label>
        <label className={`flex items-center gap-2 text-sm ${autoTranslate ? "cursor-pointer" : "cursor-not-allowed opacity-50"}`}>
          <input
            type="checkbox"
            checked={overwriteTranslations}
            disabled={!autoTranslate}
            onChange={(e) => setOverwriteTranslations(e.target.checked)}
            className="w-4 h-4"
          />
          {bi(
            "Re-translate and overwrite existing translations (use after editing the English text)",
            "重新翻译并覆盖已有翻译（修改英文原文后使用）"
          )}
        </label>
        <p className="text-[11px] text-stone leading-relaxed">
          {bi(
            "The English text is the source. If a language tab is left empty the storefront falls back to English. Requires OPENAI_API_KEY on the server; if it is missing, saving still works but translation is skipped and you will see an error.",
            "英文（或上方内容）是翻译源。某个语言页签留空时，前台会回退显示英文。服务器需配置 OPENAI_API_KEY；若未配置，页面仍可保存，但会跳过翻译并显示错误提示。"
          )}
        </p>
        <TranslationsEditor value={translations} onChange={setTranslations} includeContent />
      </div>

      <div className="flex items-center gap-3 pt-4 border-t border-mist">
        <button type="submit" disabled={saving} className="btn-primary text-xs">
          {saving
            ? autoTranslate
              ? bi("Saving & translating...", "保存并翻译中...")
              : bi("Saving...", "保存中...")
            : mode === "edit"
            ? bi("Save Page", "保存页面")
            : bi("Create Page", "创建页面")}
        </button>
        <button type="button" onClick={() => router.push(cancelTo)} className="text-xs text-stone hover:text-charcoal transition-colors">{bi("Cancel", "取消")}</button>
      </div>
    </form>
  )
}
