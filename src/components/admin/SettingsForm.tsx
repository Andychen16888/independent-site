"use client"

import { useEffect, useState } from "react"
import { toast } from "react-hot-toast"
import { SETTING_KEYS, SETTING_GROUP_ORDER, type SettingGroup } from "@/lib/settings/keys"
import ImageUploader from "@/components/admin/ImageUploader"
import { bi } from "@/components/admin/bilingual"
import { fetchJsonOrThrow, fetchJsonResponse, responseErrorMessage } from "@/lib/json-response"
import StructuredContentEditor, {
  type StructuredSchema,
} from "@/components/admin/StructuredContentEditor"

const GROUP_TITLES: Record<SettingGroup, string> = {
  site: bi("Site", "站点"),
  content: bi("Homepage Content", "首页内容"),
  contact: bi("Company & Contact", "公司与联系信息"),
  social: bi("Social Media", "社交媒体"),
  seo: bi("SEO", "搜索引擎优化"),
  shipping: bi("Shipping", "配送"),
  analytics: bi("Analytics", "统计分析"),
}

const STRUCTURED_FIELDS: Record<string, StructuredSchema> = {
  "content.brandStory": {
    kind: "object",
    fields: [
      { key: "eyebrow", type: "text", label: "Overline", labelZh: "眉题", placeholder: "e.g. Our Story" },
      { key: "title", type: "text", label: "Title", labelZh: "标题", placeholder: "e.g. From China to the World" },
      {
        key: "paragraphs",
        type: "list",
        label: "Paragraphs (one per line)",
        labelZh: "段落（每行一段）",
        itemLabel: bi("paragraph", "段落"),
        rows: 3,
      },
      { key: "ctaLabel", type: "text", label: "Button Text", labelZh: "按钮文字", placeholder: "e.g. Read Our Story" },
      { key: "ctaHref", type: "link", label: "Button Link", labelZh: "按钮链接" },
      { key: "image", type: "image", label: "Image (optional)", labelZh: "图片（可选）" },
    ],
  },
  "content.promo1": {
    kind: "object",
    fields: [
      { key: "eyebrow", type: "text", label: "Overline", labelZh: "眉题", placeholder: "e.g. Modern Manufacturing" },
      { key: "title", type: "text", label: "Title", labelZh: "标题", placeholder: "e.g. Quality Electronics" },
      { key: "body", type: "textarea", label: "Description", labelZh: "描述", rows: 4 },
      {
        key: "features",
        type: "array",
        label: "Benefit Points",
        labelZh: "卖点",
        itemLabel: bi("Benefit", "卖点"),
        fields: [
          { key: "title", type: "text", label: "Heading", labelZh: "小标题", placeholder: "e.g. Factory-Direct Pricing" },
          { key: "description", type: "textarea", label: "Description", labelZh: "描述", rows: 2 },
        ],
      },
      { key: "ctaLabel", type: "text", label: "Button Text", labelZh: "按钮文字", placeholder: "e.g. View All Electronics" },
      { key: "ctaHref", type: "link", label: "Button Link", labelZh: "按钮链接" },
      { key: "image", type: "image", label: "Image (optional)", labelZh: "图片（可选）" },
    ],
  },
  "content.testimonials": {
    kind: "array",
    itemLabel: bi("Testimonial", "客户评价"),
    fields: [
      { key: "name", type: "text", label: "Name", labelZh: "姓名", placeholder: "e.g. Sarah M." },
      { key: "location", type: "text", label: "Location", labelZh: "地区", placeholder: "e.g. New York" },
      { key: "rating", type: "number", label: "Rating (1–5)", labelZh: "评分（1–5）", placeholder: "5" },
      { key: "text", type: "textarea", label: "Quote", labelZh: "原话", rows: 3 },
      { key: "product", type: "text", label: "Product (optional)", labelZh: "产品（可选）", placeholder: "e.g. LED Motion Sensor Night Light" },
    ],
  },
  "content.instagram": {
    kind: "object",
    fields: [
      { key: "handle", type: "text", label: "Handle", labelZh: "账号", placeholder: "e.g. @commoditychina" },
      { key: "handleUrl", type: "url", label: "Profile Link", labelZh: "主页链接", placeholder: "https://instagram.com/..." },
      { key: "tagline", type: "text", label: "Tagline", labelZh: "标语", placeholder: "e.g. Tag us @commoditychina  #hashtag" },
      {
        key: "posts",
        type: "list",
        label: "Featured post images (URLs)",
        labelZh: "精选图片（URL）",
        itemLabel: bi("image", "图片"),
        listEntry: "text",
        placeholder: "https://.../image.jpg",
      },
    ],
  },
}

function isImageKey(key: string): boolean {
  return key.includes("logo") || key.includes("favicon") || key.includes("ogImage")
}

export default function SettingsForm({ groups }: { groups?: SettingGroup[] }) {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const activeGroups = groups && groups.length > 0 ? groups : SETTING_GROUP_ORDER

  useEffect(() => {
    fetchJsonResponse<any>("/api/admin/settings", { cache: "no-store" })
      .then(({ parsed, data }) => {
        if (!parsed.ok) throw new Error(responseErrorMessage(parsed, bi("Failed to load settings", "加载设置失败")))
        const payload = (data || {}) as any
        if (payload.settings) setSettings(payload.settings)
      })
      .catch((e: any) => toast.error(e?.message || bi("Failed to load settings", "加载设置失败")))
      .finally(() => setLoading(false))
  }, [])

  const update = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const { data } = await fetchJsonOrThrow<any>(
        "/api/admin/settings",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ settings }),
        },
        bi("Save failed", "保存失败")
      )
      const payload = (data || {}) as any
      if (payload.settings) setSettings(payload.settings)
      toast.success(bi("Settings saved", "设置已保存"))
    } catch (e) {
      toast.error(e instanceof Error ? e.message : bi("Save failed", "保存失败"))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-sm text-stone py-8">{bi("Loading settings...", "正在加载设置...")}</div>
  }

  return (
    <form onSubmit={handleSave} className="space-y-8">
      {activeGroups.map((group) => {
        const keys = SETTING_KEYS.filter((k) => k.group === group)
        return (
          <div key={group} className="bg-white border border-mist p-8 space-y-5">
            <h2 className="font-serif text-lg">{GROUP_TITLES[group]}</h2>
            {keys.map((meta) => {
              const currentValue = settings[meta.key] || ""
              const schema = STRUCTURED_FIELDS[meta.key]
              return (
                <div key={meta.key}>
                  <label className="block text-sm text-stone mb-2">
                    {meta.label}
                    <span className="text-stone/70"> / {meta.labelZh}</span>
                  </label>
                  {schema ? (
                    <div className="bg-mist/50 border border-mist p-4">
                      <StructuredContentEditor
                        schema={schema}
                        value={currentValue}
                        onChange={(json) => update(meta.key, json)}
                        description={bi("Edit in plain text — no JSON needed. Changes show on the homepage after you click Save Settings.", "可直接按字段编辑，无需 JSON。点击“保存设置”后会显示在首页。")}
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
                      <option value="en">{bi("English", "英语")}</option>
                      <option value="zh">{bi("Chinese", "中文")}</option>
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
          {saving ? bi("Saving...", "保存中...") : bi("Save Settings", "保存设置")}
        </button>
      </div>
    </form>
  )
}
