"use client"

import { useState } from "react"
import { localeNames } from "@/i18n/routing"

export interface TranslationFields {
  locale: string
  title: string
  excerpt: string
  content: string
  seoTitle: string
  seoDescription: string
  seoKeywords: string
}

const LOCALES: string[] = ["zh", "es", "pt", "fr", "de", "ru", "ar", "id", "vi", "th", "ms"]

interface Props {
  value: TranslationFields[]
  onChange: (next: TranslationFields[]) => void
  includeContent?: boolean
}

export default function TranslationsEditor({ value, onChange, includeContent = true }: Props) {
  const [active, setActive] = useState<string>(LOCALES[0])

  const indexOf = (locale: string) => value.findIndex((t) => t.locale === locale)
  const hasContent = (t?: TranslationFields) =>
    t && (t.title.trim() || t.excerpt.trim() || t.content.trim() || t.seoTitle.trim())

  const update = (locale: string, patch: Partial<Omit<TranslationFields, "locale">>) => {
    const i = indexOf(locale)
    if (i === -1) {
      onChange([
        ...value,
        { locale, title: "", excerpt: "", content: "", seoTitle: "", seoDescription: "", seoKeywords: "", ...patch },
      ])
      return
    }
    onChange(value.map((t, idx) => (idx === i ? { ...t, ...patch } : t)))
  }

  const remove = (locale: string) => {
    onChange(value.filter((t) => t.locale !== locale))
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
              <span className={`ml-1.5 ${hasContent(t) ? "text-sage" : "text-stone"}`}>{hasContent(t) ? "fill" : "empty"}</span>
            </button>
          )
        })}
      </div>

      <div className="space-y-4 border border-mist bg-white p-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wider text-stone font-medium">
            {localeNames[active]} <span className="normal-case">(optional — falls back to English)</span>
          </span>
          {indexOf(active) !== -1 && (
            <button type="button" onClick={() => remove(active)} className="text-[10px] text-rosegold hover:underline">
              Remove this translation
            </button>
          )}
        </div>
        <div>
          <label className={label}>{includeContent ? "Localized Title" : "Title"}</label>
          <input value={(value.find((t) => t.locale === active)?.title) || ""} onChange={(e) => update(active, { title: e.target.value })} className={input} />
        </div>
        <div>
          <label className={label}>Excerpt</label>
          <textarea value={(value.find((t) => t.locale === active)?.excerpt) || ""} onChange={(e) => update(active, { excerpt: e.target.value })} rows={2} className={input} />
        </div>
        {includeContent && (
          <div>
            <label className={label}>Content (HTML) — leave empty to keep the English body.</label>
            <textarea value={(value.find((t) => t.locale === active)?.content) || ""} onChange={(e) => update(active, { content: e.target.value })} rows={8} className={input} />
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-mist">
          <div>
            <label className={label}>SEO Title</label>
            <input value={(value.find((t) => t.locale === active)?.seoTitle) || ""} onChange={(e) => update(active, { seoTitle: e.target.value })} className={input} />
          </div>
          <div>
            <label className={label}>SEO Description</label>
            <textarea value={(value.find((t) => t.locale === active)?.seoDescription) || ""} onChange={(e) => update(active, { seoDescription: e.target.value })} rows={2} className={input} />
          </div>
          <div>
            <label className={label}>SEO Keywords</label>
            <input value={(value.find((t) => t.locale === active)?.seoKeywords) || ""} onChange={(e) => update(active, { seoKeywords: e.target.value })} className={input} />
          </div>
        </div>
      </div>
    </div>
  )
}