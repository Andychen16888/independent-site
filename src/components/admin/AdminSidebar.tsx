"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils/cn"
import { SystemStatusWidget } from "@/components/admin/SystemStatusWidget"
import {
  HiOutlineSquares2X2, HiOutlineShoppingBag, HiOutlineCube,
  HiOutlineUsers, HiOutlineCurrencyDollar, HiOutlineDocumentText,
  HiOutlinePhoto, HiOutlineMegaphone, HiOutlineChartBar,
  HiOutlineCog6Tooth, HiOutlineArrowLeftOnRectangle, HiOutlineFolder,
  HiOutlineDocument, HiOutlineBars3,
  HiOutlineQuestionMarkCircle, HiOutlineGlobeAlt, HiOutlineLanguage,
  HiOutlineBuildingOffice2, HiOutlineChatBubbleOvalLeftEllipsis, HiOutlineHome,
  HiOutlineEnvelope, HiOutlineInbox, HiOutlineChevronDown,
  HiOutlineDocumentDuplicate, HiOutlineClock, HiOutlinePaperAirplane,
  HiOutlineArchiveBox,
} from "react-icons/hi2"
import { INQUIRY_STAGES } from "@/lib/sales/status-meta"

const navItems = [
  { name: "Dashboard", nameZh: "仪表盘", href: "/admin", icon: HiOutlineSquares2X2 },
  { name: "Home", nameZh: "首页管理", href: "/admin/home", icon: HiOutlineHome },
  { name: "Products", nameZh: "产品", href: "/admin/products", icon: HiOutlineCube },
  { name: "Translation Guide", nameZh: "产品翻译说明", href: "/admin/help/translations", icon: HiOutlineLanguage },
  { name: "Categories", nameZh: "分类", href: "/admin/categories", icon: HiOutlineFolder },
  { name: "Orders", nameZh: "订单", href: "/admin/orders", icon: HiOutlineShoppingBag },
  { name: "Customers", nameZh: "客户", href: "/admin/customers", icon: HiOutlineUsers },
  { name: "Marketing", nameZh: "营销", href: "/admin/marketing", icon: HiOutlineMegaphone },
  { name: "Newsletter", nameZh: "邮件订阅", href: "/admin/newsletter", icon: HiOutlineEnvelope },
  { name: "Affiliates", nameZh: "联盟推广", href: "/admin/affiliates", icon: HiOutlineCurrencyDollar },
  { name: "Blog", nameZh: "博客", href: "/admin/blog", icon: HiOutlineDocumentText },
  { name: "FAQ", nameZh: "常见问题", href: "/admin/faq", icon: HiOutlineQuestionMarkCircle },
  { name: "Pages", nameZh: "页面", href: "/admin/pages", icon: HiOutlineDocument },
  { name: "About Us", nameZh: "关于我们", href: "/admin/about", icon: HiOutlineBuildingOffice2 },
  { name: "Contact Us", nameZh: "联系我们", href: "/admin/contact", icon: HiOutlineChatBubbleOvalLeftEllipsis },
  { name: "Menus", nameZh: "菜单", href: "/admin/menus", icon: HiOutlineBars3 },
  { name: "Banners", nameZh: "横幅广告", href: "/admin/banners", icon: HiOutlinePhoto },
  { name: "Site Images", nameZh: "站点图片", href: "/admin/images", icon: HiOutlineGlobeAlt },
  { name: "Analytics", nameZh: "数据分析", href: "/admin/analytics", icon: HiOutlineChartBar },
  { name: "Settings", nameZh: "设置", href: "/admin/settings", icon: HiOutlineCog6Tooth },
  { name: "Backup", nameZh: "备份管理", href: "/admin/backup", icon: HiOutlineArchiveBox },
]

/**
 * Counts shown as badges on the sales menu.
 *
 * Fetched on the client from the same list endpoint the pages use, so the badge
 * and the first page of rows can never disagree the way two separate queries
 * would. A failure is silent on purpose: a sidebar that hides itself because a
 * count is unavailable would be worse than one showing a stale number.
 */
