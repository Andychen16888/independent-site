"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "react-hot-toast"
import { bi } from "@/components/admin/bilingual"
import { slugify } from "@/lib/utils/format"
import { readJsonResponse, responseErrorMessage } from "@/lib/json-response"
import RichEditor from "@/components/admin/RichEditor"
import ImageUploader from "@/components/admin/ImageUploader"
import ProductTranslationsEditor, { type ProductTranslationFields } from "@/components/admin/ProductTranslationsEditor"

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

function translationsFromData(list: any[]): ProductTranslationFields[] {
  return (list || []).map((t) => ({
    locale: t.locale,
    name: t.name || "",
    shortDescription: t.shortDescription || "",
    description: t.description || "",
    seoTitle: t.seoTitle || "",
    seoDescription: t.seoDescription || "",
  }))
}

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
  const [translations, setTranslations] = useState<ProductTranslationFields[]>([])
  const [autoTranslate, setAutoTranslate] = useState(true)
  const [overwriteTranslations, setOverwriteTranslations] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [translating, setTranslating] = useState(false)
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
        if (!res.ok) throw new Error(bi("Failed to load product", "加载产品失败"))
        const data = await res.json()
        const p = data.product
        setForm({
          name: p.name, slug: p.slug, sku: p.sku, brand: p.brand || "", model: p.model || "",
          tags: p.tags || "", description: p.description, shortDescription: p.shortDescription || "",
          unitPrice: p.unitPrice != null ? String(p.unitPrice) : "",
          originalPrice: p.originalPrice ? String(p.originalPrice) : "",
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
        if (p.translations) {
          setTranslations(translationsFromData(p.translations))
        }
      })
      .catch((err: any) => {
        if (err.name === "AbortError") setError(bi("Request timed out.", "请求超时。"))
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
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) { setError(bi("Invalid image type", "图片类型无效")); return }
    if (file.size > MAX_IMAGE_SIZE) { setError(bi("File too large (max 5MB)", "文件过大（最大 5MB）")); return }
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd })
      const parsed = await readJsonResponse(res)
      if (!parsed.ok) throw new Error(responseErrorMessage(parsed, bi("Upload failed", "上传失败")))
      const url = parsed.data?.url
      if (typeof url !== "string") throw new Error(bi("Upload failed", "上传失败"))
      setImages((prev) => [...prev, { url, alt: "", isPrimary: prev.length === 0 }])
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
      unitPrice: form.unitPrice !== "" ? form.unitPrice : null,
      originalPrice: form.originalPrice || null,
      costPrice: form.costPrice || null,
      weight: form.weight || null,
      sortOrder: form.sortOrder !== "" ? form.sortOrder : 0,
      shortDescription: form.shortDescription || null,
      images: validImages,
      categoryIds: selectedCategoryIds,
      parameters: validParams,
      translations: translations.filter((t) => t.name.trim() !== "" || t.description.trim() !== ""),
      autoTranslate,
      overwriteTranslations: autoTranslate && overwriteTranslations,
    }

    try {
      const url = mode === "edit" ? `/api/admin/products/${productId}` : "/api/admin/products"
      const res = await fetch(url, {
        method: mode === "edit" ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || bi("Failed to save product", "保存产品失败"))

      if (Array.isArray(data.translations)) {
        setTranslations(translationsFromData(data.translations))
      }

      if (data.translationError) {
        toast.error(bi(
          `Saved, but auto-translation failed: ${data.translationError}`,
          `已保存，但自动翻译失败：${data.translationError}`
        ))
      } else if (data.translation && data.translation.translated.length > 0) {
        const count = data.translation.translated.length
        const failed = data.translation.failed?.length || 0
        toast.success(bi(
          `Saved. Auto-translated into ${count} language(s).`,
          `已保存，并自动翻译为 ${count} 种语言。`
        ))
        if (failed > 0) toast.error(bi(`${failed} language(s) failed to translate.`, `${failed} 种语言翻译失败。`))
      } else {
        toastSuccess(mode === "edit" ? bi("Product updated", "产品已更新") : bi("Product created", "产品已创建"))
      }

      if (mode === "new" && data.product?.id) {
        router.push(`/admin/products/${data.product.id}`)
      }
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleTranslateNow() {
    if (!productId) return
    setTranslating(true)
    setError("")
    try {
      const res = await fetch(`/api/admin/products/${productId}/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ overwrite: overwriteTranslations }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || bi("Failed to translate", "翻译失败"))

      if (Array.isArray(data.translations)) {
        setTranslations(translationsFromData(data.translations))
      }

      const translated = data.translation?.translated?.length || 0
      const failed = data.translation?.failed?.length || 0
      if (translated > 0) {
        toast.success(bi(`Translated into ${translated} language(s).`, `已翻译 ${translated} 种语言。`))
      } else if (failed === 0) {
        toast(bi("All languages are already translated.", "所有语言均已翻译。"))
      }
      if (failed > 0) toast.error(bi(`${failed} language(s) failed to translate.`, `${failed} 种语言翻译失败。`))
    } catch (err: any) {
      setError(err.message)
    } finally {
      setTranslating(false)
    }
  }

  function toastSuccess(msg: string) {
    toast.success(msg)
  }

  if (loading) return <div className="text-sm text-stone p-8">{bi("Loading product...", "正在加载产品...")}</div>
  if (notFound) return <div className="text-sm text-rosegold p-8">{bi("Product not found.", "未找到产品。")}</div>

  const input = "w-full border border-mist bg-white px-3 py-2 text-sm outline-none focus:border-charcoal transition-colors"
  const label = "block text-xs uppercase tracking-wider text-stone font-medium mb-1.5"

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
      {error && <div className="bg-rosegold/10 border border-rosegold/20 text-sm p-3">{error}</div>}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={label}>{bi("Name *", "名称 *")}</label>
          <input name="name" value={form.name} onChange={handleChange} required className={input} />
        </div>
        <div>
          <label className={label}>{bi("Brand", "品牌")}</label>
          <input name="brand" value={form.brand} onChange={handleChange} placeholder={bi("e.g. Sony, Philips", "例如：Sony、Philips")} className={input} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={label}>{bi("Model", "型号")}</label>
          <input name="model" value={form.model} onChange={handleChange} placeholder={bi("e.g. Xperia 1 VII", "例如：Xperia 1 VII")} className={input} />
        </div>
        <div>
          <label className={label}>{bi("Tags (comma separated)", "标签（逗号分隔）")}</label>
          <input name="tags" value={form.tags} onChange={handleChange} placeholder={bi("e.g. new, hot, wireless", "例如：new, hot, wireless")} className={input} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className={label}>{bi("Slug", "短链接")}</label>
          <input name="slug" value={form.slug} onChange={handleChange} className={input} />
        </div>
        <div>
          <label className={label}>SKU</label>
          <input name="sku" value={form.sku} onChange={handleChange} className={input} />
        </div>
        <div>
          <label className={label}>{bi("Stock", "库存")}</label>
          <input name="stock" type="number" min="0" value={form.stock} onChange={handleChange} className={input} />
        </div>
      </div>

      <div>
          <label className={label}>{bi("Description *", "描述 *")}</label>
          <RichEditor value={form.description} onChange={(html) => updateForm({ description: html })} placeholder={bi("Enter product description...", "请输入产品描述...")} minHeight={200} />
      </div>

      <div>
          <label className={label}>{bi("Short Description", "简短描述")}</label>
          <RichEditor value={form.shortDescription} onChange={(html) => updateForm({ shortDescription: html })} placeholder={bi("Brief summary for listings...", "用于列表展示的简短摘要...")} minHeight={100} />
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div>
          <label className={label}>{bi("Price", "价格")}</label>
          <input name="unitPrice" type="number" step="0.01" min="0" value={form.unitPrice} onChange={handleChange} placeholder={bi("Optional", "选填")} className={input} />
        </div>
        <div>
          <label className={label}>{bi("Original Price", "原价")}</label>
          <input name="originalPrice" type="number" step="0.01" min="0" value={form.originalPrice} onChange={handleChange} placeholder={bi("Optional", "选填")} className={input} />
        </div>
        <div>
          <label className={label}>{bi("Cost Price", "成本价")}</label>
          <input name="costPrice" type="number" step="0.01" min="0" value={form.costPrice} onChange={handleChange} placeholder={bi("Optional", "选填")} className={input} />
        </div>
        <div>
          <label className={label}>Weight (kg)</label>
          <input name="weight" type="number" step="0.01" min="0" value={form.weight} onChange={handleChange} className={input} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={label}>{bi("Status", "状态")}</label>
          <select name="status" value={form.status} onChange={handleChange} className={input}>
            <option value="ACTIVE">{bi("Active", "在售")}</option>
            <option value="DRAFT">{bi("Draft", "草稿")}</option>
            <option value="INACTIVE">{bi("Inactive", "下架")}</option>
            <option value="ARCHIVED">{bi("Archived", "归档")}</option>
          </select>
        </div>
        <div>
          <label className={label}>{bi("Display Sort Order", "显示排序")}</label>
          <input name="sortOrder" type="number" value={form.sortOrder} onChange={handleChange} className={input} />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {([
          ["isFeatured", bi("Featured", "推荐")],
          ["isBestSeller", bi("Best Seller", "热销")],
          ["isNew", bi("New", "新品")],
          ["isHomeFeatured", bi("Show on Homepage", "首页展示")],
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

      {/* Localized content */}
      <div className="border-t border-mist pt-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="block text-xs uppercase tracking-wider text-stone font-medium">{bi("Translations", "多语言翻译")}</label>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleTranslateNow}
              disabled={translating || mode === "new"}
              className="text-[11px] text-charcoal border border-mist px-3 py-1.5 hover:border-charcoal transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {translating
                ? bi("Translating...", "翻译中...")
                : bi("Translate missing languages now", "立即翻译缺失语言")}
            </button>
            <button
              type="button"
              onClick={() => setShowHelp((v) => !v)}
              className="text-[11px] text-stone hover:text-charcoal underline underline-offset-2"
            >
              {showHelp ? bi("Hide instructions", "隐藏操作说明") : bi("How does this work?", "查看操作说明")}
            </button>
          </div>
        </div>

        {showHelp && (
          <div className="border border-mist bg-ivory/60 p-4 text-xs leading-relaxed space-y-2">
            <p className="font-medium text-charcoal">{bi("How product translation works", "产品多语言翻译使用说明")}</p>
            <ol className="list-decimal list-inside space-y-1 text-stone">
              <li>{bi('Fill in the English "Name" and "Description" first — they are the translation source.', "先填写英文的“名称”和“描述”，它们是翻译的源内容。")}</li>
              <li>{bi('Keep "Auto-translate on save" checked (default). The system sends the English text to OpenAI and writes the result into every language tab.', "保持勾选“保存时自动翻译”（默认开启）。系统会把英文内容发送给 OpenAI，并自动写入每个语言页签。")}</li>
              <li>{bi('Click Save. Translation runs in the background of the request and usually takes ~10–40 seconds. Wait for the success message.', "点击保存。翻译会在此请求中执行，通常耗时约 10–40 秒，请等待成功提示。")}</li>
              <li>{bi("After saving you will see the filled language tabs below / on the edit page. Empty languages fall back to English on the storefront.", "保存后，下面的语言页签会显示已填入的内容；未填写的语言在前台回退英文。")}</li>
              <li>{bi('Manually edit any language tab to fine-tune. Those edits are kept and NOT overwritten the next time you save.', "你可以手动修改任意语言页签进行润色。已手动修改的内容在下次保存时不会被覆盖。")}</li>
              <li>{bi('Changed the English source? Tick "Re-translate and overwrite existing translations" before saving to refresh all languages.', "如果修改了英文原文，请勾选“重新翻译并覆盖已有翻译”，保存后即可刷新所有语言。")}</li>
              <li>{bi("Requires an OPENAI_API_KEY on the server. If it is missing, saving still works but translation is skipped.", "服务器需配置 OPENAI_API_KEY。若未配置，产品仍可保存，只是跳过自动翻译。")}</li>
            </ol>
            <Link href="/admin/help/translations" className="inline-block mt-1 text-charcoal underline underline-offset-2">
              {bi("Open the full guide", "查看完整操作说明")} →
            </Link>
          </div>
        )}

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

        <ProductTranslationsEditor value={translations} onChange={setTranslations} />
      </div>

      <div className="flex items-center gap-3 pt-4 border-t border-mist">
        <button type="submit" disabled={saving} className="btn-primary text-xs">
          {saving
            ? autoTranslate
              ? bi("Saving & translating...", "保存并翻译中...")
              : bi("Saving...", "保存中...")
            : mode === "edit"
            ? bi("Save Product", "保存产品")
            : bi("Create Product", "创建产品")}
        </button>
        <button type="button" onClick={() => router.push("/admin/products")} className="text-xs text-stone hover:text-charcoal transition-colors">
          {bi("Cancel", "取消")}
        </button>
      </div>
    </form>
  )
}
