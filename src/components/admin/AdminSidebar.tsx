"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils/cn"
import { SystemStatusWidget } from "@/components/admin/SystemStatusWidget"
import {
  HiOutlineSquares2X2, HiOutlineShoppingBag, HiOutlineCube,
  HiOutlineUsers, HiOutlineCurrencyDollar, HiOutlineDocumentText,
  HiOutlinePhoto, HiOutlineMegaphone, HiOutlineChartBar,
  HiOutlineCog6Tooth, HiOutlineArrowLeftOnRectangle, HiOutlineFolder,
  HiOutlineDocument, HiOutlineBars3,
  HiOutlineQuestionMarkCircle, HiOutlineGlobeAlt,
} from "react-icons/hi2"

const navItems = [
  { name: "Dashboard", nameZh: "仪表盘", href: "/admin", icon: HiOutlineSquares2X2 },
  { name: "Products", nameZh: "产品", href: "/admin/products", icon: HiOutlineCube },
  { name: "Categories", nameZh: "分类", href: "/admin/categories", icon: HiOutlineFolder },
  { name: "Orders", nameZh: "订单", href: "/admin/orders", icon: HiOutlineShoppingBag },
  { name: "Customers", nameZh: "客户", href: "/admin/customers", icon: HiOutlineUsers },
  { name: "Marketing", nameZh: "营销", href: "/admin/marketing", icon: HiOutlineMegaphone },
  { name: "Affiliates", nameZh: "联盟推广", href: "/admin/affiliates", icon: HiOutlineCurrencyDollar },
  { name: "Blog", nameZh: "博客", href: "/admin/blog", icon: HiOutlineDocumentText },
  { name: "FAQ", nameZh: "常见问题", href: "/admin/faq", icon: HiOutlineQuestionMarkCircle },
  { name: "Pages", nameZh: "页面", href: "/admin/pages", icon: HiOutlineDocument },
  { name: "Menus", nameZh: "菜单", href: "/admin/menus", icon: HiOutlineBars3 },
  { name: "Banners", nameZh: "横幅广告", href: "/admin/banners", icon: HiOutlinePhoto },
  { name: "Site Images", nameZh: "站点图片", href: "/admin/images", icon: HiOutlineGlobeAlt },
  { name: "Analytics", nameZh: "数据分析", href: "/admin/analytics", icon: HiOutlineChartBar },
  { name: "Settings", nameZh: "设置", href: "/admin/settings", icon: HiOutlineCog6Tooth },
]

export function AdminSidebar({ siteName = "Commerce" }: { siteName?: string }) {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-charcoal text-ivory flex flex-col z-50">
      <div className="p-6 border-b border-white/10">
        <Link href="/admin" className="block">
          <span className="font-sans font-semibold text-lg tracking-[0.05em]">{siteName}</span>
          <span className="block text-[8px] tracking-[0.5em] text-ivory/50">ADMIN 管理后台</span>
        </Link>
      </div>

      <nav className="flex-1 py-4 overflow-y-auto">
        {navItems.map((item) => (
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
