"use client"

import { useEffect, useState } from "react"
import { toast } from "react-hot-toast"
import { APP_LOCALES, LOCALE_NAMES, type AppLocale } from "@/lib/i18n/locales"
import { bi } from "@/components/admin/bilingual"
import { fetchJsonOrThrow, fetchJsonResponse, responseErrorMessage } from "@/lib/json-response"
import type { FooterContent, FooterLocaleContent } from "@/lib/settings/footer"

type FooterDefaults = Record<string, { brief: string; address: string }>
type FooterFallback = { brief: string; address: string }
type FooterResponse = {
  content?: FooterContent
  defaults?: FooterDefaults
  fallback?: FooterFallback
}

const FIELDS: {
  key: keyof FooterLocaleContent
  label: string
  labelZh: string
  rows: number
}[] = [
  { key: "brief", label: "Company description", labelZh: "公司简介", rows: 5 },
  { key: "address", label: "Company address", labelZh: "公司地址", rows: 3 },
]

const EMPTY_FALLBACK: FooterFallback = { brief: "", address: "" }

export default function FooterManager() {
  const [content, setContent] = useState<FooterContent>({})
  const [defaults, setDefaults] = useState<FooterDefaults>({})
  const [fallback, setFallback] = useState<FooterFallback>(EMPTY_FALLBACK)
  const [locale, setLocale] = useState<AppLocale>("en")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchJsonResponse<FooterResponse>("/api/admin/footer", { cache: "no-store" })
      .then(({ parsed, data }) => {
        if (!parsed.ok) throw new Error(responseErrorMessage(parsed, bi("Failed to load footer content", "加载页脚内容失败")))
        const payload = data || {}
        setContent(payload.content || {})
        setDefaults(payload.defaults || {})
        setFallback(payload.fallback || EMPTY_FALLBACK)
      })
      .catch((e: unknown) => toast.error(e instanceof Error ? e.message : bi("Failed to load footer content", "加载页脚内容失败")))
      .finally(() => setLoading(false))
  }, [])

  const update = (field: keyof FooterLocaleContent, value: string) => {
    setContent((prev) => ({
      ...prev,
      [locale]: { ...(prev[locale] || {}), [field]: value },
    }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const { data } = await fetchJsonOrThrow<FooterResponse>(
        "/api/admin/footer",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        },
        bi("Save failed", "保存失败")
      )
      if (data?.content) setContent(data.content)
      toast.success(bi("Footer content saved", "页脚内容已保存"))
    } catch (e) {
      toast.error(e instanceof Error ? e.message : bi("Save failed", "保存失败"))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-sm text-stone py-8">{bi("Loading footer content...", "正在加载页脚内容...")}</div>
  }

  const effectiveFallback = (field: keyof FooterLocaleContent) =>
    fallback[field] || defaults[locale]?.[field] || ""

  return (
    <form onSubmit={handleSave} className="space-y-8">
      <div className="bg-white border border-mist p-8 space-y-4">
        <h2 className="font-serif text-lg">{bi("Description and address", "公司简介与地址")}</h2>
        <p className="text-sm text-stone leading-relaxed">
          {bi(
            "Each language can have its own footer description and address. Leave a field empty to use the fallback shown below; the fallback comes from the shared company intro/address in Settings, then from the built-in translation file.",
            "每种语言都可以单独设置页脚简介和地址。留空会使用下方显示的备用内容：优先取“设置”中的共享公司简介/地址，其次取内置语言文件。"
          )}
        </p>

        <div className="flex flex-wrap gap-2 border-b border-mist pb-4">
          {APP_LOCALES.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setLocale(item)}
              className={`px-4 py-2 text-sm border transition-colors ${
                item === locale
                  ? "border-charcoal bg-charcoal text-white"
                  : "border-mist text-stone hover:border-charcoal"
              }`}
            >
              {LOCALE_NAMES[item]}
            </button>
          ))}
        </div>

        {FIELDS.map((field) => {
          const fallbackText = effectiveFallback(field.key)
          return (
            <div key={field.key}>
              <label className="block text-sm text-stone mb-2">
                {field.label}
                <span className="text-stone/70"> / {field.labelZh}</span>
              </label>
              <textarea
                value={content[locale]?.[field.key] || ""}
                onChange={(e) => update(field.key, e.target.value)}
                rows={field.rows}
                placeholder={fallbackText}
                className="w-full px-4 py-3 bg-transparent border border-mist focus:border-charcoal outline-none text-sm transition-colors"
              />
              <p className="mt-2 text-xs text-stone/70">
                {bi("Fallback:", "备用内容：")} {fallbackText || bi("(empty)", "（空）")}
              </p>
            </div>
          )
        })}
      </div>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center px-8 py-3 bg-charcoal text-white text-sm tracking-widest uppercase font-light transition-all duration-300 hover:bg-charcoal/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? bi("Saving...", "保存中...") : bi("Save Footer", "保存页脚")}
        </button>
      </div>
    </form>
  )
}
