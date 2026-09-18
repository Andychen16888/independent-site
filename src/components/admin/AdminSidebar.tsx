"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils/cn"
import {
  HiOutlineSquares2X2, HiOutlineShoppingBag, HiOutlineCube,
  HiOutlineUsers, HiOutlineCurrencyDollar, HiOutlineDocumentText,
  HiOutlinePhoto, HiOutlineMegaphone, HiOutlineChartBar,
  HiOutlineCog6Tooth, HiOutlineArrowLeftOnRectangle, HiOutlineFolder,
  HiOutlineDocument, HiOutlineBars3, HiOutlineServerStack,
} from "react-icons/hi2"

const navItems = [
  { name: "Dashboard", href: "/admin", icon: HiOutlineSquares2X2 },
  { name: "Products", href: "/admin/products", icon: HiOutlineCube },
  { name: "Categories", href: "/admin/categories", icon: HiOutlineFolder },
  { name: "Orders", href: "/admin/orders", icon: HiOutlineShoppingBag },
  { name: "Customers", href: "/admin/customers", icon: HiOutlineUsers },
  { name: "Marketing", href: "/admin/marketing", icon: HiOutlineMegaphone },
  { name: "Affiliates", href: "/admin/affiliates", icon: HiOutlineCurrencyDollar },
  { name: "Blog", href: "/admin/blog", icon: HiOutlineDocumentText },
  { name: "Pages", href: "/admin/pages", icon: HiOutlineDocument },
  { name: "Menus", href: "/admin/menus", icon: HiOutlineBars3 },
  { name: "Banners", href: "/admin/banners", icon: HiOutlinePhoto },
  { name: "Analytics", href: "/admin/analytics", icon: HiOutlineChartBar },
  { name: "Settings", href: "/admin/settings", icon: HiOutlineCog6Tooth },
]

export function AdminSidebar({ siteName = "Commerce" }: { siteName?: string }) {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-charcoal text-ivory flex flex-col z-50">
      <div className="p-6 border-b border-white/10">
        <Link href="/admin" className="block">
          <span className="font-serif text-lg tracking-[0.3em]">{siteName}</span>
          <span className="block text-[8px] tracking-[0.5em] text-stone">ADMIN</span>
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
                : "text-stone hover:text-ivory hover:bg-white/5"
            )}
          >
            <item.icon className="w-4 h-4" />
            {item.name}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-white/10 space-y-1">
        <Link
          href="/admin/monitoring"
          className={cn(
            "flex items-center gap-3 px-2 py-2 text-sm rounded transition-colors",
            pathname.startsWith("/admin/monitoring")
              ? "bg-white/10 text-ivory"
              : "text-stone hover:text-ivory hover:bg-white/5"
          )}
        >
          <HiOutlineServerStack className="w-4 h-4" />
          System Monitoring
        </Link>
        <Link
          href="/"
          className="flex items-center gap-3 px-2 py-2 text-sm text-stone hover:text-ivory transition-colors rounded"
        >
          <HiOutlineArrowLeftOnRectangle className="w-4 h-4" />
          Back to Store
        </Link>
      </div>
    </aside>
  )
}
