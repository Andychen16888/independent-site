"use client"

import { useEffect, useState } from "react"
import { toast } from "react-hot-toast"
import { SETTING_KEYS, SETTING_GROUP_ORDER, type SettingGroup } from "@/lib/settings/keys"
import ImageUploader from "@/components/admin/ImageUploader"
import StructuredContentEditor, {
  type StructuredSchema,
} from "@/components/admin/StructuredContentEditor"

const GROUP_TITLES: Record<SettingGroup, string> = {
  site: "Site",
  content: "Homepage Content",
  contact: "Company & Contact",
  social: "Social Media",
  seo: "SEO",
  shipping: "Shipping",
  analytics: "Analytics",
}

const STRUCTURED_FIELDS: Record<string, StructuredSchema> = {
  "content.brandStory": {
    kind: "object",
    fields: [
      { key: "eyebrow", type: "text", label: "Overline", placeholder: "e.g. Our Story" },
      { key: "title", type: "text", label: "Title", placeholder: "e.g. From China to the World" },
      {
        key: "paragraphs",
        type: "list",
        label: "Paragraphs (one per line)",
        itemLabel: "paragraph",
        rows: 3,
      },
      { key: "ctaLabel", type: "text", label: "Button Text", placeholder: "e.g. Read Our Story" },
      { key: "ctaHref", type: "url", label: "Button Link", placeholder: "e.g. /pages/about" },
      { key: "image", type: "image", label: "Image (optional)" },
    ],
  },
  "content.promo1": {
    kind: "object",
    fields: [
      { key: "eyebrow", type: "text", label: "Overline", placeholder: "e.g. Modern Manufacturing" },
      { key: "title", type: "text", label: "Title", placeholder: "e.g. Quality Electronics" },
      { key: "body", type: "textarea", label: "Description", rows: 4 },
      {
        key: "features",
        type: "array",
        label: "Benefit Points",
        itemLabel: "Benefit",
        fields: [
          { key: "title", type: "text", label: "Heading", placeholder: "e.g. Factory-Direct Pricing" },
          { key: "description", type: "textarea", label: "Description", rows: 2 },
        ],
      },
      { key: "ctaLabel", type: "text", label: "Button Text", placeholder: "e.g. View All Electronics" },
      { key: "ctaHref", type: "url", label: "Button Link", placeholder: "e.g. /categories/electronics" },
      { key: "image", type: "image", label: "Image (optional)" },
    ],
  },
  "content.promo2": {
    kind: "object",
    fields: [
      { key: "eyebrow", type: "text", label: "Overline", placeholder: "e.g. Everyday Essentials" },
      { key: "title", type: "text", label: "Title", placeholder: "e.g. Home & Kitchen" },
      { key: "tagline", type: "text", label: "Tagline" },
      {
        key: "collections",
        type: "array",
        label: "Collections",
        itemLabel: "Collection",
        fields: [
          { key: "title", type: "text", label: "Title", placeholder: "e.g. Kitchenware" },
          { key: "description", type: "textarea", label: "Description", rows: 2 },
          { key: "href", type: "url", label: "Link", placeholder: "e.g. /categories/home-kitchen" },
        ],
      },
      { key: "ctaLabel", type: "text", label: "Button Text", placeholder: "e.g. Explore All Collections" },
      { key: "ctaHref", type: "url", label: "Button Link", placeholder: "e.g. /products" },
    ],
  },
  "content.testimonials": {
    kind: "array",
    itemLabel: "Testimonial",
    fields: [
      { key: "name", type: "text", label: "Name", placeholder: "e.g. Sarah M." },
      { key: "location", type: "text", label: "Location", placeholder: "e.g. New York" },
      { key: "rating", type: "number", label: "Rating (1–5)", placeholder: "5" },
      { key: "text", type: "textarea", label: "Quote", rows: 3 },
      { key: "product", type: "text", label: "Product (optional)", placeholder: "e.g. LED Motion Sensor Night Light" },
    ],
  },
  "content.instagram": {
    kind: "object",
    fields: [
      { key: "handle", type: "text", label: "Handle", placeholder: "e.g. @commoditychina" },
      { key: "handleUrl", type: "url", label: "Profile Link", placeholder: "https://instagram.com/..." },
      { key: "tagline", type: "text", label: "Tagline", placeholder: "e.g. Tag us @commoditychina  #hashtag" },
      {
        key: "posts",
        type: "list",
        label: "Featured post images (URLs)",
        itemLabel: "image",
        listEntry: "text",
        placeholder: "https://.../image.jpg",
      },
    ],
  },
  "content.faq": {
    kind: "array",
    itemLabel: "Question",
    fields: [
      { key: "q", type: "textarea", label: "Question", rows: 2 },
      { key: "a", type: "textarea", label: "Answer", rows: 3 },
    ],
  },
}

