import Link from "next/link"
import { prisma } from "@/lib/db/prisma"
import { bi } from "@/components/admin/bilingual"

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
        <h1 className="heading-md">{bi("Marketing", "营销")}</h1>
        <p className="text-body text-sm mt-1">{bi("Manage coupons, discounts, and campaigns.", "管理优惠券、折扣和营销活动。")}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <Link href="/admin/coupons" className="bg-white border border-mist p-6 block hover:border-charcoal transition-colors group">
          <h3 className="font-serif text-base mb-2">{bi("Coupons", "优惠券")}</h3>
          <p className="text-xs text-stone mb-4">{bi("Create and manage discount coupons.", "创建并管理折扣优惠券。")}</p>
          <span className="text-sm font-medium text-charcoal group-hover:underline">
            {couponCount} {bi("active coupons", "生效优惠券")} &rarr;
          </span>
        </Link>
        <Link href="/admin/newsletter" className="bg-white border border-mist p-6 block hover:border-charcoal transition-colors group">
          <h3 className="font-serif text-base mb-2">{bi("Newsletter", "订阅邮件")}</h3>
          <p className="text-xs text-stone mb-4">{bi("View and manage email subscribers.", "查看并管理邮件订阅用户。")}</p>
          <span className="text-sm font-medium text-charcoal group-hover:underline">
            {subscriberCount} {bi("active subscribers", "有效订阅")} &rarr;
          </span>
        </Link>
      </div>
    </div>
  )
}
