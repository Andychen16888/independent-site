"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useTranslations } from "next-intl"
import { Container } from "@/components/ui/Container"
import { AccountSidebar } from "@/components/account/AccountSidebar"
import { Button } from "@/components/ui/Button"
import { toast } from "react-hot-toast"

export default function AccountSettingsPage() {
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const t = useTranslations("account.settings")
  const ta = useTranslations("auth")
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
  })

  useEffect(() => {
    if (session?.user?.name) {
      const name = session.user.name
      setFormData({
        firstName: name.split(" ")[0] || "",
        lastName: name.split(" ").slice(1).join(" ") || "",
      })
    }
  }, [session])

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const res = await fetch("/api/account/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      if (res.ok) {
        toast.success(t("profileUpdated"))
      } else {
        toast.error(t("updateFailed"))
      }
    } catch {
      toast.error(ta("somethingWentWrong"))
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error(ta("passwordsDontMatch"))
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
      if (res.ok) {
        toast.success(t("passwordUpdated"))
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
      } else {
        const data = await res.json()
        toast.error(data.error || t("updateFailed"))
      }
    } catch {
      toast.error(ta("somethingWentWrong"))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      <Container>
        <h1 className="heading-xl mb-12">{t("title")}</h1>
        <div className="grid md:grid-cols-[240px_1fr] gap-8 lg:gap-12">
          <AccountSidebar />
          <div className="max-w-xl space-y-10">
            <form onSubmit={handleProfileUpdate} className="space-y-5">
              <h2 className="font-serif text-lg">{t("profile")}</h2>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder={t("firstNamePlaceholder")}
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-4 py-3 bg-transparent border border-charcoal/20 focus:border-charcoal outline-none text-sm"
                />
                <input
                  type="text"
                  placeholder={t("lastNamePlaceholder")}
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-4 py-3 bg-transparent border border-charcoal/20 focus:border-charcoal outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-stone mb-1">{t("email")}</label>
                <input
                  type="email"
                  value={session?.user?.email || ""}
                  disabled
                  className="w-full px-4 py-3 bg-mist border border-mist text-sm cursor-not-allowed"
                />
              </div>
              <Button type="submit" loading={isLoading}>
                {t("saveChanges")}
              </Button>
            </form>

            <form onSubmit={handlePasswordUpdate} className="space-y-5 border-t border-mist pt-8">
              <h2 className="font-serif text-lg">{t("changePassword")}</h2>
              <input
                type="password"
                placeholder={t("currentPasswordPlaceholder")}
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                required
                className="w-full px-4 py-3 bg-transparent border border-charcoal/20 focus:border-charcoal outline-none text-sm"
              />
              <input
                type="password"
                placeholder={t("newPasswordPlaceholder")}
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                required
                minLength={8}
                className="w-full px-4 py-3 bg-transparent border border-charcoal/20 focus:border-charcoal outline-none text-sm"
              />
              <input
                type="password"
                placeholder={t("confirmPasswordPlaceholder")}
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                required
                className="w-full px-4 py-3 bg-transparent border border-charcoal/20 focus:border-charcoal outline-none text-sm"
              />
              <Button type="submit" loading={isLoading}>
                {t("updatePassword")}
              </Button>
            </form>
          </div>
        </div>
      </Container>
    </div>
  )
}