function isImageKey(key: string): boolean {
  return key.includes("logo") || key.includes("favicon") || key.includes("ogImage")
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch("/api/admin/settings", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (data.settings) setSettings(data.settings)
      })
      .catch(() => toast.error("Failed to load settings"))
      .finally(() => setLoading(false))
  }, [])

  const update = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Save failed")
      if (data.settings) setSettings(data.settings)
      toast.success("Settings saved")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="heading-md">Settings</h1>
          <p className="text-body text-sm mt-1">Configure store identity, contact, SEO, and shipping. Saved to the database and rendered on the storefront automatically.</p>
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-stone">Loading settings...</div>
      ) : (
        <form onSubmit={handleSave} className="max-w-3xl space-y-8">
          {SETTING_GROUP_ORDER.map((group) => {
            const keys = SETTING_KEYS.filter((k) => k.group === group)
            return (
              <div key={group} className="bg-white border border-mist p-8 space-y-5">
                <h2 className="font-serif text-lg">{GROUP_TITLES[group]}</h2>
                {keys.map((meta) => {
                  const currentValue = settings[meta.key] || ""
                  const schema = STRUCTURED_FIELDS[meta.key]
                  return (
                    <div key={meta.key}>
                      <label className="block text-sm text-stone mb-2">{meta.label}</label>
                      {schema ? (
                        <div className="bg-mist/50 border border-mist p-4">
                          <StructuredContentEditor
                            schema={schema}
                            value={currentValue}
                            onChange={(json) => update(meta.key, json)}
                            description="Edit in plain text — no JSON needed. Changes show on the homepage after you click Save Settings."
                          />
                        </div>
                      ) : isImageKey(meta.key) ? (
                        <ImageUploader value={currentValue} onChange={(url) => update(meta.key, url)} />
                      ) : meta.type === "textarea" ? (
                        <textarea
                          value={currentValue}
                          onChange={(e) => update(meta.key, e.target.value)}
                          rows={3}
                          className="w-full px-4 py-3 bg-transparent border border-mist focus:border-charcoal outline-none text-sm transition-colors"
                        />
                      ) : meta.type === "language" ? (
                        <select
                          value={currentValue || "en"}
                          onChange={(e) => update(meta.key, e.target.value)}
                          className="w-full px-4 py-3 bg-transparent border border-mist focus:border-charcoal outline-none text-sm transition-colors"
                        >
                          <option value="en">English</option>
                          <option value="zh">中文</option>
                          <option value="es">Español</option>
                          <option value="fr">Français</option>
                          <option value="de">Deutsch</option>
                          <option value="ar">العربية</option>
                        </select>
                      ) : meta.type === "currency" ? (
                        <select
                          value={currentValue || "USD"}
                          onChange={(e) => update(meta.key, e.target.value)}
                          className="w-full px-4 py-3 bg-transparent border border-mist focus:border-charcoal outline-none text-sm transition-colors"
                        >
                          {["USD", "EUR", "GBP", "CAD", "AUD", "CNY", "JPY"].map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={currentValue}
                          onChange={(e) => update(meta.key, e.target.value)}
                          placeholder={meta.placeholder}
                          className="w-full px-4 py-3 bg-transparent border border-mist focus:border-charcoal outline-none text-sm transition-colors"
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}

          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center px-8 py-3 bg-charcoal text-white text-sm tracking-widest uppercase font-light transition-all duration-300 hover:bg-charcoal/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}