import Link from "next/link"
import { prisma } from "@/lib/db/prisma"

export const dynamic = "force-dynamic"

async function getStats() {
  try {
    const [couponCount, subscriberCount] = await Promise.all([
      prisma.coupon.count({ where: { isActive: true } }),
      prisma.newsletter.count({ where: { isActive: true } }),
    ])
    return { couponCount, subscriberCount }
  } catch {
    return { couponCount: 0, subscriberCount: 0 }
  }
}

export default async function AdminMarketingPage() {
  const { couponCount, subscriberCount } = await getStats()

  return (
    <div>
      <div className="mb-8">
        <h1 className="heading-md">Marketing</h1>
        <p className="text-body text-sm mt-1">Manage coupons, discounts, and campaigns.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <Link href="/admin/coupons" className="bg-white border border-mist p-6 block hover:border-charcoal transition-colors group">
          <h3 className="font-serif text-base mb-2">Coupons</h3>
          <p className="text-xs text-stone mb-4">Create and manage discount coupons.</p>
          <span className="text-sm font-medium text-charcoal group-hover:underline">
            {couponCount} active coupons &rarr;
          </span>
        </Link>
        <Link href="/admin/newsletter" className="bg-white border border-mist p-6 block hover:border-charcoal transition-colors group">
          <h3 className="font-serif text-base mb-2">Newsletter</h3>
          <p className="text-xs text-stone mb-4">View and manage email subscribers.</p>
          <span className="text-sm font-medium text-charcoal group-hover:underline">
            {subscriberCount} active subscribers &rarr;
          </span>
        </Link>
      </div>
    </div>
  )
}
