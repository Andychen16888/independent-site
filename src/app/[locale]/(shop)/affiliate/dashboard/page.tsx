"use client"

import { useState, useEffect } from "react"
import { Link } from "@/i18n/navigation"
import { useLocale, useTranslations } from "next-intl"
import { Container } from "@/components/ui/Container"
import { Breadcrumb } from "@/components/ui/Breadcrumb"
import { Button } from "@/components/ui/Button"
import { formatPrice, formatDate } from "@/lib/utils/format"
import { HiOutlineShare, HiOutlineCurrencyDollar, HiOutlineUserGroup, HiOutlineChartBar } from "react-icons/hi2"

export default function AffiliateDashboardPage() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const t = useTranslations("affiliate")
  const ta = useTranslations("account.sidebar")
  const tc = useTranslations("common")
  const locale = useLocale()

  useEffect(() => {
    fetch("/api/affiliate/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const referralLink = stats?.code
    ? `${window.location.origin}/${locale}?ref=${stats.code}`
    : ""

  const copyLink = () => {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <Container>
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-mist rounded w-1/3" />
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-mist rounded" />)}
            </div>
          </div>
        </Container>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Container>
        <Breadcrumb
          items={[
            { label: tc("home"), href: "/" },
            { label: ta("affiliate"), href: "/affiliate" },
            { label: t("dashboardLabel") },
          ]}
          className="mb-8"
        />

        {!stats ? (
          <div className="bg-cream p-12 text-center">
            <p className="text-body">{t("notJoined")}</p>
            <Link href="/affiliate" className="btn-primary mt-4 inline-block">{t("applyNow")}</Link>
          </div>
        ) : stats.status === "PENDING" ? (
          <div className="bg-cream p-12 text-center">
            <p className="text-body">{t("underReview")}</p>
            <p className="text-sm text-stone mt-2">{t("reviewNote")}</p>
          </div>
        ) : (
          <div className="space-y-8">
            <h1 className="heading-xl">{t("title")}</h1>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-cream p-6">
                <HiOutlineCurrencyDollar className="w-6 h-6 text-stone mb-3" />
                <p className="text-2xl font-serif">{formatPrice(stats.totalEarned || 0, undefined, locale)}</p>
                <p className="text-xs text-stone tracking-wider uppercase mt-1">{t("totalEarned")}</p>
              </div>
              <div className="bg-cream p-6">
                <HiOutlineChartBar className="w-6 h-6 text-stone mb-3" />
                <p className="text-2xl font-serif">{stats.referralCount || 0}</p>
                <p className="text-xs text-stone tracking-wider uppercase mt-1">{t("referrals")}</p>
              </div>
              <div className="bg-cream p-6">
                <HiOutlineUserGroup className="w-6 h-6 text-stone mb-3" />
                <p className="text-2xl font-serif">{stats.conversionCount || 0}</p>
                <p className="text-xs text-stone tracking-wider uppercase mt-1">{t("conversions")}</p>
              </div>
              <div className="bg-cream p-6">
                <HiOutlineCurrencyDollar className="w-6 h-6 text-stone mb-3" />
                <p className="text-2xl font-serif">{stats.commissionRate || 5}%</p>
                <p className="text-xs text-stone tracking-wider uppercase mt-1">{t("commissionRate")}</p>
              </div>
            </div>

            <div className="bg-cream p-8">
              <h2 className="font-serif text-lg mb-4">{t("yourLink")}</h2>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={referralLink}
                  readOnly
                  className="flex-1 px-4 py-3 bg-ivory border border-charcoal/20 text-sm outline-none"
                />
                <Button onClick={copyLink} variant="outline">
                  {copied ? t("copied") : t("copy")}
                </Button>
              </div>
              <div className="flex gap-4 mt-4">
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`${t("shareText", { siteName: process.env.NEXT_PUBLIC_SITE_NAME || t("ourStore") })}`)}${encodeURIComponent(referralLink)}`}
                  target="_blank"
                  rel="noopener"
                  className="text-xs text-stone hover:text-charcoal underline underline-offset-4"
                >
                  {t("shareOnTwitter")}
                </a>
                <a
                  href={`https://pinterest.com/pin/create/button/?url=${encodeURIComponent(referralLink)}`}
                  target="_blank"
                  rel="noopener"
                  className="text-xs text-stone hover:text-charcoal underline underline-offset-4"
                >
                  {t("pinOnPinterest")}
                </a>
              </div>
            </div>

            {stats.recentReferrals?.length > 0 && (
              <div>
                <h2 className="font-serif text-lg mb-4">{t("recentReferrals")}</h2>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-mist text-left text-stone text-xs uppercase tracking-wider">
                      <th className="py-3 font-normal">{t("tableDate")}</th>
                      <th className="py-3 font-normal">{t("tableOrder")}</th>
                      <th className="py-3 font-normal">{t("tableCommission")}</th>
                      <th className="py-3 font-normal">{t("tableStatus")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentReferrals.map((ref: any) => (
                      <tr key={ref.id} className="border-b border-mist">
                        <td className="py-3">{formatDate(ref.createdAt, locale)}</td>
                        <td className="py-3">{ref.order?.orderNumber || "—"}</td>
                        <td className="py-3">{ref.commission ? formatPrice(ref.commission, undefined, locale) : "—"}</td>
                        <td className="py-3">{ref.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </Container>
    </div>
  )
}