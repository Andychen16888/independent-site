"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { slugify } from "@/lib/utils/format"

interface ImageItem {
  url: string
  alt: string
  isPrimary: boolean
}

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif", "image/tiff"]
const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB

interface Category {
  id: string
  name: string
  slug: string
}

export default function NewProductPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([])
  const [images, setImages] = useState<ImageItem[]>([])
  const [form, setForm] = useState({
    name: "",
    slug: "",
    sku: "",
    description: "",
    unitPrice: "",
    originalPrice: "",
    stock: "0",
    status: "ACTIVE",
  })

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch("/api/admin/categories")
        if (res.ok) {
          const data = await res.json()
          setCategories(data.categories)
        }
      } catch {
        // silently fail
      }
    }
    loadCategories()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "name" && !prev.slug ? { slug: slugify(value) } : {}),
    }))
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setError("Invalid file type. Allowed: JPEG, PNG, WebP, GIF, AVIF, TIFF")
      e.target.value = ""
      return
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setError("File too large. Maximum size is 5MB.")
      e.target.value = ""
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      })

      if (!res.ok) throw new Error("Upload failed")

      const data = await res.json()
      setImages((prev) => [
        ...prev,
        { url: data.url, alt: "", isPrimary: prev.length === 0 },
      ])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploading(false)
      e.target.value = ""
    }
  }

  const handleImageUrlAdd = () => {
    setImages((prev) => [
      ...prev,
      { url: "", alt: "", isPrimary: prev.length === 0 },
    ])
  }

  const handleImageChange = (index: number, field: keyof ImageItem, value: string | boolean) => {
    setImages((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }

      if (field === "isPrimary" && value === true) {
        for (let i = 0; i < next.length; i++) {
          if (i !== index) next[i].isPrimary = false
        }
      }

      return next
    })
  }

  const handleRemoveImage = (index: number) => {
    setImages((prev) => {
      const next = prev.filter((_, i) => i !== index)
      if (prev[index].isPrimary && next.length > 0) {
        next[0].isPrimary = true
      }
      return next
    })
  }

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError("")

    const validImages = images.filter((img) => img.url.trim() !== "")

    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          images: validImages,
          categoryIds: selectedCategoryIds,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to create product")
      }

      router.push("/admin/products")
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="heading-md">New Product</h1>
          <p className="text-body text-sm mt-1">Add a new product to your catalog.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        {error && (
          <div className="bg-rosegold/10 border border-rosegold/20 text-sm p-3">{error}</div>
        )}

        <div>
          <label className="block text-xs uppercase tracking-wider text-stone font-medium mb-1.5">Name *</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            className="w-full border border-mist bg-white px-3 py-2 text-sm outline-none focus:border-charcoal transition-colors"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-stone font-medium mb-1.5">Slug</label>
            <input
              name="slug"
              value={form.slug}
              onChange={handleChange}
              className="w-full border border-mist bg-white px-3 py-2 text-sm outline-none focus:border-charcoal transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-stone font-medium mb-1.5">SKU</label>
            <input
              name="sku"
              value={form.sku}
              onChange={handleChange}
              className="w-full border border-mist bg-white px-3 py-2 text-sm outline-none focus:border-charcoal transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wider text-stone font-medium mb-1.5">Description *</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            required
            rows={5}
            className="w-full border border-mist bg-white px-3 py-2 text-sm outline-none focus:border-charcoal transition-colors resize-y"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-stone font-medium mb-1.5">Price *</label>
            <input
              name="unitPrice"
              type="number"
              step="0.01"
              min="0"
              value={form.unitPrice}
              onChange={handleChange}
              required
              className="w-full border border-mist bg-white px-3 py-2 text-sm outline-none focus:border-charcoal transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-stone font-medium mb-1.5">Original Price</label>
            <input
              name="originalPrice"
              type="number"
              step="0.01"
              min="0"
              value={form.originalPrice}
              onChange={handleChange}
              className="w-full border border-mist bg-white px-3 py-2 text-sm outline-none focus:border-charcoal transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-stone font-medium mb-1.5">Stock</label>
            <input
              name="stock"
              type="number"
              min="0"
              value={form.stock}
              onChange={handleChange}
              className="w-full border border-mist bg-white px-3 py-2 text-sm outline-none focus:border-charcoal transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wider text-stone font-medium mb-1.5">Status</label>
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            className="w-full border border-mist bg-white px-3 py-2 text-sm outline-none focus:border-charcoal transition-colors"
          >
            <option value="ACTIVE">Active</option>
            <option value="DRAFT">Draft</option>
            <option value="INACTIVE">Inactive</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>

        <div className="border-t border-mist pt-6">
          <label className="block text-xs uppercase tracking-wider text-stone font-medium mb-3">Product Images</label>

          {images.length > 0 && (
            <div className="space-y-3 mb-4">
              {images.map((img, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-ivory/50 border border-mist">
                  {img.url && (
                    <img src={img.url} alt="" className="w-16 h-16 object-cover border border-mist flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0 space-y-2">
                    <input
                      type="text"
                      placeholder="Image URL"
                      value={img.url}
                      onChange={(e) => handleImageChange(index, "url", e.target.value)}
                      className="w-full border border-mist bg-white px-3 py-1.5 text-sm outline-none focus:border-charcoal transition-colors"
                    />
                    <input
                      type="text"
                      placeholder="Alt text (optional)"
                      value={img.alt}
                      onChange={(e) => handleImageChange(index, "alt", e.target.value)}
                      className="w-full border border-mist bg-white px-3 py-1.5 text-sm outline-none focus:border-charcoal transition-colors"
                    />
                  </div>
                  <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <label className="flex items-center gap-1 text-xs cursor-pointer">
                      <input
                        type="radio"
                        name="primaryImage"
                        checked={img.isPrimary}
                        onChange={() => handleImageChange(index, "isPrimary", true)}
                        className="w-3 h-3"
                      />
                      Primary
                    </label>
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="text-xs text-rosegold hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3">
            <label className="btn-outline text-xs cursor-pointer inline-flex items-center gap-2">
              {uploading ? "Uploading..." : "Upload Image"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/tiff"
                onChange={handleImageUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
            <button
              type="button"
              onClick={handleImageUrlAdd}
              className="text-xs text-stone hover:text-charcoal transition-colors"
            >
              + Add URL
            </button>
          </div>
          <p className="text-xs text-stone mt-2">Supported: JPEG, PNG, WebP, GIF, AVIF, TIFF — Max 5MB per image</p>
        </div>

        <div className="border-t border-mist pt-6">
          <label className="block text-xs uppercase tracking-wider text-stone font-medium mb-3">Categories</label>
          {categories.length === 0 ? (
            <p className="text-sm text-stone">No categories available. Create categories first.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {categories.map((cat) => (
                <label key={cat.id} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedCategoryIds.includes(cat.id)}
                    onChange={() => handleCategoryToggle(cat.id)}
                    className="w-4 h-4"
                  />
                  {cat.name}
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 pt-4 border-t border-mist">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary text-xs"
          >
            {saving ? "Creating..." : "Create Product"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/admin/products")}
            className="text-xs text-stone hover:text-charcoal transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
