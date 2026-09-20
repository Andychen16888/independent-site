"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "react-hot-toast"
import { localeNames } from "@/i18n/routing"

const LOCALES: string[] = ["en", "zh", "es", "pt", "fr", "de", "ru", "ar", "id", "vi", "th", "ms"]

interface LocaleFields {
  question: string
  answer: string
}

function emptyLocaleFields(): Record<string, LocaleFields> {
  const out: Record<string, LocaleFields> = {}
  for (const l of LOCALES) out[l] = { question: "", answer: "" }
  return out
}

export default function FaqForm({ mode, faqId }: { mode: "new" | "edit"; faqId?: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(mode === "edit")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [notFound, setNotFound] = useState(false)
  const [sortOrder, setSortOrder] = useState(0)
  const [isActive, setIsActive] = useState(true)
  const [activeLocale, setActiveLocale] = useState("en")
  const [translations, setTranslations] = useState<Record<string, LocaleFields>>(emptyLocaleFields)
  const [touched, setTouched] = useState(new Set(["en"]))

  useEffect(() => {
    if (mode !== "edit" || !faqId) return
    fetch(`/api/admin/faqs/${faqId}`, { cache: "no-store" })
      .then(async (res) => {
        if (res.status === 404) { setNotFound(true); return }
        if (!res.ok) throw new Error("Failed to load FAQ")
        const data = await res.json()
        const f = data.faq
        setSortOrder(f.sortOrder ?? 0)
        setIsActive(f.isActive === true)
        const map = emptyLocaleFields()
        const active: Set<string> = new Set()
        for (const t of f.translations || []) {
          if (map[t.locale]) {
            map[t.locale] = { question: t.question || "", answer: t.answer || "" }
            active.add(t.locale)
          }
        }
        setTranslations(map)
        setTouched(active.size ? active : new Set(["en"]))
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [mode, faqId])

  const updateLocale = (locale: string, patch: Partial<LocaleFields>) => {
    setTranslations((prev) => ({ ...prev, [locale]: { ...prev[locale], ...patch } }))
    setTouched((prev) => new Set(prev).add(locale))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const en = translations.en
    if (!en.question.trim() && !en.answer.trim()) {
      setError("The English question is required.")
      return
    }
    setSaving(true)
    setError("")
    try {
      const payload = LOCALES
        .filter((l) => touched.has(l))
        .map((l) => ({ locale: l, ...translations[l] }))
      const url = mode === "edit" ? `/api/admin/faqs/${faqId}` : "/api/admin/faqs"
      const res = await fetch(url, {
        method: mode === "edit" ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortOrder, isActive, translations: payload }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to save FAQ")
      toast.success(mode === "edit" ? "FAQ updated" : "FAQ created")
      router.push("/admin/faq")
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="text-sm text-stone p-8">Loading FAQ...</div>
  if (notFound) return <div className="text-sm text-rosegold p-8">FAQ not found.</div>

  const input = "w-full border border-mist bg-white px-3 py-2 text-sm outline-none focus:border-charcoal transition-colors"
  const label = "block text-xs uppercase tracking-wider text-stone font-medium mb-1.5"

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
      {error && <div className="bg-rosegold/10 border border-rosegold/20 text-sm p-3">{error}</div>}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={label}>Sort Order</label>
          <input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} className={input} />
        </div>
        <label className="flex items-end gap-2 text-sm cursor-pointer pb-2">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="w-4 h-4" />
          Active (visible on the FAQ page)
        </label>
      </div>

      <div>
        <label className="block text-xs uppercase tracking-wider text-stone font-medium mb-2">
          Question &amp; Answer
        </label>
        <div className="flex flex-wrap gap-1.5 mb-4">
          {LOCALES.map((l) => {
            const hasContent = translations[l]?.question?.trim() || translations[l]?.answer?.trim()
            return (
              <button
                key={l}
                type="button"
                onClick={() => setActiveLocale(l)}
                className={`px-3 py-1.5 text-xs border transition-colors ${
                  activeLocale === l
                    ? "bg-charcoal text-ivory border-charcoal"
                    : "border-mist bg-white hover:border-charcoal"
                }`}
              >
                {localeNames[l]}
                <span className={`ml-1.5 ${hasContent ? "text-sage" : "text-stone"}`}>
                  {hasContent ? "fill" : "empty"}
                </span>
              </button>
            )
          })}
        </div>

        <div className="space-y-4 border border-mist bg-white p-4">
          <div className="text-[10px] uppercase tracking-wider text-stone font-medium">{localeNames[activeLocale]}</div>
          <div>
            <label className={label}>Question</label>
            <textarea
              value={translations[activeLocale]?.question || ""}
              onChange={(e) => updateLocale(activeLocale, { question: e.target.value })}
              rows={2}
              required={activeLocale === "en"}
              className={input}
            />
          </div>
          <div>
            <label className={label}>Answer</label>
            <textarea
              value={translations[activeLocale]?.answer || ""}
              onChange={(e) => updateLocale(activeLocale, { answer: e.target.value })}
              rows={5}
              className={input}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-4 border-t border-mist">
        <button type="submit" disabled={saving} className="btn-primary text-xs">
          {saving ? "Saving..." : mode === "edit" ? "Save FAQ" : "Create FAQ"}
        </button>
        <button type="button" onClick={() => router.push("/admin/faq")} className="text-xs text-stone hover:text-charcoal transition-colors">Cancel</button>
      </div>
    </form>
  )
}