"use client"

import { useState } from "react"
import { toast } from "react-hot-toast"

export default function AdminSettingsPage() {
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [isLoading, setIsLoading] = useState(false)

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Passwords don't match")
      return
    }
    if (passwordData.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters")
      return
    }
    setIsLoading(true)
    try {
      const res = await fetch("/api/account/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success("Password updated")
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
      } else {
        toast.error(data.error || "Update failed")
      }
    } catch {
      toast.error("Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="heading-md">Settings</h1>
        <p className="text-body text-sm mt-1">Configure your store settings.</p>
      </div>

      <div className="max-w-2xl space-y-8">
        <div className="bg-white border border-mist p-8 space-y-6">
          <h2 className="font-serif text-lg">Store</h2>
          <div>
            <label className="block text-sm text-stone mb-2">Store Name</label>
            <input
              type="text"
              defaultValue="Oriental Beauty"
              className="w-full px-4 py-3 bg-transparent border border-mist focus:border-charcoal outline-none text-sm transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm text-stone mb-2">Support Email</label>
            <input
              type="email"
              defaultValue="hello@orientalbeauty.com"
              className="w-full px-4 py-3 bg-transparent border border-mist focus:border-charcoal outline-none text-sm transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm text-stone mb-2">Default Currency</label>
            <select className="w-full px-4 py-3 bg-transparent border border-mist focus:border-charcoal outline-none text-sm transition-colors">
              <option>USD</option>
              <option>EUR</option>
              <option>GBP</option>
              <option>CAD</option>
              <option>AUD</option>
            </select>
          </div>
        </div>

        <div className="bg-white border border-mist p-8 space-y-5">
          <h2 className="font-serif text-lg">Change Password</h2>
          <form onSubmit={handlePasswordUpdate} className="space-y-5">
            <input
              type="password"
              placeholder="Current password"
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              required
              className="w-full px-4 py-3 bg-transparent border border-mist focus:border-charcoal outline-none text-sm transition-colors"
            />
            <input
              type="password"
              placeholder="New password"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              required
              className="w-full px-4 py-3 bg-transparent border border-mist focus:border-charcoal outline-none text-sm transition-colors"
            />
            <input
              type="password"
              placeholder="Confirm new password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              required
              className="w-full px-4 py-3 bg-transparent border border-mist focus:border-charcoal outline-none text-sm transition-colors"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center justify-center px-8 py-3 bg-charcoal text-white text-sm tracking-widest uppercase font-light transition-all duration-300 hover:bg-charcoal/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
