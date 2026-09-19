"use client"

import { Link, usePathname } from "@/i18n/navigation"
import { useLocale, useTranslations } from "next-intl"
import { signOut, useSession } from "next-auth/react"
import { cn } from "@/lib/utils/cn"

export function AccountSidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const t = useTranslations("account")
  const ts = useTranslations("account.sidebar")
  const locale = useLocale()

  const links = [
    { name: ts("overview"), href: "/account" },
    { name: ts("orders"), href: "/account/orders" },
    { name: ts("addresses"), href: "/account/addresses" },
    { name: ts("wishlist"), href: "/wishlist" },
    { name: ts("reviews"), href: "/account/reviews" },
    { name: ts("affiliate"), href: "/affiliate" },
    { name: ts("settings"), href: "/account/settings" },
  ]

  return (
    <aside className="space-y-6">
      <div className="pb-6 border-b border-mist">
        <p className="text-sm font-medium">
          {session?.user?.name || t("welcome")}
        </p>
        <p className="text-xs text-stone mt-1">{session?.user?.email}</p>
      </div>

      <nav className="space-y-1">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "block py-2 text-sm transition-colors",
              pathname === link.href
                ? "text-charcoal font-medium"
                : "text-stone hover:text-charcoal"
            )}
          >
            {link.name}
          </Link>
        ))}
      </nav>

      <button
        onClick={() => signOut({ callbackUrl: `/${locale}` })}
        className="block py-2 text-sm text-stone hover:text-charcoal transition-colors"
      >
        {t("signOut")}
      </button>
    </aside>
  )
}