"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "react-hot-toast"
import { bi } from "@/components/admin/bilingual"

interface MenuOption { id: string; label: string; parentId: string | null }

export default function MenuForm({ mode, menuId }: { mode: "new" | "edit"; menuId?: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(mode === "edit")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [notFound, setNotFound] = useState(false)
  const [menus, setMenus] = useState<MenuOption[]>([])
  const [form, setForm] = useState({ label: "", url: "/", parentId: "", sortOrder: "0", isActive: true })

  useEffect(() => {
    fetch("/api/admin/menus", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => setMenus((data.menus || []).filter((m: any) => m.id !== menuId)))
      .catch(() => {})
  }, [menuId])

  useEffect(() => {
    if (mode !== "edit" || !menuId) return
    fetch(`/api/admin/menus/${menuId}`, { cache: "no-store" })
      .then(async (res) => {
        if (res.status === 404) { setNotFound(true); return }
        if (!res.ok) throw new Error(bi("Failed to load menu", "加载菜单失败"))
        const data = await res.json()
        const m = data.menu
        setForm({
          label: m.label, url: m.url, parentId: m.parentId || "",
          sortOrder: String(m.sortOrder ?? 0), isActive: m.isActive !== false,
        })
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [mode, menuId])

  const update = (patch: Partial<typeof form>) => setForm((prev) => ({ ...prev, ...patch }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError("")
    try {
      const url = mode === "edit" ? `/api/admin/menus/${menuId}` : "/api/admin/menus"
      const res = await fetch(url, {
        method: mode === "edit" ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, parentId: form.parentId || null, sortOrder: form.sortOrder !== "" ? form.sortOrder : 0 }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || bi("Failed to save menu item", "保存菜单项失败"))
      toast.success(mode === "edit" ? bi("Menu item updated", "菜单项已更新") : bi("Menu item created", "菜单项已创建"))
      router.push("/admin/menus")
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="text-sm text-stone p-8">{bi("Loading menu item...", "正在加载菜单项...")}</div>
  if (notFound) return <div className="text-sm text-rosegold p-8">{bi("Menu item not found.", "未找到菜单项。")}</div>

  const input = "w-full border border-mist bg-white px-3 py-2 text-sm outline-none focus:border-charcoal transition-colors"
  const label = "block text-xs uppercase tracking-wider text-stone font-medium mb-1.5"

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-6">
      {error && <div className="bg-rosegold/10 border border-rosegold/20 text-sm p-3">{error}</div>}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={label}>{bi("Label *", "名称 *")}</label>
          <input value={form.label} onChange={(e) => update({ label: e.target.value })} required className={input} placeholder={bi("e.g. Products", "例如：Products") } />
        </div>
        <div>
          <label className={label}>{bi("URL *", "链接 *")}</label>
          <input value={form.url} onChange={(e) => update({ url: e.target.value })} required className={input} placeholder="/products or /pages/about" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={label}>{bi("Parent Item", "父级菜单")}</label>
          <select value={form.parentId} onChange={(e) => update({ parentId: e.target.value })} className={input}>
            <option value="">{bi("None (top-level)", "无（顶级）")}</option>
            {menus.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>
        </div>
        <div>
          <label className={label}>{bi("Sort Order", "排序")}</label>
          <input type="number" value={form.sortOrder} onChange={(e) => update({ sortOrder: e.target.value })} className={input} />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input type="checkbox" checked={form.isActive} onChange={(e) => update({ isActive: e.target.checked })} className="w-4 h-4" />
        {bi("Active", "启用")}
      </label>

      <div className="flex items-center gap-3 pt-4 border-t border-mist">
        <button type="submit" disabled={saving} className="btn-primary text-xs">
          {saving ? bi("Saving...", "保存中...") : mode === "edit" ? bi("Save Item", "保存菜单项") : bi("Create Item", "创建菜单项")}
        </button>
        <button type="button" onClick={() => router.push("/admin/menus")} className="text-xs text-stone hover:text-charcoal transition-colors">{bi("Cancel", "取消")}</button>
      </div>
    </form>
  )
}
