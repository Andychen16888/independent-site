"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "react-hot-toast"
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
        if (!res.ok) throw new Error("Failed to load page")
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
      if (!res.ok) throw new Error(data.error || "Failed to save page")
      toast.success(mode === "edit" ? "Page updated" : "Page created")
      router.push("/admin/pages")
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="text-sm text-stone p-8">Loading page...</div>
  if (notFound) return <div className="text-sm text-rosegold p-8">Page not found.</div>

  const input = "w-full border border-mist bg-white px-3 py-2 text-sm outline-none focus:border-charcoal transition-colors"
  const label = "block text-xs uppercase tracking-wider text-stone font-medium mb-1.5"

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      {error && <div className="bg-rosegold/10 border border-rosegold/20 text-sm p-3">{error}</div>}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={label}>Title *</label>
          <input value={form.title} onChange={handleTitle} required className={input} />
        </div>
        <div>
          <label className={label}>Slug</label>
          <input value={form.slug} onChange={(e) => update({ slug: e.target.value })} className={input} />
        </div>
      </div>

      <div>
        <label className={label}>Excerpt</label>
        <textarea value={form.excerpt} onChange={(e) => update({ excerpt: e.target.value })} rows={2} className={input} />
      </div>

      <div>
        <label className={label}>Content *</label>
        <RichEditor value={form.content} onChange={(html) => update({ content: html })} placeholder="Enter page content..." minHeight={300} />
      </div>

      <div>
        <label className={label}>Cover Image</label>
        <ImageUploader value={form.coverImage} onChange={(url) => update({ coverImage: url })} />
      </div>

      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input type="checkbox" checked={form.isPublished} onChange={(e) => update({ isPublished: e.target.checked })} className="w-4 h-4" />
        Published (visible on the storefront)
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
        <label className="block text-xs uppercase tracking-wider text-stone font-medium mb-1">Translations</label>
        <TranslationsEditor value={translations} onChange={setTranslations} includeContent />
      </div>

      <div className="flex items-center gap-3 pt-4 border-t border-mist">
        <button type="submit" disabled={saving} className="btn-primary text-xs">
          {saving ? "Saving..." : mode === "edit" ? "Save Page" : "Create Page"}
        </button>
        <button type="button" onClick={() => router.push("/admin/pages")} className="text-xs text-stone hover:text-charcoal transition-colors">Cancel</button>
      </div>
    </form>
  )
}