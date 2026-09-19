"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/Button"
import { HiOutlineShare, HiOutlineCurrencyDollar, HiOutlineUserGroup, HiOutlineChartBar } from "react-icons/hi2"

export function AffiliateProgram() {
  const [isApplying, setIsApplying] = useState(false)
  const [email, setEmail] = useState("")
  const t = useTranslations("affiliate")

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsApplying(true)
    try {
      const res = await fetch("/api/affiliate/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      if (res.ok) {
        alert(t("appSubmitted"))
        setEmail("")
      }
    } catch {
      alert(t("appFailed"))
    } finally {
      setIsApplying(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-16">
        <span className="text-caption mb-4 block">{t("partnerEyebrow")}</span>
        <h1 className="heading-xl mb-6">{t("metaTitle")}</h1>
        <p className="text-body max-w-2xl mx-auto">
          {t("partnerSubtitle")}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-16">
        {[0, 1, 2, 3].map((i) => {
          const Icon = [HiOutlineCurrencyDollar, HiOutlineShare, HiOutlineUserGroup, HiOutlineChartBar][i]
          return (
            <div key={i} className="bg-cream p-8">
              <Icon className="w-8 h-8 text-stone mb-4" />
              <h3 className="font-serif text-lg mb-2">{t(`benefits.${i}.title`)}</h3>
              <p className="text-body text-sm">{t(`benefits.${i}.description`)}</p>
            </div>
          )
        })}
      </div>

      <div className="bg-cream p-8 md:p-12 text-center max-w-lg mx-auto">
        <h2 className="font-serif text-xl mb-4">{t("joinTitle")}</h2>
        <p className="text-body text-sm mb-6">
          {t("joinSubtitle")}
        </p>
        <form onSubmit={handleApply} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("emailPlaceholder")}
            required
            className="w-full px-4 py-3 bg-transparent border border-charcoal/20 focus:border-charcoal outline-none text-sm"
          />
          <Button type="submit" loading={isApplying} className="w-full">
            {t("applyNow")}
          </Button>
        </form>
        <p className="text-xs text-stone mt-4">
          {t("reviewTimeline")}
        </p>
      </div>
    </div>
  )
}