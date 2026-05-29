"use client"

import { useState, useEffect } from "react"
import { Container } from "@/components/ui/Container"
import { AccountSidebar } from "@/components/account/AccountSidebar"
import { Button } from "@/components/ui/Button"
import { toast } from "react-hot-toast"

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

  useEffect(() => {
    fetch("/api/addresses")
      .then((r) => r.json())
      .then(setAddresses)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const resetForm = () => setForm({ firstName: "", lastName: "", street: "", street2: "", city: "", state: "", zipCode: "", country: "US", phone: "", isDefault: false })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const method = editingId ? "PUT" : "POST"
    const url = editingId ? `/api/addresses/${editingId}` : "/api/addresses"
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        const updated = await res.json()
        setAddresses((prev) =>
          editingId ? prev.map((a) => (a.id === editingId ? updated : a)) : [...prev, updated]
        )
        setShowForm(false); setEditingId(null); resetForm()
        toast.success(editingId ? "Address updated" : "Address added")
      }
    } catch { toast.error("Failed to save address") }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this address?")) return
    try {
      const res = await fetch(`/api/addresses/${id}`, { method: "DELETE" })
      if (res.ok) { setAddresses((p) => p.filter((a) => a.id !== id)); toast.success("Address deleted") }
    } catch { toast.error("Failed to delete") }
  }

  return (
    <div className="pt-[100px] md:pt-[116px] min-h-screen">
      <Container>
        <h1 className="heading-xl mb-12">Addresses</h1>
        <div className="grid md:grid-cols-[240px_1fr] gap-8 lg:gap-12">
          <AccountSidebar />
          <div>
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-stone">{addresses.length} address(es)</p>
              <Button onClick={() => { setShowForm(true); setEditingId(null); resetForm() }}>
                Add Address
              </Button>
            </div>

            {showForm && (
              <form onSubmit={handleSubmit} className="bg-cream p-6 mb-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" placeholder="First name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required className="w-full px-4 py-3 bg-transparent border border-charcoal/20 focus:border-charcoal outline-none text-sm" />
                  <input type="text" placeholder="Last name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required className="w-full px-4 py-3 bg-transparent border border-charcoal/20 focus:border-charcoal outline-none text-sm" />
                </div>
                <input type="text" placeholder="Address" value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} required className="w-full px-4 py-3 bg-transparent border border-charcoal/20 focus:border-charcoal outline-none text-sm" />
                <input type="text" placeholder="Apartment (optional)" value={form.street2} onChange={(e) => setForm({ ...form, street2: e.target.value })} className="w-full px-4 py-3 bg-transparent border border-charcoal/20 focus:border-charcoal outline-none text-sm" />
                <div className="grid grid-cols-3 gap-4">
                  <input type="text" placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required className="w-full px-4 py-3 bg-transparent border border-charcoal/20 focus:border-charcoal outline-none text-sm" />
                  <input type="text" placeholder="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} required className="w-full px-4 py-3 bg-transparent border border-charcoal/20 focus:border-charcoal outline-none text-sm" />
                  <input type="text" placeholder="ZIP" value={form.zipCode} onChange={(e) => setForm({ ...form, zipCode: e.target.value })} required className="w-full px-4 py-3 bg-transparent border border-charcoal/20 focus:border-charcoal outline-none text-sm" />
                </div>
                <input type="tel" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-4 py-3 bg-transparent border border-charcoal/20 focus:border-charcoal outline-none text-sm" />
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} className="accent-charcoal" />
                  Set as default
                </label>
                <div className="flex gap-3">
                  <Button type="submit">{editingId ? "Update" : "Save"}</Button>
                  <button type="button" onClick={() => { setShowForm(false); setEditingId(null) }} className="btn-outline">Cancel</button>
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
                  <p className="text-body text-sm">No addresses yet</p>
                </div>
              ) : (
                addresses.map((addr) => (
                  <div key={addr.id} className="bg-cream p-6 flex justify-between items-start">
                    <div>
                      {addr.isDefault && <span className="text-xs text-sage tracking-wider uppercase mb-1 block">Default</span>}
                      <p className="text-sm font-medium">{addr.firstName} {addr.lastName}</p>
                      <p className="text-sm text-stone">{addr.street}{addr.street2 ? `, ${addr.street2}` : ""}</p>
                      <p className="text-sm text-stone">{addr.city}, {addr.state} {addr.zipCode}</p>
                      {addr.phone && <p className="text-sm text-stone">{addr.phone}</p>}
                    </div>
                    <div className="flex gap-3 text-xs">
                      <button onClick={() => { setForm({ firstName: addr.firstName, lastName: addr.lastName, street: addr.street, street2: addr.street2 || "", city: addr.city, state: addr.state, zipCode: addr.zipCode, country: addr.country, phone: addr.phone || "", isDefault: addr.isDefault }); setEditingId(addr.id); setShowForm(true) }} className="text-stone hover:text-charcoal underline underline-offset-4">Edit</button>
                      <button onClick={() => handleDelete(addr.id)} className="text-rosegold hover:text-rosegold/80 underline underline-offset-4">Delete</button>
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
