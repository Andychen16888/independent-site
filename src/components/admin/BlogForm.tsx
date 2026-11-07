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

export default function BlogForm({ mode, postId }: { mode: "new" | "edit"; postId?: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(mode === "edit")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [notFound, setNotFound] = useState(false)
  const [form, setForm] = useState({
    title: "", slug: "", excerpt: "", content: "", coverImage: "",
    author: "Admin", tags: "", isPublished: false,
    seoTitle: "", seoDescription: "", seoKeywords: "",
  })
  const [translations, setTranslations] = useState<TranslationFields[]>([])

  useEffect(() => {
    if (mode !== "edit" || !postId) return
    fetchJsonResponse<any>(`/api/admin/blog/${postId}`, { cache: "no-store" })
      .then(({ res, parsed, data }) => {
        if (res.status === 404) { setNotFound(true); return }
        if (!parsed.ok) throw new Error(responseErrorMessage(parsed, bi("Failed to load post", "加载文章失败")))
        const payload = (data || {}) as any
        const p = payload.post
        setForm({
          title: p.title, slug: p.slug, excerpt: p.excerpt || "", content: p.content || "",
          coverImage: p.coverImage || "", author: p.author || "Admin", tags: p.tags || "",
          isPublished: p.isPublished === true,
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
  }, [mode, postId])

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
      const url = mode === "edit" ? `/api/admin/blog/${postId}` : "/api/admin/blog"
      await fetchJsonOrThrow(
        url,
        {
          method: mode === "edit" ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, coverImage: form.coverImage || null, translations }),
        },
        bi("Failed to save post", "保存文章失败")
      )
      toast.success(mode === "edit" ? bi("Post updated", "文章已更新") : bi("Post created", "文章已创建"))
      router.push("/admin/blog")
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="text-sm text-stone p-8">{bi("Loading post...", "正在加载文章...")}</div>
  if (notFound) return <div className="text-sm text-rosegold p-8">{bi("Post not found.", "未找到文章。")}</div>

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

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={label}>{bi("Author", "作者")}</label>
          <input value={form.author} onChange={(e) => update({ author: e.target.value })} className={input} />
        </div>
        <div>
          <label className={label}>{bi("Tags (comma separated)", "标签（逗号分隔）")}</label>
          <input value={form.tags} onChange={(e) => update({ tags: e.target.value })} className={input} />
        </div>
      </div>

      <div>
          <label className={label}>{bi("Excerpt", "摘要")}</label>
        <textarea value={form.excerpt} onChange={(e) => update({ excerpt: e.target.value })} rows={2} className={input} />
      </div>

      <div>
          <label className={label}>{bi("Content *", "内容 *")}</label>
          <RichEditor value={form.content} onChange={(html) => update({ content: html })} placeholder={bi("Write your post...", "输入文章内容...")} minHeight={320} />
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
          <label className={label}>SEO Title</label>
          <input value={form.seoTitle} onChange={(e) => update({ seoTitle: e.target.value })} className={input} />
        </div>
        <div>
          <label className={label}>SEO Description</label>
          <textarea value={form.seoDescription} onChange={(e) => update({ seoDescription: e.target.value })} rows={2} className={input} />
        </div>
        <div>
          <label className={label}>SEO Keywords</label>
          <input value={form.seoKeywords} onChange={(e) => update({ seoKeywords: e.target.value })} className={input} />
        </div>
      </div>

      <div className="border-t border-mist pt-6 space-y-4">
        <label className="block text-xs uppercase tracking-wider text-stone font-medium mb-1">{bi("Translations", "多语言翻译")}</label>
        <TranslationsEditor value={translations} onChange={setTranslations} includeContent />
      </div>

      <div className="flex items-center gap-3 pt-4 border-t border-mist">
        <button type="submit" disabled={saving} className="btn-primary text-xs">
          {saving ? bi("Saving...", "保存中...") : mode === "edit" ? bi("Save Post", "保存文章") : bi("Create Post", "创建文章")}
        </button>
        <button type="button" onClick={() => router.push("/admin/blog")} className="text-xs text-stone hover:text-charcoal transition-colors">{bi("Cancel", "取消")}</button>
      </div>
    </form>
  )
}
