"use client"

import { useEffect, useState } from "react"
import { toast } from "react-hot-toast"
import ImageUploader from "@/components/admin/ImageUploader"
import { bi } from "@/components/admin/bilingual"
import {
  SITE_IMAGE_SLOTS,
  SITE_IMAGE_GROUP_LABELS,
  type SiteImageGroup,
} from "@/config/images"

const GROUP_ORDER: SiteImageGroup[] = [
  "hero",
  "commodities",
  "supplyChain",
  "process",
  "port",
  "global",
  "about",
]

export default function AdminImagesPage() {
  const [images, setImages] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch("/api/admin/site-images", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (data.images) setImages(data.images)
      })
      .catch(() => toast.error(bi("Failed to load images", "加载图片失败")))
      .finally(() => setLoading(false))
  }, [])

  const update = (key: string, value: string) => {
    setImages((prev) => {
      const next = { ...prev }
      if (value) next[key] = value
      else delete next[key]
      return next
    })
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch("/api/admin/site-images", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || bi("Save failed", "保存失败"))
      if (data.images) setImages(data.images)
      toast.success(bi("Images saved", "图片已保存"))
    } catch (e) {
      toast.error(e instanceof Error ? e.message : bi("Save failed", "保存失败"))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="heading-md">{bi("Site Images", "站点图片")}</h1>
        <p className="text-body text-sm mt-1">
          {bi("Upload photos for the homepage and pages directly here.", "可在此直接上传首页和页面图片。")} 
          {bi("Each upload is stored on the server and shown on the storefront immediately.", "每次上传会保存到服务器并立即展示到前台。")} 
          {bi("Leave a slot empty to use its default placeholder.", "留空则使用默认占位图。")}
        </p>
      </div>

      {loading ? (
        <div className="text-sm text-stone">{bi("Loading images...", "正在加载图片...")}</div>
      ) : (
        <form onSubmit={handleSave} className="max-w-4xl space-y-8">
          {GROUP_ORDER.map((group) => {
            const slots = SITE_IMAGE_SLOTS.filter((s) => s.group === group)
            if (slots.length === 0) return null
            return (
              <div key={group} className="bg-white border border-mist p-8 space-y-6">
                <h2 className="font-serif text-lg">{SITE_IMAGE_GROUP_LABELS[group]}</h2>
                {slots.map((slot) => (
                  <div key={slot.key} className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <div className="sm:w-48 shrink-0">
                      <div className="text-sm text-charcoal">{slot.label}</div>
                      <div className="text-[11px] text-stone break-all">{slot.defaultSrc}</div>
                    </div>
                    <div className="flex-1">
                      <ImageUploader
                        value={images[slot.key] || ""}
                        onChange={(url) => update(slot.key, url)}
                        label={bi("Upload", "上传")}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )
          })}

          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center px-8 py-3 bg-charcoal text-white text-sm tracking-widest uppercase font-light transition-all duration-300 hover:bg-charcoal/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? bi("Saving...", "保存中...") : bi("Save Images", "保存图片")}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
