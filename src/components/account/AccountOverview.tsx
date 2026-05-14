"use client"

import Link from "next/link"
import { useSession } from "next-auth/react"

export function AccountOverview() {
  const { data: session } = useSession()

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Link href="/account/orders" className="bg-cream p-6 hover:bg-mist transition-colors group">
          <p className="text-2xl font-serif">0</p>
          <p className="text-xs text-stone mt-1 tracking-wider uppercase">Orders</p>
        </Link>
        <Link href="/wishlist" className="bg-cream p-6 hover:bg-mist transition-colors group">
          <p className="text-2xl font-serif">0</p>
          <p className="text-xs text-stone mt-1 tracking-wider uppercase">Wishlist</p>
        </Link>
        <Link href="/affiliate" className="bg-cream p-6 hover:bg-mist transition-colors group">
          <p className="text-2xl font-serif">0</p>
          <p className="text-xs text-stone mt-1 tracking-wider uppercase">Points</p>
        </Link>
      </div>

      <div>
        <h2 className="font-serif text-lg mb-4">Recent Orders</h2>
        <div className="bg-cream p-8 text-center">
          <p className="text-body text-sm">No orders yet</p>
          <Link href="/products" className="btn-outline mt-4 inline-block text-xs">
            Start Shopping
          </Link>
        </div>
      </div>
    </div>
  )
}
