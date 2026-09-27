"use client"

import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { bi } from "@/components/admin/bilingual"

type Template = {
  id: string
  name: string
  subject: string
  body: string
  updatedAt: string
}

const INPUT_CLS =
  "w-full border border-mist px-4 py-3 text-sm bg-white focus:border-charcoal focus:outline-none"

/**
 * Reusable campaign content.
 *
 * Templates only store copy; the audience is always the live subscriber list at
 * send time, so saving a template can never mail a stale address list.
 */
export function NewsletterTemplateBar({
  subject,
  body,
  onLoad,
}: {
  subject: string
  body: string
  onLoad: (t: { subject: string; body: string }) => void
}) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [selected, setSelected] = useState("")
  const [name, setName] = useState("")
  const [busy, setBusy] = useState(false)

  async function load() {
    try {
      const res = await fetch("/api/admin/newsletter/templates", { cache: "no-store" })
      if (!res.ok) return
      const data = await res.json()
      setTemplates(data.templates ?? [])
    } catch {
      // Non-fatal: the bar just shows no templates.
    }
  }

  useEffect(() => {
    void load()
  }, [])

  function apply() {
    const t = templates.find((x) => x.id === selected)
    if (!t) {
      toast.error(bi("Pick a template first", "请先选择一个模板"))
      return
    }
    onLoad({ subject: t.subject, body: t.body })
    toast.success(bi("Template loaded", "模板已载入"))
  }

  async function save() {
    const trimmed = name.trim()
    if (!trimmed) {
      toast.error(bi("Give the template a name", "请填写模板名称"))
      return
    }
    if (!subject.trim() || !body.trim()) {
      toast.error(bi("Fill in the subject and body first", "请先填写主题和正文"))
      return
    }
    setBusy(true)
    try {
      const res = await fetch("/api/admin/newsletter/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed, subject, body }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || bi("Failed to save template", "保存模板失败"))
      setName("")
      await load()
      toast.success(bi("Template saved", "模板已保存"))
    } catch (e) {
      toast.error(e instanceof Error ? e.message : bi("Failed to save template", "保存模板失败"))
    } finally {
      setBusy(false)
    }
  }

  async function remove(id: string) {
    if (!window.confirm(bi("Delete this template?", "确定删除该模板？"))) return
    try {
      const res = await fetch(`/api/admin/newsletter/templates/${id}`, { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || bi("Failed to delete", "删除失败"))
      }
      if (selected === id) setSelected("")
      await load()
      toast.success(bi("Template deleted", "模板已删除"))
    } catch (e) {
      toast.error(e instanceof Error ? e.message : bi("Failed to delete", "删除失败"))
    }
  }

  return (
    <div className="bg-white border border-mist p-6 space-y-4">
      <div>
        <h3 className="font-serif text-base mb-1">{bi("Templates", "模板库")}</h3>
        <p className="text-[11px] text-stone">
          {bi(
            "Save the current subject and body to reuse them next time.",
            "把当前主题和正文保存下来，下次直接复用。"
          )}
        </p>
      </div>

      {templates.length > 0 && (
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[11px] uppercase tracking-wider text-stone mb-2">
              {bi("Saved templates", "已保存模板")}
            </label>
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              className={INPUT_CLS}
            >
              <option value="">{bi("Select a template", "选择模板")}</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={apply}
            disabled={!selected}
            className="px-5 py-3 border border-charcoal text-charcoal text-xs tracking-widest uppercase transition-colors hover:bg-charcoal hover:text-white disabled:opacity-50"
          >
            {bi("Load", "载入")}
          </button>
          <button
            type="button"
            onClick={() => selected && remove(selected)}
            disabled={!selected}
            className="px-5 py-3 border border-stone/40 text-stone text-xs tracking-widest uppercase transition-colors hover:border-charcoal disabled:opacity-50"
          >
            {bi("Delete", "删除")}
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-end gap-2">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-[11px] uppercase tracking-wider text-stone mb-2">
            {bi("Save current content as", "将当前内容保存为")}
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            placeholder={bi("e.g. Monthly price update", "例如：每月报价更新")}
            className={INPUT_CLS}
          />
        </div>
        <button
          type="button"
          onClick={save}
          disabled={busy}
          className="px-5 py-3 bg-charcoal text-white text-xs tracking-widest uppercase transition-colors hover:bg-charcoal/90 disabled:opacity-50"
        >
          {bi("Save Template", "保存模板")}
        </button>
      </div>
    </div>
  )
}
