"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { cn } from "@/lib/utils/cn"

const links = [
  { name: "Overview", href: "/account" },
  { name: "Orders", href: "/account/orders" },
  { name: "Addresses", href: "/account/addresses" },
  { name: "Wishlist", href: "/wishlist" },
  { name: "Reviews", href: "/account/reviews" },
  { name: "Affiliate", href: "/affiliate" },
  { name: "Settings", href: "/account/settings" },
]

export function AccountSidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()

  return (
    <aside className="space-y-6">
      <div className="pb-6 border-b border-mist">
        <p className="text-sm font-medium">
          {session?.user?.name || "Welcome"}
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
        onClick={() => signOut({ callbackUrl: "/" })}
        className="block py-2 text-sm text-stone hover:text-charcoal transition-colors"
      >
        Sign Out
      </button>
    </aside>
  )
}
