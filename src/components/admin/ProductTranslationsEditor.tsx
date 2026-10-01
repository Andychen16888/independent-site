"use client"

import { useState, type ClipboardEvent } from "react"
import { localeNames } from "@/i18n/routing"
import { bi } from "@/components/admin/bilingual"
import { normalizePastedHtml } from "@/lib/editor/clipboard"

export interface ProductTranslationFields {
  locale: string
  name: string
  shortDescription: string
  description: string
  seoTitle: string
  seoDescription: string
}

const LOCALES: string[] = ["zh", "es", "pt", "fr", "de", "ru", "ar", "id", "vi", "th", "ms"]

interface Props {
  value: ProductTranslationFields[]
  onChange: (next: ProductTranslationFields[]) => void
}

export default function ProductTranslationsEditor({ value, onChange }: Props) {
  const [active, setActive] = useState<string>(LOCALES[0])

  const indexOf = (locale: string) => value.findIndex((t) => t.locale === locale)
  const hasContent = (t?: ProductTranslationFields) =>
    t && (t.name.trim() || t.shortDescription.trim() || t.description.trim() || t.seoTitle.trim())

  const update = (locale: string, patch: Partial<Omit<ProductTranslationFields, "locale">>) => {
    const i = indexOf(locale)
    if (i === -1) {
      onChange([
        ...value,
        { locale, name: "", shortDescription: "", description: "", seoTitle: "", seoDescription: "", ...patch },
      ])
      return
    }
    onChange(value.map((t, idx) => (idx === i ? { ...t, ...patch } : t)))
  }

  const remove = (locale: string) => {
    onChange(value.filter((t) => t.locale !== locale))
  }

  const handleDescriptionPaste = (event: ClipboardEvent<HTMLTextAreaElement>) => {
    const html = event.clipboardData?.getData("text/html") || ""
    if (!html.trim()) return
    const normalized = normalizePastedHtml(html)
    if (!normalized.trim()) return

    event.preventDefault()
    const target = event.currentTarget
    const start = target.selectionStart
    const end = target.selectionEnd
    update(active, { description: `${target.value.slice(0, start)}${normalized}${target.value.slice(end)}` })

    requestAnimationFrame(() => {
      target.focus()
      target.setSelectionRange(start + normalized.length, start + normalized.length)
    })
  }

  const input = "w-full border border-mist bg-white px-3 py-2 text-sm outline-none focus:border-charcoal transition-colors"
  const label = "block text-xs uppercase tracking-wider text-stone font-medium mb-1.5"

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-4">
        {LOCALES.map((l) => {
          const t = value.find((tr) => tr.locale === l)
          return (
            <button
              key={l}
              type="button"
              onClick={() => setActive(l)}
              className={`px-3 py-1.5 text-xs border transition-colors ${
                active === l ? "bg-charcoal text-ivory border-charcoal" : "border-mist bg-white hover:border-charcoal"
              }`}
            >
              {localeNames[l]}
              <span className={`ml-1.5 ${hasContent(t) ? "text-sage" : "text-stone"}`}>{hasContent(t) ? bi("fill", "已填写") : bi("empty", "未填写")}</span>
            </button>
          )
        })}
      </div>

      <div className="space-y-4 border border-mist bg-white p-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wider text-stone font-medium">
            {localeNames[active]} <span className="normal-case">({bi("optional — falls back to English", "可选，留空将回退英文")})</span>
          </span>
          {indexOf(active) !== -1 && (
            <button type="button" onClick={() => remove(active)} className="text-[10px] text-rosegold hover:underline">
              {bi("Remove this translation", "移除此翻译")}
            </button>
          )}
        </div>
        <div>
          <label className={label}>{bi("Localized Name *", "本地化名称 *")}</label>
          <input value={(value.find((t) => t.locale === active)?.name) || ""} onChange={(e) => update(active, { name: e.target.value })} className={input} />
        </div>
        <div>
          <label className={label}>{bi("Short Description", "简短描述")}</label>
          <textarea value={(value.find((t) => t.locale === active)?.shortDescription) || ""} onChange={(e) => update(active, { shortDescription: e.target.value })} rows={2} className={input} />
        </div>
        <div>
          <label className={label}>{bi("Description (HTML) — leave empty to keep the English body.", "产品描述（HTML）— 留空则使用英文正文。")}</label>
          <textarea
            value={(value.find((t) => t.locale === active)?.description) || ""}
            onChange={(e) => update(active, { description: e.target.value })}
            onPaste={handleDescriptionPaste}
            rows={8}
            className={input}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-mist">
          <div>
            <label className={label}>{bi("SEO Title", "SEO 标题")}</label>
            <input value={(value.find((t) => t.locale === active)?.seoTitle) || ""} onChange={(e) => update(active, { seoTitle: e.target.value })} className={input} />
          </div>
          <div>
            <label className={label}>{bi("SEO Description", "SEO 描述")}</label>
            <textarea value={(value.find((t) => t.locale === active)?.seoDescription) || ""} onChange={(e) => update(active, { seoDescription: e.target.value })} rows={2} className={input} />
          </div>
        </div>
      </div>
    </div>
  )
}
