import Link from "next/link"
import { prisma } from "@/lib/db/prisma"
import { formatDateShort } from "@/lib/utils/format"
import { bi } from "@/components/admin/bilingual"
import DeleteCouponButton from "./DeleteCouponButton"

export const dynamic = "force-dynamic"

async function getCoupons() {
  try {
    return await prisma.coupon.findMany({
      orderBy: { createdAt: "desc" },
    })
  } catch (error) {
    console.error("Failed to fetch coupons:", error)
    return []
  }
}

export default async function AdminCouponsPage() {
  const coupons = await getCoupons()

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="heading-md">{bi("Coupons", "优惠券")}</h1>
          <p className="text-body text-sm mt-1">{bi("Manage discount coupons.", "管理折扣优惠券。")} ({coupons.length} {bi("total", "总计")})</p>
        </div>
        <Link href="/admin/coupons/new" className="btn-primary text-xs">{bi("New Coupon", "新建优惠券")}</Link>
      </div>

      {coupons.length === 0 ? (
        <div className="bg-white border border-mist p-12 text-center text-sm text-stone">{bi("No coupons yet.", "暂无优惠券。")}</div>
      ) : (
        <div className="bg-white border border-mist overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-mist text-left">
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">{bi("Code", "代码")}</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">{bi("Type", "类型")}</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">{bi("Discount", "折扣")}</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">{bi("Usage", "使用次数")}</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">{bi("Status", "状态")}</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">{bi("Expires", "过期时间")}</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">{bi("Actions", "操作")}</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((coupon) => (
                <tr key={coupon.id} className="border-b border-mist/50 hover:bg-ivory/50 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/admin/coupons/${coupon.id}`} className="font-medium hover:underline">
                      {coupon.code}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[10px] uppercase tracking-wider px-2 py-1 bg-stone/10 text-stone">
                      {coupon.type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {coupon.discountType === "PERCENTAGE" && `${Number(coupon.discountValue)}%`}
                    {coupon.discountType === "FIXED_AMOUNT" && `$${Number(coupon.discountValue)}`}
                    {coupon.discountType === "FREE_SHIPPING" && bi("Free Shipping", "包邮")}
                  </td>
                  <td className="px-4 py-3 text-xs text-stone">
                    {coupon.usedCount}
                    {coupon.maxUses ? ` / ${coupon.maxUses}` : ""}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] uppercase tracking-wider px-2 py-1 ${
                      coupon.isActive ? "bg-sage/10 text-sage" : "bg-rosegold/10 text-rosegold"
                    }`}>
                      {coupon.isActive ? bi("Active", "启用") : bi("Inactive", "停用")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-stone">
                    {coupon.expiresAt ? formatDateShort(coupon.expiresAt) : "-"}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/coupons/${coupon.id}`}
                      className="text-[10px] text-stone hover:text-charcoal underline mr-2"
                    >
                      {bi("Edit", "编辑")}
                    </Link>
                    <DeleteCouponButton couponId={coupon.id} couponCode={coupon.code} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
