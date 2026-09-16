"use client"

import { useEffect, useState } from "react"
import { toast } from "react-hot-toast"
import { SETTING_KEYS, SETTING_GROUP_ORDER, type SettingGroup } from "@/lib/settings/keys"
import ImageUploader from "@/components/admin/ImageUploader"

const GROUP_TITLES: Record<SettingGroup, string> = {
  site: "Site",
  content: "Homepage Content",
  contact: "Company & Contact",
  social: "Social Media",
  seo: "SEO",
  shipping: "Shipping",
  analytics: "Analytics",
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
                  return (
                    <div key={meta.key}>
                      <label className="block text-sm text-stone mb-2">{meta.label}</label>
                      {isImageKey(meta.key) ? (
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