"use client"

import { useState, useEffect } from "react"
import { Link, usePathname } from "@/i18n/navigation"
import { useSession, signOut } from "next-auth/react"
import { useLocale, useTranslations } from "next-intl"
import { useCartStore } from "@/stores/cart-store"
import { useWishlistStore } from "@/stores/wishlist-store"
import { cn } from "@/lib/utils/cn"
import { Container } from "@/components/ui/Container"
import { motion, AnimatePresence } from "framer-motion"
import { HiXMark, HiOutlineGift } from "react-icons/hi2"
import { HiOutlineShoppingBag, HiOutlineUser, HiOutlineHeart, HiOutlineMagnifyingGlass, HiOutlineBars3, HiOutlineXMark } from "react-icons/hi2"
import { CurrencyToggle } from "@/components/ui/CurrencyToggle"
import { LanguageSelector } from "@/components/ui/LanguageSelector"
import { getSiteContent } from "@/config/site-content"

const DEFAULT_NAV = [
  { name: "Electronics", href: "/categories/electronics" },
  { name: "Home & Kitchen", href: "/categories/home-kitchen" },
  { name: "Journal", href: "/blog" },
  { name: "FAQ", href: "/faq" },
  { name: "About", href: "/pages/about" },
]

function getNavKey(href: string): string | null {
  switch (href) {
    case "/":
    case "/home":
      return "home"
    case "/products":
      return "products"
    case "/categories/electronics":
      return "electronics"
    case "/categories/home-kitchen":
      return "homeKitchen"
    case "/blog":
      return "journal"
    case "/faq":
      return "faq"
    case "/pages/about":
      return "about"
    case "/pages/contact":
      return "contact"
    case "/wishlist":
      return "wishlist"
    case "/account":
      return "account"
    default:
      return null
  }
}

function PromoBar({ text }: { text: string }) {
  const [isVisible, setIsVisible] = useState(true)
  const [dismissed, setDismissed] = useState(false)
  const t = useTranslations("header")

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
          aria-label={t("dismissPromo")}
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
  siteDescription = "",
  logo = "",
  promoBar = "Wholesale & retail pricing available worldwide",
}: {
  navItems?: { name: string; href: string }[]
  siteName?: string
  siteSlogan?: string
  siteDescription?: string
  logo?: string
  promoBar?: string
}) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [logoFailed, setLogoFailed] = useState(false)
  const pathname = usePathname()
  const { data: session } = useSession()
  const cartCount = useCartStore((s) => s.getItemCount())
  const wishlistCount = useWishlistStore((s) => s.items.length)
  const t = useTranslations("header")
  const tnav = useTranslations("navigation")
  const locale = useLocale()
  const { cta } = getSiteContent(locale)
  const safeNav = navItems && navItems.length > 0 ? navItems : DEFAULT_NAV

  const getNavLabel = (item: { name: string; href: string }) => {
    const key = getNavKey(item.href)
    return key ? tnav(key) : item.name
  }

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

  useEffect(() => {
    setLogoFailed(false)
  }, [logo])

  const showLogo = Boolean(logo) && !logoFailed

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500 bg-ivory/95 backdrop-blur-md",
        isScrolled ? "shadow-sm border-b border-mist" : "border-b border-transparent"
      )}
    >
      <PromoBar text={promoBar} />
      <Container>
        <div className="flex items-center justify-between gap-4 h-14 md:h-16">
          <div className="flex items-center min-w-0">
            <button
              className="md:hidden p-2 -ml-2 shrink-0"
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              aria-label={t("menu")}
            >
              {isMobileOpen ? <HiOutlineXMark className="w-6 h-6" /> : <HiOutlineBars3 className="w-6 h-6" />}
            </button>

            <Link href="/" className="flex items-center gap-2.5 md:gap-3 min-w-0 text-left">
              {showLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logo}
                  alt={siteName}
                  onError={() => setLogoFailed(true)}
                  className="h-8 md:h-10 w-auto object-contain shrink-0"
                />
              ) : null}
              <span className="font-sans font-semibold text-base md:text-xl tracking-[0.02em] text-navy whitespace-nowrap truncate max-w-[46vw] md:max-w-[280px] text-left">
                {siteName}
              </span>
              {siteSlogan && (
                <span className="hidden lg:inline text-[10px] md:text-xs tracking-[0.08em] text-stone truncate max-w-[280px]">
                  {siteSlogan}
                </span>
              )}
              {siteDescription && (
                <span className="hidden 2xl:inline text-[11px] md:text-xs text-stone/90 truncate max-w-[440px]">
                  {siteDescription}
                </span>
              )}
            </Link>
          </div>

          <div className="flex items-center justify-end space-x-4 md:space-x-6 shrink-0">
            <Link
              href="/pages/contact"
              className="hidden lg:inline-flex btn-primary px-5 py-2.5 text-[11px]"
            >
              {cta.requestQuote}
            </Link>
            <div className="hidden md:block">
              <CurrencyToggle />
            </div>
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="p-2 text-stone hover:text-charcoal transition-colors"
              aria-label={t("search")}
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

            <LanguageSelector />
          </div>
        </div>

        <nav className="hidden md:flex items-center justify-center gap-8 lg:gap-10 py-3 border-t border-mist">
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
              {getNavLabel(item)}
            </Link>
          ))}
        </nav>
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
                  {getNavLabel(item)}
                </Link>
              ))}
              <Link href="/pages/contact" className="btn-primary w-full">
                {cta.requestQuote}
              </Link>
              <div className="flex items-center gap-6 pt-2">
                <LanguageSelector />
                <CurrencyToggle />
              </div>
              <div className="pt-4 border-t border-mist space-y-4">
                {session ? (
                  <>
                    <Link href="/account" className="block py-2 text-sm tracking-widest uppercase text-stone">{t("myAccount")}</Link>
                    <button onClick={() => signOut()} className="block py-2 text-sm tracking-widest uppercase text-stone">{t("signOut")}</button>
                  </>
                ) : (
                  <Link href="/auth/signin" className="block py-2 text-sm tracking-widest uppercase text-stone">{t("signIn")}</Link>
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
                  placeholder={t("searchPlaceholder")}
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