type SalesCounts = {
  inquiries?: Record<string, number>
  followUps?: { overdue: number; pending: number }
}

/** Every route that belongs under the Sales group. */
const SALES_ROOTS = [
  "/admin/inquiries",
  "/admin/quotations",
  "/admin/emails",
  "/admin/follow-ups",
] as const

export function AdminSidebar({ siteName = "Commerce" }: { siteName?: string }) {
  const pathname = usePathname()
  const [salesOpen, setSalesOpen] = useState(() => SALES_ROOTS.some((r) => pathname.startsWith(r)))
  const [counts, setCounts] = useState<SalesCounts>({})

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const [inq, follow] = await Promise.all([
          fetch("/api/admin/inquiries?pageSize=1", { cache: "no-store" }),
          fetch("/api/admin/follow-ups?pageSize=1&due=1", { cache: "no-store" }),
        ])
        if (!inq.ok || !follow.ok) return

        const inqData = await inq.json()
        const followData = await follow.json()
        if (cancelled) return

        setCounts({
          inquiries: inqData.statusCounts ?? {},
          followUps: {
            overdue: followData.overdueCount ?? 0,
            pending: followData.pagination?.total ?? 0,
          },
        })
      } catch {
        // Badge counts are advisory; never surface an error for them.
      }
    }

    load()
    // Re-poll so a new enquiry appears without a manual reload.
    const timer = setInterval(load, 60_000)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [pathname])

  // Opening any sales route opens the group, so a direct load of /admin/quotations
  // or /admin/emails does not hide the links that led there. Collapsing while
  // inside the group is still possible: the state and the route are independent.
  const salesOpen_ = salesOpen || SALES_ROOTS.some((r) => pathname.startsWith(r))
  const totalOpen = Object.values(counts.inquiries ?? {}).reduce((a, b) => a + b, 0)
  const followUpBadge = counts.followUps?.overdue ?? 0

  const badge = (n: number | undefined, tone: "neutral" | "warn") => {
    if (!n) return null
    return (
      <span
        className={cn(
          "ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-medium tabular-nums",
          tone === "warn" ? "bg-rose-500/20 text-rose-200" : "bg-white/10 text-ivory/70"
        )}
      >
        {n > 99 ? "99+" : n}
      </span>
    )
  }

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-charcoal text-ivory flex flex-col z-50">
      <div className="p-6 border-b border-white/10">
        <Link href="/admin" className="block">
          <span className="font-sans font-semibold text-lg tracking-[0.05em]">{siteName}</span>
          <span className="block text-[8px] tracking-[0.5em] text-ivory/50">ADMIN 管理后台</span>
        </Link>
      </div>

      <nav className="flex-1 py-4 overflow-y-auto">
        {navItems.slice(0, 6).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-6 py-3 text-sm transition-colors",
              pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href))
                ? "bg-white/10 text-ivory"
                : "text-ivory/70 hover:text-ivory hover:bg-white/5"
            )}
          >
            <item.icon className="w-4 h-4 shrink-0" />
            <span className="flex flex-col leading-tight">
              <span>{item.name}</span>
              <span className="text-[10px] opacity-60">{item.nameZh}</span>
            </span>
          </Link>
        ))}

        {/* Sales pipeline: six stages as sub-items, each deep-linking to a filter. */}
        <div>
          <button
            type="button"
            onClick={() => setSalesOpen((v) => !v)}
            aria-expanded={salesOpen_}
            className={cn(
              "flex w-full items-center gap-3 px-6 py-3 text-sm transition-colors",
              salesOpen_ ? "bg-white/10 text-ivory" : "text-ivory/70 hover:text-ivory hover:bg-white/5"
            )}
          >
            <HiOutlineInbox className="w-4 h-4 shrink-0" />
            <span className="flex flex-col items-start leading-tight">
              <span>Sales</span>
              <span className="text-[10px] opacity-60">销售</span>
            </span>
            {badge(totalOpen, "neutral")}
            <HiOutlineChevronDown
              className={cn(
                "w-3 h-3 shrink-0 transition-transform",
                salesOpen_ ? "rotate-180" : ""
              )}
            />
          </button>

          {salesOpen_ && (
            <div className="pb-1">
              <Link
                href="/admin/inquiries"
                className={cn(
                  "flex items-center gap-2 pl-11 pr-4 py-2 text-xs transition-colors",
                  pathname === "/admin/inquiries"
                    ? "text-ivory bg-white/5"
                    : "text-ivory/60 hover:text-ivory hover:bg-white/5"
                )}
              >
                All Inquiries
                <span className="ml-1 text-[10px] opacity-60">全部</span>
                {badge(counts.inquiries ? totalOpen : undefined, "neutral")}
              </Link>

              {INQUIRY_STAGES.map((stage) => (
                <Link
                  key={stage.key}
                  href={`/admin/inquiries/stage/${stage.key}`}
                  className={cn(
                    "flex items-center gap-2 pl-11 pr-4 py-2 text-xs transition-colors",
                    pathname === `/admin/inquiries/stage/${stage.key}`
                      ? "text-ivory bg-white/5"
                      : "text-ivory/60 hover:text-ivory hover:bg-white/5"
                  )}
                >
                  <span className="truncate">{stage.label}</span>
                  <span className="text-[10px] opacity-50">{stage.labelZh}</span>
                  {badge(counts.inquiries?.[stage.status], "neutral")}
                </Link>
              ))}

              <Link
                href="/admin/quotations"
                className={cn(
                  "flex items-center gap-2 pl-11 pr-4 py-2 text-xs transition-colors",
                  pathname.startsWith("/admin/quotations")
                    ? "text-ivory bg-white/5"
                    : "text-ivory/60 hover:text-ivory hover:bg-white/5"
                )}
              >
                <HiOutlineDocumentDuplicate className="w-3.5 h-3.5 shrink-0" />
                Quotations
                <span className="text-[10px] opacity-50">报价单</span>
              </Link>

              <Link
                href="/admin/emails"
                className={cn(
                  "flex items-center gap-2 pl-11 pr-4 py-2 text-xs transition-colors",
                  pathname.startsWith("/admin/emails")
                    ? "text-ivory bg-white/5"
                    : "text-ivory/60 hover:text-ivory hover:bg-white/5"
                )}
              >
                <HiOutlinePaperAirplane className="w-3.5 h-3.5 shrink-0" />
                Email Records
                <span className="text-[10px] opacity-50">邮件记录</span>
              </Link>

              <Link
                href="/admin/follow-ups"
                className={cn(
                  "flex items-center gap-2 pl-11 pr-4 py-2 text-xs transition-colors",
                  pathname.startsWith("/admin/follow-ups")
                    ? "text-ivory bg-white/5"
                    : "text-ivory/60 hover:text-ivory hover:bg-white/5"
                )}
              >
                <HiOutlineClock className="w-3.5 h-3.5 shrink-0" />
                Follow-ups
                <span className="text-[10px] opacity-50">跟进</span>
                {badge(followUpBadge, "warn")}
              </Link>
            </div>
          )}
        </div>

        {navItems.slice(6).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-6 py-3 text-sm transition-colors",
              pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href))
                ? "bg-white/10 text-ivory"
                : "text-ivory/70 hover:text-ivory hover:bg-white/5"
            )}
          >
            <item.icon className="w-4 h-4 shrink-0" />
            <span className="flex flex-col leading-tight">
              <span>{item.name}</span>
              <span className="text-[10px] opacity-60">{item.nameZh}</span>
            </span>
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-white/10 space-y-1">
        <SystemStatusWidget />
        <Link
          href="/"
          className="flex items-center gap-3 px-2 py-2 text-sm text-ivory/70 hover:text-ivory transition-colors rounded"
        >
          <HiOutlineArrowLeftOnRectangle className="w-4 h-4 shrink-0" />
          <span className="flex flex-col leading-tight">
            <span>Back to Store</span>
            <span className="text-[10px] opacity-60">返回商城</span>
          </span>
        </Link>
      </div>
    </aside>
  )
}
