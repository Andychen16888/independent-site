"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { Container } from "@/components/ui/Container"
import { AccountSidebar } from "@/components/account/AccountSidebar"
import { Button } from "@/components/ui/Button"
import { toast } from "react-hot-toast"
import { fetchJsonResponse, responseErrorMessage } from "@/lib/json-response"

interface Address {
  id: string
  firstName: string
  lastName: string
  street: string
  street2?: string
  city: string
  state: string
  zipCode: string
  country: string
  phone?: string
  isDefault: boolean
}

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    firstName: "", lastName: "", street: "", street2: "",
    city: "", state: "", zipCode: "", country: "US", phone: "", isDefault: false,
  })
  const t = useTranslations("account.addresses")

  useEffect(() => {
    fetchJsonResponse("/api/addresses")
      .then(({ parsed, data }) => {
        if (!parsed.ok || !Array.isArray(data)) throw new Error(responseErrorMessage(parsed, t("saveFailed")))
        setAddresses(data as unknown as Address[])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const resetForm = () => setForm({ firstName: "", lastName: "", street: "", street2: "", city: "", state: "", zipCode: "", country: "US", phone: "", isDefault: false })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const method = editingId ? "PUT" : "POST"
    const url = editingId ? `/api/addresses/${editingId}` : "/api/addresses"
    try {
      const { parsed, data } = await fetchJsonResponse(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (parsed.ok) {
        const updated = data as Address
        setAddresses((prev) =>
          editingId ? prev.map((a) => (a.id === editingId ? updated : a)) : [...prev, updated]
        )
        setShowForm(false); setEditingId(null); resetForm()
        toast.success(editingId ? t("updated") : t("added"))
      } else {
        toast.error(responseErrorMessage(parsed, t("saveFailed")))
      }
    } catch { toast.error(t("saveFailed")) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm(t("deleteConfirm"))) return
    try {
      const res = await fetch(`/api/addresses/${id}`, { method: "DELETE" })
      if (res.ok) { setAddresses((p) => p.filter((a) => a.id !== id)); toast.success(t("deleted")) }
    } catch { toast.error(t("deleteFailed")) }
  }

  return (
    <div className="min-h-screen">
      <Container>
        <h1 className="heading-xl mb-12">{t("title")}</h1>
        <div className="grid md:grid-cols-[240px_1fr] gap-8 lg:gap-12">
          <AccountSidebar />
          <div>
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-stone">{t("count", { count: addresses.length })}</p>
              <Button onClick={() => { setShowForm(true); setEditingId(null); resetForm() }}>
                {t("addAddress")}
              </Button>
            </div>

            {showForm && (
              <form onSubmit={handleSubmit} className="bg-cream p-6 mb-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" placeholder={t("firstNamePlaceholder")} value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required className="w-full px-4 py-3 bg-transparent border border-charcoal/20 focus:border-charcoal outline-none text-sm" />
                  <input type="text" placeholder={t("lastNamePlaceholder")} value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required className="w-full px-4 py-3 bg-transparent border border-charcoal/20 focus:border-charcoal outline-none text-sm" />
                </div>
                <input type="text" placeholder={t("addressPlaceholder")} value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} required className="w-full px-4 py-3 bg-transparent border border-charcoal/20 focus:border-charcoal outline-none text-sm" />
                <input type="text" placeholder={t("apartmentPlaceholder")} value={form.street2} onChange={(e) => setForm({ ...form, street2: e.target.value })} className="w-full px-4 py-3 bg-transparent border border-charcoal/20 focus:border-charcoal outline-none text-sm" />
                <div className="grid grid-cols-3 gap-4">
                  <input type="text" placeholder={t("cityPlaceholder")} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required className="w-full px-4 py-3 bg-transparent border border-charcoal/20 focus:border-charcoal outline-none text-sm" />
                  <input type="text" placeholder={t("statePlaceholder")} value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} required className="w-full px-4 py-3 bg-transparent border border-charcoal/20 focus:border-charcoal outline-none text-sm" />
                  <input type="text" placeholder={t("zipPlaceholder")} value={form.zipCode} onChange={(e) => setForm({ ...form, zipCode: e.target.value })} required className="w-full px-4 py-3 bg-transparent border border-charcoal/20 focus:border-charcoal outline-none text-sm" />
                </div>
                <input type="tel" placeholder={t("phonePlaceholder")} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-4 py-3 bg-transparent border border-charcoal/20 focus:border-charcoal outline-none text-sm" />
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} className="accent-charcoal" />
                  {t("setDefault")}
                </label>
                <div className="flex gap-3">
                  <Button type="submit">{editingId ? t("update") : t("save")}</Button>
                  <button type="button" onClick={() => { setShowForm(false); setEditingId(null) }} className="btn-outline">{t("cancel")}</button>
                </div>
              </form>
            )}

            <div className="space-y-4">
              {loading ? (
                <div className="animate-pulse space-y-4">
                  {[1, 2].map((i) => <div key={i} className="h-24 bg-mist rounded" />)}
                </div>
              ) : addresses.length === 0 ? (
                <div className="bg-cream p-12 text-center">
                  <p className="text-body text-sm">{t("noAddresses")}</p>
                </div>
              ) : (
                addresses.map((addr) => (
                  <div key={addr.id} className="bg-cream p-6 flex justify-between items-start">
                    <div>
                      {addr.isDefault && <span className="text-xs text-sage tracking-wider uppercase mb-1 block">{t("defaultBadge")}</span>}
                      <p className="text-sm font-medium">{addr.firstName} {addr.lastName}</p>
                      <p className="text-sm text-stone">{addr.street}{addr.street2 ? `, ${addr.street2}` : ""}</p>
                      <p className="text-sm text-stone">{addr.city}, {addr.state} {addr.zipCode}</p>
                      {addr.phone && <p className="text-sm text-stone">{addr.phone}</p>}
                    </div>
                    <div className="flex gap-3 text-xs">
                      <button onClick={() => { setForm({ firstName: addr.firstName, lastName: addr.lastName, street: addr.street, street2: addr.street2 || "", city: addr.city, state: addr.state, zipCode: addr.zipCode, country: addr.country, phone: addr.phone || "", isDefault: addr.isDefault }); setEditingId(addr.id); setShowForm(true) }} className="text-stone hover:text-charcoal underline underline-offset-4">{t("edit")}</button>
                      <button onClick={() => handleDelete(addr.id)} className="text-rosegold hover:text-rosegold/80 underline underline-offset-4">{t("delete")}</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </Container>
    </div>
  )
}
