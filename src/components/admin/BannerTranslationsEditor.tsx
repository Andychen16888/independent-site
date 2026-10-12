"use client"

import { useState } from "react"
import { toast } from "react-hot-toast"
import { localeNames } from "@/i18n/routing"
import { bi } from "@/components/admin/bilingual"

export interface BannerTranslationFields {
  locale: string
  title: string
  eyebrow: string
  subtitle: string
  description: string
  ctaText: string
}

const LOCALES: string[] = ["zh", "es", "pt", "fr", "de", "ru", "ar", "id", "vi", "th", "ms"]

interface SourceFields {
  title: string
  eyebrow: string
  subtitle: string
  description: string
  ctaText: string
}

interface Props {
  value: BannerTranslationFields[]
  onChange: (next: BannerTranslationFields[]) => void
  source: SourceFields
}

function hasContent(t?: BannerTranslationFields): boolean {
  if (!t) return false
  return Boolean(
    t.title.trim() || t.eyebrow.trim() || t.subtitle.trim() || t.description.trim() || t.ctaText.trim()
  )
}

function emptyRow(locale: string): BannerTranslationFields {
  return { locale, title: "", eyebrow: "", subtitle: "", description: "", ctaText: "" }
}

export default function BannerTranslationsEditor({ value, onChange, source }: Props) {
  const [active, setActive] = useState<string>(LOCALES[0])
  const [translating, setTranslating] = useState(false)
  const [overwrite, setOverwrite] = useState(false)

  const current = value.find((t) => t.locale === active) || emptyRow(active)

  const update = (locale: string, patch: Partial<Omit<BannerTranslationFields, "locale">>) => {
    const i = value.findIndex((t) => t.locale === locale)
    if (i === -1) {
      onChange([...value, { ...emptyRow(locale), ...patch }])
      return
    }
    onChange(value.map((t, idx) => (idx === i ? { ...t, ...patch } : t)))
  }

  const merge = (incoming: BannerTranslationFields[]) => {
    const map = new Map(value.map((t) => [t.locale, t]))
    for (const t of incoming) map.set(t.locale, t)
    onChange(LOCALES.map((l) => map.get(l)).filter(Boolean) as BannerTranslationFields[])
  }

  async function handleTranslate() {
    if (!source.title.trim()) {
      toast.error(bi("Fill the English title first.", "请先填写英文标题。"))
      return
    }
    const targets = overwrite ? LOCALES : LOCALES.filter((l) => !hasContent(value.find((t) => t.locale === l)))
    if (targets.length === 0) {
      toast(bi("All languages are already filled.", "所有语言均已填写。"))
      return
    }
    setTranslating(true)
    try {
      const res = await fetch("/api/admin/banners/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...source, locales: targets }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || bi("Translation failed", "翻译失败"))
      const rows: BannerTranslationFields[] = (data.translations || []).map((t: any) => ({
        locale: t.locale,
        title: t.title || "",
        eyebrow: t.eyebrow || "",
        subtitle: t.subtitle || "",
        description: t.description || "",
        ctaText: t.ctaText || "",
      }))
      merge(rows)
      const failed = data.failed?.length || 0
      if (rows.length > 0) toast.success(bi(`Translated ${rows.length} language(s).`, `已翻译 ${rows.length} 种语言。`))
      if (failed > 0) toast.error(bi(`${failed} language(s) failed.`, `${failed} 种语言翻译失败。`))
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setTranslating(false)
    }
  }

  const input = "w-full border border-mist bg-white px-3 py-2 text-sm outline-none focus:border-charcoal transition-colors"
  const label = "block text-xs uppercase tracking-wider text-stone font-medium mb-1.5"

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <p className="text-xs text-stone max-w-md">
          {bi(
            "Edit the hero text for each language, or let AI translate the English text and refine it. Empty languages fall back to English.",
            "可逐语言填写轮播文字，也可用 AI 把英文翻译成所有语言后再人工校对。留空的语言在前台回退英文。"
          )}
        </p>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-[11px] text-stone cursor-pointer">
            <input type="checkbox" checked={overwrite} onChange={(e) => setOverwrite(e.target.checked)} className="w-3.5 h-3.5" />
            {bi("Overwrite filled", "覆盖已填写")}
          </label>
          <button
            type="button"
            onClick={handleTranslate}
            disabled={translating}
            className="text-[11px] text-charcoal border border-mist px-3 py-1.5 hover:border-charcoal transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {translating ? bi("Translating...", "翻译中...") : bi("AI translate", "AI 自动翻译")}
          </button>
        </div>
      </div>

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
              <span className={`ml-1.5 ${hasContent(t) ? "text-sage" : "text-stone"}`}>
                {hasContent(t) ? bi("fill", "已填写") : bi("empty", "未填写")}
              </span>
            </button>
          )
        })}
      </div>

      <div className="space-y-4 border border-mist bg-white p-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wider text-stone font-medium">
            {localeNames[active]} <span className="normal-case">({bi("optional — falls back to English", "可选，留空将回退英文")})</span>
          </span>
          {value.find((t) => t.locale === active) && (
            <button type="button" onClick={() => onChange(value.filter((t) => t.locale !== active))} className="text-[10px] text-rosegold hover:underline">
              {bi("Clear this language", "清空此语言")}
            </button>
          )}
        </div>
        <div>
          <label className={label}>{bi("Title", "标题")}</label>
          <input value={current.title} onChange={(e) => update(active, { title: e.target.value })} placeholder={source.title} className={input} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={label}>{bi("Eyebrow", "上方短标题")}</label>
            <input value={current.eyebrow} onChange={(e) => update(active, { eyebrow: e.target.value })} placeholder={source.eyebrow} className={input} />
          </div>
          <div>
            <label className={label}>{bi("Subtitle", "副标题")}</label>
            <input value={current.subtitle} onChange={(e) => update(active, { subtitle: e.target.value })} placeholder={source.subtitle} className={input} />
          </div>
        </div>
        <div>
          <label className={label}>{bi("Description", "描述")}</label>
          <textarea value={current.description} onChange={(e) => update(active, { description: e.target.value })} placeholder={source.description} rows={2} className={input} />
        </div>
        <div>
          <label className={label}>{bi("CTA Text", "按钮文案")}</label>
          <input value={current.ctaText} onChange={(e) => update(active, { ctaText: e.target.value })} placeholder={source.ctaText} className={input} />
        </div>
      </div>
    </div>
  )
}
