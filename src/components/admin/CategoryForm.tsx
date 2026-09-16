"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "react-hot-toast"
import { slugify } from "@/lib/utils/format"
import ImageUploader from "@/components/admin/ImageUploader"

interface CatOption { id: string; name: string; slug: string; parentId: string | null }

export default function CategoryForm({ mode, categoryId }: { mode: "new" | "edit"; categoryId?: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(mode === "edit")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [notFound, setNotFound] = useState(false)
  const [categories, setCategories] = useState<CatOption[]>([])
  const [form, setForm] = useState({
    name: "", slug: "", parentId: "", type: "GENERAL", sortOrder: "0",
    isActive: true, isFeatured: false,
    image: "", description: "",
    seoTitle: "", seoDescription: "", seoKeywords: "",
  })

  useEffect(() => {
    fetch("/api/admin/categories", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => setCategories((data.categories || []).filter((c: any) => c.id !== categoryId)))
      .catch(() => {})
  }, [categoryId])

  useEffect(() => {
    if (mode !== "edit" || !categoryId) return
    fetch(`/api/admin/categories/${categoryId}`, { cache: "no-store" })
      .then(async (res) => {
        if (res.status === 404) { setNotFound(true); return }
        if (!res.ok) throw new Error("Failed to load category")
        const data = await res.json()
        const c = data.category
        setForm({
          name: c.name, slug: c.slug, parentId: c.parentId || "",
          type: c.type || "GENERAL", sortOrder: String(c.sortOrder ?? 0),
          isActive: c.isActive !== false, isFeatured: c.isFeatured || false,
          image: c.image || "", description: c.description || "",
          seoTitle: c.seoTitle || "", seoDescription: c.seoDescription || "", seoKeywords: c.seoKeywords || "",
        })
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [mode, categoryId])

  const update = (patch: Partial<typeof form>) => setForm((prev) => ({ ...prev, ...patch }))

  const handleName = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target
    update({ name: value, ...(form.slug === "" ? { slug: slugify(value) } : {}) })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError("")
    try {
      const url = mode === "edit" ? `/api/admin/categories/${categoryId}` : "/api/admin/categories"
      const res = await fetch(url, {
        method: mode === "edit" ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          parentId: form.parentId || null,
          sortOrder: form.sortOrder !== "" ? form.sortOrder : 0,
          image: form.image || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to save category")
      toast.success(mode === "edit" ? "Category updated" : "Category created")
      router.push("/admin/categories")
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="text-sm text-stone p-8">Loading category...</div>
  if (notFound) return <div className="text-sm text-rosegold p-8">Category not found.</div>

  const input = "w-full border border-mist bg-white px-3 py-2 text-sm outline-none focus:border-charcoal transition-colors"
  const label = "block text-xs uppercase tracking-wider text-stone font-medium mb-1.5"

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      {error && <div className="bg-rosegold/10 border border-rosegold/20 text-sm p-3">{error}</div>}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={label}>Name *</label>
          <input value={form.name} onChange={handleName} required className={input} />
        </div>
        <div>
          <label className={label}>Slug</label>
          <input value={form.slug} onChange={(e) => update({ slug: e.target.value })} className={input} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={label}>Parent Category</label>
          <select value={form.parentId} onChange={(e) => update({ parentId: e.target.value })} className={input}>
            <option value="">None (top-level)</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className={label}>Type</label>
          <select value={form.type} onChange={(e) => update({ type: e.target.value })} className={input}>
            <option value="GENERAL">General</option>
            <option value="BEAUTY">Beauty</option>
            <option value="ELECTRONICS">Electronics</option>
            <option value="FASHION">Fashion</option>
            <option value="HOME">Home</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={label}>Display Sort Order</label>
          <input type="number" value={form.sortOrder} onChange={(e) => update({ sortOrder: e.target.value })} className={input} />
        </div>
        <div className="flex items-end gap-6 pb-2">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={form.isActive} onChange={(e) => update({ isActive: e.target.checked })} className="w-4 h-4" />
            Active
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={form.isFeatured} onChange={(e) => update({ isFeatured: e.target.checked })} className="w-4 h-4" />
            Featured
          </label>
        </div>
      </div>

      <div>
        <label className={label}>Description</label>
        <textarea value={form.description} onChange={(e) => update({ description: e.target.value })} rows={3} className={input} />
      </div>

      <div>
        <label className={label}>Listing Image</label>
        <ImageUploader value={form.image} onChange={(url) => update({ image: url })} />
      </div>

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

      <div className="flex items-center gap-3 pt-4 border-t border-mist">
        <button type="submit" disabled={saving} className="btn-primary text-xs">
          {saving ? "Saving..." : mode === "edit" ? "Save Category" : "Create Category"}
        </button>
        <button type="button" onClick={() => router.push("/admin/categories")} className="text-xs text-stone hover:text-charcoal transition-colors">Cancel</button>
      </div>
    </form>
  )
}