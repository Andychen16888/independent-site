"use client"

import { useState } from "react"
import ImageUploader from "@/components/admin/ImageUploader"
import { bi } from "@/components/admin/bilingual"

export interface FieldDef {
  key: string
  type: "text" | "textarea" | "url" | "number" | "image" | "list" | "array"
  label: string
  placeholder?: string
  rows?: number
  itemLabel?: string
  listEntry?: "text" | "textarea"
  fields?: FieldDef[]
}

export type StructuredSchema =
  | { kind: "object"; fields: FieldDef[] }
  | { kind: "array"; itemLabel: string; fields: FieldDef[] }

const INPUT_CLS =
  "w-full px-4 py-3 bg-transparent border border-mist focus:border-charcoal outline-none text-sm transition-colors"

function emptyObject(fields: FieldDef[]): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const f of fields) {
    if (f.type === "list" || f.type === "array") out[f.key] = []
    else out[f.key] = ""
  }
  return out
}

function safeParse(raw: string): { ok: boolean; data: unknown } {
  if (!raw.trim()) return { ok: true, data: null }
  try {
    return { ok: true, data: JSON.parse(raw) }
  } catch {
    return { ok: false, data: null }
  }
}

function StringListField({
  field,
  items,
  onChange,
}: {
  field: FieldDef
  items: string[]
  onChange: (next: string[]) => void
}) {
  const update = (i: number, v: string) => {
    const next = [...items]
    next[i] = v
    onChange(next)
  }
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i))
  const add = () => onChange([...items, ""])

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-2">
          {field.listEntry === "text" ? (
            <input
              type="text"
              value={item}
              onChange={(e) => update(i, e.target.value)}
              placeholder={field.placeholder}
              className={INPUT_CLS}
            />
          ) : (
            <textarea
              value={item}
              rows={field.rows || 2}
              onChange={(e) => update(i, e.target.value)}
              placeholder={field.placeholder}
              className={INPUT_CLS}
            />
          )}
          <button
            type="button"
            onClick={() => remove(i)}
            className="text-[11px] uppercase tracking-wider text-rosegold hover:underline shrink-0 mt-3"
          >
            {bi("Remove", "移除")}
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="text-[11px] uppercase tracking-wider text-charcoal hover:underline"
      >
        + {bi("Add", "添加")} {field.itemLabel || bi("item", "项")}
      </button>
    </div>
  )
}

function ObjectListField({
  itemLabel,
  fields,
  items,
  onChange,
}: {
  itemLabel: string
  fields: FieldDef[]
  items: Record<string, unknown>[]
  onChange: (next: Record<string, unknown>[]) => void
}) {
  const update = (i: number, key: string, v: unknown) => {
    const next = [...items]
    next[i] = { ...next[i], [key]: v }
    onChange(next)
  }
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i))
  const add = () => onChange([...items, emptyObject(fields)])

  return (
    <div className="space-y-4">
      {items.map((item, i) => (
        <div key={i} className="border border-mist p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-stone">
              {itemLabel} {i + 1}
            </span>
            <button
              type="button"
              onClick={() => remove(i)}
              className="text-[11px] uppercase tracking-wider text-rosegold hover:underline"
            >
              {bi("Remove", "移除")}
            </button>
          </div>
          {fields.map((f) => (
            <Field key={f.key} field={f} value={item[f.key]} onChange={(v) => update(i, f.key, v)} />
          ))}
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="text-[11px] uppercase tracking-wider text-charcoal hover:underline"
      >
        + {bi("Add", "添加")} {itemLabel}
      </button>
    </div>
  )
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: FieldDef
  value: unknown
  onChange: (v: unknown) => void
}) {
  if (field.type === "list") {
    return (
      <StringListField
        field={field}
        items={Array.isArray(value) ? (value as string[]) : []}
        onChange={onChange}
      />
    )
  }
  if (field.type === "array") {
    return (
      <ObjectListField
        itemLabel={field.itemLabel || "Item"}
        fields={field.fields || []}
        items={Array.isArray(value) ? (value as Record<string, unknown>[]) : []}
        onChange={onChange}
      />
    )
  }
  if (field.type === "image") {
    return <ImageUploader value={(value as string) || ""} onChange={(url) => onChange(url)} />
  }
  if (field.type === "number") {
    return (
      <input
        type="number"
        min={0}
        value={(value as string | number) ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        className={INPUT_CLS}
      />
    )
  }
  if (field.type === "textarea") {
    return (
      <textarea
        value={(value as string) ?? ""}
        rows={field.rows || 4}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        className={INPUT_CLS}
      />
    )
  }
  return (
    <input
      type={field.type === "url" ? "url" : "text"}
      value={(value as string) ?? ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.placeholder}
      className={INPUT_CLS}
    />
  )
}

function Field({
  field,
  value,
  onChange,
}: {
  field: FieldDef
  value: unknown
  onChange: (v: unknown) => void
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm text-stone">{field.label}</label>
      <FieldInput field={field} value={value} onChange={onChange} />
    </div>
  )
}

/**
 * Natural-language editor for JSON content settings. Non-technical staff can
 * fill in labelled fields — the editor serializes the result to the JSON the
 * storefront already understands. Data is stored exactly as before.
 */
export default function StructuredContentEditor({
  schema,
  value,
  onChange,
  description,
}: {
  schema: StructuredSchema
  value: string
  onChange: (json: string) => void
  description?: string
}) {
  const [warned] = useState(() => {
    const parsed = safeParse(value)
    return !parsed.ok
  })
  const [state, setState] = useState<unknown>(() => {
    const parsed = safeParse(value)
    if (schema.kind === "object") {
      const base = parsed.data && typeof parsed.data === "object" && !Array.isArray(parsed.data)
        ? (parsed.data as Record<string, unknown>)
        : {}
      return { ...emptyObject(schema.fields), ...base }
    }
    const items = Array.isArray(parsed.data)
      ? (parsed.data as unknown[]).filter((v): v is Record<string, unknown> => !!v && typeof v === "object")
      : []
    return items.map((item) => ({ ...emptyObject(schema.fields), ...item }))
  })

  const commit = (next: unknown) => {
    setState(next)
    onChange(JSON.stringify(next))
  }

  return (
    <div className="space-y-4">
      {description && <p className="text-xs text-stone">{description}</p>}
      {warned && (
        <p className="text-xs text-rosegold">
          {bi("Existing data could not be read and will be replaced when you save.", "现有数据无法读取，保存时将被覆盖。")}
        </p>
      )}
      {schema.kind === "object" ? (
        <div className="space-y-4">
          {schema.fields.map((f) => (
            <Field
              key={f.key}
              field={f}
              value={(state as Record<string, unknown>)[f.key]}
              onChange={(v) => commit({ ...(state as Record<string, unknown>), [f.key]: v })}
            />
          ))}
        </div>
      ) : (
        <ObjectListField
          itemLabel={schema.itemLabel}
          fields={schema.fields}
          items={state as Record<string, unknown>[]}
          onChange={(items) => commit(items)}
        />
      )}
    </div>
  )
}
