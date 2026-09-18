"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { useCartStore } from "@/stores/cart-store"
import { useWishlistStore } from "@/stores/wishlist-store"
import { cn } from "@/lib/utils/cn"
import { Container } from "@/components/ui/Container"
import { motion, AnimatePresence } from "framer-motion"
import { HiXMark, HiOutlineGift } from "react-icons/hi2"
import { HiOutlineShoppingBag, HiOutlineUser, HiOutlineHeart, HiOutlineMagnifyingGlass, HiOutlineBars3, HiOutlineXMark } from "react-icons/hi2"
import { CurrencyToggle } from "@/components/ui/CurrencyToggle"

const DEFAULT_NAV = [
  { name: "Electronics", href: "/categories/electronics" },
  { name: "Home & Kitchen", href: "/categories/home-kitchen" },
  { name: "Journal", href: "/blog" },
  { name: "About", href: "/pages/about" },
]

function PromoBar({ text }: { text: string }) {
  const [isVisible, setIsVisible] = useState(true)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem("promo-dismissed")
      if (stored) {
        const expiry = parseInt(stored, 10)
        if (Date.now() < expiry) {
          setDismissed(true)
        } else {
          localStorage.removeItem("promo-dismissed")
        }
      }
    } catch {}
  }, [])

  if (!text || !isVisible || dismissed) return null

  const handleDismiss = () => {
    setIsVisible(false)
    try {
      localStorage.setItem("promo-dismissed", String(Date.now() + 86400000))
    } catch {}
  }

  return (
    <div
      className="relative bg-charcoal text-ivory text-xs tracking-wider py-2.5 px-4 text-center overflow-hidden"
      style={{ animation: "slideDown 0.3s ease-out" }}
    >
      <div className="flex items-center justify-center gap-3">
        <HiOutlineGift className="w-4 h-4 shrink-0 text-rosegold" />
        <span>{text}</span>
        <button
          onClick={handleDismiss}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-ivory/10 rounded transition-colors"
          aria-label="Dismiss promotion"
        >
          <HiXMark className="w-3.5 h-3.5" />
        </button>
      </div>
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-100%); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

export function Header({
  navItems = DEFAULT_NAV,
  siteName = "Commodities From China",
  siteSlogan = "Sourced from China",
  logo = "",
  promoBar = "Wholesale & retail pricing available worldwide",
}: {
  navItems?: { name: string; href: string }[]
  siteName?: string
  siteSlogan?: string
  logo?: string
  promoBar?: string
}) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const pathname = usePathname()
  const { data: session } = useSession()
  const cartCount = useCartStore((s) => s.getItemCount())
  const wishlistCount = useWishlistStore((s) => s.items.length)
  const safeNav = navItems && navItems.length > 0 ? navItems : DEFAULT_NAV

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    setIsMobileOpen(false)
  }, [pathname])

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
        isScrolled
          ? "bg-ivory/95 backdrop-blur-md shadow-sm"
          : "bg-transparent"
      )}
    >
      <PromoBar text={promoBar} />
      <Container>
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center h-16 md:h-20">
          <div className="flex items-center min-w-0">
            <button
              className="md:hidden p-2 -ml-2 shrink-0"
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              aria-label="Menu"
            >
              {isMobileOpen ? <HiOutlineXMark className="w-6 h-6" /> : <HiOutlineBars3 className="w-6 h-6" />}
            </button>

            <nav className="hidden md:flex items-center space-x-8 lg:space-x-10">
              {safeNav.map((item) => (
                <Link
                  key={item.name + item.href}
                  href={item.href}
                  className={cn(
                    "whitespace-nowrap text-xs tracking-widest uppercase transition-colors duration-300",
                    pathname.startsWith(item.href)
                      ? "text-charcoal"
                      : "text-stone hover:text-charcoal"
                  )}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>

          <Link href="/" className="justify-self-center px-2 min-w-0 text-center">
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt={siteName} className="max-h-12 md:max-h-14 w-auto" />
            ) : (
              <>
                <span className="block font-serif text-lg md:text-2xl tracking-[0.12em] text-charcoal text-center whitespace-nowrap">
                  {siteName}
                </span>
                {siteSlogan && (
                  <span className="hidden md:block text-[9px] md:text-[10px] tracking-[0.25em] text-stone text-center truncate max-w-[420px]">
                    {siteSlogan}
                  </span>
                )}
              </>
            )}
          </Link>

          <div className="flex items-center justify-end space-x-4 md:space-x-6 shrink-0">
            <div className="hidden md:block">
              <CurrencyToggle />
            </div>
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="p-2 text-stone hover:text-charcoal transition-colors"
              aria-label="Search"
            >
              <HiOutlineMagnifyingGlass className="w-5 h-5" />
            </button>

            <Link href="/wishlist" className="relative p-2 text-stone hover:text-charcoal transition-colors">
              <HiOutlineHeart className="w-5 h-5" />
              {isMounted && wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-charcoal text-white text-[10px] flex items-center justify-center rounded-full">
                  {wishlistCount}
                </span>
              )}
            </Link>

            <Link href={session ? "/account" : "/auth/signin"} className="hidden md:block p-2 text-stone hover:text-charcoal transition-colors">
              <HiOutlineUser className="w-5 h-5" />
            </Link>

            <Link href="/cart" className="relative p-2 text-stone hover:text-charcoal transition-colors">
              <HiOutlineShoppingBag className="w-5 h-5" />
              {isMounted && cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-charcoal text-white text-[10px] flex items-center justify-center rounded-full">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </Container>

      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-ivory border-t border-mist"
          >
            <Container className="py-6 space-y-4">
              {safeNav.map((item) => (
                <Link
                  key={item.name + item.href}
                  href={item.href}
                  className={cn(
                    "block py-2 text-sm tracking-widest uppercase",
                    pathname.startsWith(item.href) ? "text-charcoal" : "text-stone"
                  )}
                >
                  {item.name}
                </Link>
              ))}
              <div className="pt-4 border-t border-mist space-y-4">
                {session ? (
                  <>
                    <Link href="/account" className="block py-2 text-sm tracking-widest uppercase text-stone">My Account</Link>
                    <button onClick={() => signOut()} className="block py-2 text-sm tracking-widest uppercase text-stone">Sign Out</button>
                  </>
                ) : (
                  <Link href="/auth/signin" className="block py-2 text-sm tracking-widest uppercase text-stone">Sign In</Link>
                )}
              </div>
            </Container>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 bg-ivory border-t border-mist"
          >
            <Container className="py-6">
              <form action="/search" method="GET" className="relative">
                <input
                  type="text"
                  name="q"
                  placeholder="Search products..."
                  className="w-full bg-transparent border-b border-charcoal py-3 pr-10 text-lg outline-none font-light"
                  autoFocus
                />
                <button type="submit" className="absolute right-0 top-1/2 -translate-y-1/2 p-2">
                  <HiOutlineMagnifyingGlass className="w-5 h-5" />
                </button>
              </form>
            </Container>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
