"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "react-hot-toast"
import { slugify } from "@/lib/utils/format"
import RichEditor from "@/components/admin/RichEditor"
import ImageUploader from "@/components/admin/ImageUploader"

interface ImageItem { url: string; alt: string; isPrimary: boolean }
interface Parameter { name: string; value: string }
interface CategoryOption { id: string; name: string; slug: string }

export interface ProductFormData {
  id?: string
  name: string
  slug: string
  sku: string
  brand: string
  model: string
  tags: string
  description: string
  shortDescription: string
  unitPrice: string
  originalPrice: string
  costPrice: string
  stock: string
  status: string
  weight: string
  isFeatured: boolean
  isBestSeller: boolean
  isNew: boolean
  isHomeFeatured: boolean
  sortOrder: string
  seoTitle: string
  seoDescription: string
  seoKeywords: string
}

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif", "image/tiff"]
const MAX_IMAGE_SIZE = 5 * 1024 * 1024

export default function ProductForm({ mode, productId }: { mode: "new" | "edit"; productId?: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(mode === "edit")
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const [notFound, setNotFound] = useState(false)
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([])
  const [images, setImages] = useState<ImageItem[]>([])
  const [parameters, setParameters] = useState<Parameter[]>([])
  const [form, setForm] = useState<ProductFormData>({
    name: "", slug: "", sku: "", brand: "", model: "", tags: "",
    description: "", shortDescription: "",
    unitPrice: "", originalPrice: "", costPrice: "", stock: "0", status: "ACTIVE", weight: "",
    isFeatured: false, isBestSeller: false, isNew: false, isHomeFeatured: false, sortOrder: "",
    seoTitle: "", seoDescription: "", seoKeywords: "",
  })

  useEffect(() => {
    fetch("/api/admin/categories", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => setCategories(data.categories || []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (mode !== "edit" || !productId) return
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)

    fetch(`/api/admin/products/${productId}`, { signal: controller.signal })
      .then(async (res) => {
        if (res.status === 404) { setNotFound(true); return }
        if (!res.ok) throw new Error("Failed to load product")
        const data = await res.json()
        const p = data.product
        setForm({
          name: p.name, slug: p.slug, sku: p.sku, brand: p.brand || "", model: p.model || "",
          tags: p.tags || "", description: p.description, shortDescription: p.shortDescription || "",
          unitPrice: String(p.unitPrice), originalPrice: p.originalPrice ? String(p.originalPrice) : "",
          costPrice: p.costPrice ? String(p.costPrice) : "", stock: String(p.stock),
          status: p.status, weight: p.weight ? String(p.weight) : "",
          isFeatured: p.isFeatured, isBestSeller: p.isBestSeller, isNew: p.isNew,
          isHomeFeatured: p.isHomeFeatured, sortOrder: String(p.sortOrder ?? 0),
          seoTitle: p.seoTitle || "", seoDescription: p.seoDescription || "", seoKeywords: p.seoKeywords || "",
        })
        if (p.images) setImages(p.images.map((img: any) => ({ url: img.url, alt: img.alt || "", isPrimary: img.isPrimary })))
        if (p.categories) setSelectedCategoryIds(p.categories.map((pc: any) => pc.category.id))
        if (p.parameters) {
          setParameters(p.parameters.map((par: any) => ({ name: par.name, value: par.value })))
        }
      })
      .catch((err: any) => {
        if (err.name === "AbortError") setError("Request timed out.")
        else setError(err.message)
      })
      .finally(() => { clearTimeout(timeout); setLoading(false) })
    return () => { clearTimeout(timeout); controller.abort() }
  }, [mode, productId])

  const updateForm = (patch: Partial<ProductFormData>) => setForm((prev) => ({ ...prev, ...patch }))

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    updateForm({
      [name]: value,
      ...(name === "name" && !form.slug ? { slug: slugify(value) } : {}),
    } as Partial<ProductFormData>)
  }

  const toggleFlag = (name: keyof ProductFormData) => {
    updateForm({ [name]: !form[name] } as Partial<ProductFormData>)
  }

  // --- Images ---
  async function handleFile(file: File | undefined | null) {
    if (!file) return
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) { setError("Invalid image type"); return }
    if (file.size > MAX_IMAGE_SIZE) { setError("File too large (max 5MB)"); return }
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Upload failed")
      setImages((prev) => [...prev, { url: data.url, alt: "", isPrimary: prev.length === 0 }])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setUploading(false)
    }
  }

  const moveImage = (index: number, dir: -1 | 1) => {
    setImages((prev) => {
      const next = [...prev]
      const target = index + dir
      if (target < 0 || target >= next.length) return prev
      ;[next[index], next[target]] = [next[target], next[index]]
      for (let i = 0; i < next.length; i++) next[i].isPrimary = i === 0
      return next
    })
  }

  const handleImageChange = (index: number, field: keyof ImageItem, value: string | boolean) => {
    setImages((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      if (field === "isPrimary" && value === true) {
        for (let i = 0; i < next.length; i++) next[i].isPrimary = i === index
      }
      return next
    })
  }

  const handleRemoveImage = (index: number) => {
    setImages((prev) => {
      const next = prev.filter((_, i) => i !== index)
      if (prev[index]?.isPrimary && next.length > 0) next[0].isPrimary = true
      return next
    })
  }

  // --- Parameters ---
  const updateParameter = (index: number, field: keyof Parameter, value: string) => {
    setParameters((prev) => prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)))
  }

  const addParameter = () => setParameters((prev) => [...prev, { name: "", value: "" }])
  const removeParameter = (index: number) => setParameters((prev) => prev.filter((_, i) => i !== index))

  const handleCategoryToggle = (id: string) => {
    setSelectedCategoryIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError("")
    const validImages = images.filter((img) => img.url.trim() !== "")
    const validParams = parameters.filter((p) => p.name.trim() !== "")

    const payload = {
      ...form,
      originalPrice: form.originalPrice || null,
      costPrice: form.costPrice || null,
      weight: form.weight || null,
      sortOrder: form.sortOrder !== "" ? form.sortOrder : 0,
      shortDescription: form.shortDescription || null,
      images: validImages,
      categoryIds: selectedCategoryIds,
      parameters: validParams,
    }

    try {
      const url = mode === "edit" ? `/api/admin/products/${productId}` : "/api/admin/products"
      const res = await fetch(url, {
        method: mode === "edit" ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to save product")
      toastSuccess(mode === "edit" ? "Product updated" : "Product created")
      router.push("/admin/products")
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  function toastSuccess(msg: string) {
    toast.success(msg)
  }

  if (loading) return <div className="text-sm text-stone p-8">Loading product...</div>
  if (notFound) return <div className="text-sm text-rosegold p-8">Product not found.</div>

  const input = "w-full border border-mist bg-white px-3 py-2 text-sm outline-none focus:border-charcoal transition-colors"
  const label = "block text-xs uppercase tracking-wider text-stone font-medium mb-1.5"

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
      {error && <div className="bg-rosegold/10 border border-rosegold/20 text-sm p-3">{error}</div>}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={label}>Name *</label>
          <input name="name" value={form.name} onChange={handleChange} required className={input} />
        </div>
        <div>
          <label className={label}>Brand</label>
          <input name="brand" value={form.brand} onChange={handleChange} placeholder="e.g. Sony, Philips" className={input} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={label}>Model</label>
          <input name="model" value={form.model} onChange={handleChange} placeholder="e.g. Xperia 1 VII" className={input} />
        </div>
        <div>
          <label className={label}>Tags (comma separated)</label>
          <input name="tags" value={form.tags} onChange={handleChange} placeholder="e.g. new, hot, wireless" className={input} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className={label}>Slug</label>
          <input name="slug" value={form.slug} onChange={handleChange} className={input} />
        </div>
        <div>
          <label className={label}>SKU</label>
          <input name="sku" value={form.sku} onChange={handleChange} className={input} />
        </div>
        <div>
          <label className={label}>Stock</label>
          <input name="stock" type="number" min="0" value={form.stock} onChange={handleChange} className={input} />
        </div>
      </div>

      <div>
        <label className={label}>Description *</label>
        <RichEditor value={form.description} onChange={(html) => updateForm({ description: html })} placeholder="Enter product description..." minHeight={200} />
      </div>

      <div>
        <label className={label}>Short Description</label>
        <RichEditor value={form.shortDescription} onChange={(html) => updateForm({ shortDescription: html })} placeholder="Brief summary for listings..." minHeight={100} />
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div>
          <label className={label}>Price *</label>
          <input name="unitPrice" type="number" step="0.01" min="0" value={form.unitPrice} onChange={handleChange} required className={input} />
        </div>
        <div>
          <label className={label}>Original Price</label>
          <input name="originalPrice" type="number" step="0.01" min="0" value={form.originalPrice} onChange={handleChange} className={input} />
        </div>
        <div>
          <label className={label}>Cost Price</label>
          <input name="costPrice" type="number" step="0.01" min="0" value={form.costPrice} onChange={handleChange} className={input} />
        </div>
        <div>
          <label className={label}>Weight (kg)</label>
          <input name="weight" type="number" step="0.01" min="0" value={form.weight} onChange={handleChange} className={input} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={label}>Status</label>
          <select name="status" value={form.status} onChange={handleChange} className={input}>
            <option value="ACTIVE">Active</option>
            <option value="DRAFT">Draft</option>
            <option value="INACTIVE">Inactive</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
        <div>
          <label className={label}>Display Sort Order</label>
          <input name="sortOrder" type="number" value={form.sortOrder} onChange={handleChange} className={input} />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {([
          ["isFeatured", "Featured"],
          ["isBestSeller", "Best Seller"],
          ["isNew", "New"],
          ["isHomeFeatured", "Show on Homepage"],
        ] as [keyof ProductFormData, string][]).map(([key, labelText]) => (
          <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={Boolean(form[key])} onChange={() => toggleFlag(key)} className="w-4 h-4" />
            {labelText}
          </label>
        ))}
      </div>

      {/* Dynamic product attributes */}
      <div className="border-t border-mist pt-6">
        <label className="block text-xs uppercase tracking-wider text-stone font-medium mb-1">Product Attributes (dynamic)</label>
        <p className="text-xs text-stone mb-3">Add any attributes for any product type — e.g. RAM=12GB, Power=100W, Material=Aluminum.</p>
        {parameters.length === 0 && <p className="text-sm text-stone mb-3">No attributes yet.</p>}
        <div className="space-y-2 mb-3">
          {parameters.map((param, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                value={param.name}
                onChange={(e) => updateParameter(index, "name", e.target.value)}
                placeholder="Attribute name"
                className={input}
              />
              <input
                value={param.value}
                onChange={(e) => updateParameter(index, "value", e.target.value)}
                placeholder="Value"
                className={input}
              />
              <button type="button" onClick={() => removeParameter(index)} className="text-xs text-rosegold hover:underline shrink-0">
                Remove
              </button>
            </div>
          ))}
        </div>
        <button type="button" onClick={addParameter} className="text-xs text-stone hover:text-charcoal transition-colors">
          + Add Attribute
        </button>
      </div>

      {/* Images */}
      <div className="border-t border-mist pt-6">
        <label className="block text-xs uppercase tracking-wider text-stone font-medium mb-3">Product Images (fill for multiple images)</label>
        {images.length > 0 && (
          <div className="space-y-3 mb-4">
            {images.map((img, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-ivory/50 border border-mist">
                {img.url && <img src={img.url} alt="" className="w-16 h-16 object-cover border border-mist flex-shrink-0" />}
                <div className="flex-1 min-w-0 space-y-2">
                  <input type="text" placeholder="Image URL" value={img.url} onChange={(e) => handleImageChange(index, "url", e.target.value)} className={input} />
                  <input type="text" placeholder="Alt text" value={img.alt} onChange={(e) => handleImageChange(index, "alt", e.target.value)} className={input} />
                </div>
                <div className="flex flex-col items-center gap-1 flex-shrink-0">
                  <button type="button" onClick={() => moveImage(index, -1)} disabled={index === 0} className="text-xs text-stone disabled:opacity-30">↑</button>
                  <button type="button" onClick={() => moveImage(index, 1)} disabled={index === images.length - 1} className="text-xs text-stone disabled:opacity-30">↓</button>
                  <label className="flex items-center gap-1 text-xs cursor-pointer">
                    <input type="radio" name="primaryImage" checked={img.isPrimary} onChange={() => handleImageChange(index, "isPrimary", true)} className="w-3 h-3" />
                    Primary
                  </label>
                  <button type="button" onClick={() => handleRemoveImage(index)} className="text-xs text-rosegold hover:underline">Remove</button>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center gap-3">
          <ImageUploader value={images.length ? images[images.length - 1].url : ""} onChange={(url) => { if (url) setImages((prev) => [...prev, { url, alt: "", isPrimary: prev.length === 0 }]) }} label={uploading ? "Uploading..." : "Upload Image"} />
        </div>
        <p className="text-xs text-stone mt-2">Supported: JPEG, PNG, WebP, GIF, AVIF, TIFF — Max 5MB. Use ↑↓ buttons to reorder; first image is the primary.</p>
      </div>

      {/* Categories */}
      <div className="border-t border-mist pt-6">
        <label className="block text-xs uppercase tracking-wider text-stone font-medium mb-3">Categories (multi-select)</label>
        {categories.length === 0 ? (
          <p className="text-sm text-stone">No categories available. Create categories first.</p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {categories.map((cat) => (
              <label key={cat.id} className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={selectedCategoryIds.includes(cat.id)} onChange={() => handleCategoryToggle(cat.id)} className="w-4 h-4" />
                {cat.name}
              </label>
            ))}
          </div>
        )}
      </div>

      {/* SEO */}
      <div className="border-t border-mist pt-6 space-y-4">
        <label className="block text-xs uppercase tracking-wider text-stone font-medium mb-1">SEO</label>
        <div>
          <label className={label}>SEO Title</label>
          <input name="seoTitle" value={form.seoTitle} onChange={handleChange} className={input} />
        </div>
        <div>
          <label className={label}>SEO Description</label>
          <textarea name="seoDescription" value={form.seoDescription} onChange={handleChange} rows={2} className={input} />
        </div>
        <div>
          <label className={label}>SEO Keywords</label>
          <input name="seoKeywords" value={form.seoKeywords} onChange={handleChange} className={input} />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-4 border-t border-mist">
        <button type="submit" disabled={saving} className="btn-primary text-xs">
          {saving ? "Saving..." : mode === "edit" ? "Save Product" : "Create Product"}
        </button>
        <button type="button" onClick={() => router.push("/admin/products")} className="text-xs text-stone hover:text-charcoal transition-colors">
          Cancel
        </button>
      </div>
    </form>
  )
}