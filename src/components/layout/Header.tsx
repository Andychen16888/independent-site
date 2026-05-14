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
import { HiOutlineShoppingBag, HiOutlineUser, HiOutlineHeart, HiOutlineMagnifyingGlass, HiOutlineBars3, HiOutlineXMark } from "react-icons/hi2"
import { CurrencyToggle } from "@/components/ui/CurrencyToggle"

const navigation = [
  { name: "Beauty", href: "/categories/beauty" },
  { name: "Handmade Living", href: "/categories/handmade-living" },
  { name: "Journal", href: "/blog" },
  { name: "About", href: "/about" },
]

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const pathname = usePathname()
  const { data: session } = useSession()
  const cartCount = useCartStore((s) => s.getItemCount())
  const wishlistCount = useWishlistStore((s) => s.items.length)

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
      <Container>
        <div className="flex items-center justify-between h-16 md:h-20">
          <button
            className="md:hidden p-2 -ml-2"
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            aria-label="Menu"
          >
            {isMobileOpen ? <HiOutlineXMark className="w-6 h-6" /> : <HiOutlineBars3 className="w-6 h-6" />}
          </button>

          <nav className="hidden md:flex items-center space-x-10">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "text-xs tracking-widest uppercase transition-colors duration-300",
                  pathname.startsWith(item.href)
                    ? "text-charcoal"
                    : "text-stone hover:text-charcoal"
                )}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          <Link href="/" className="absolute left-1/2 -translate-x-1/2">
            <span className="font-serif text-xl md:text-2xl tracking-[0.3em] text-charcoal">
              ORIENTAL
            </span>
            <span className="block text-[10px] tracking-[0.5em] text-stone text-center">
              BEAUTY
            </span>
          </Link>

          <div className="flex items-center space-x-4 md:space-x-6">
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
              {wishlistCount > 0 && (
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
              {cartCount > 0 && (
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
              {navigation.map((item) => (
                <Link
                  key={item.name}
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
