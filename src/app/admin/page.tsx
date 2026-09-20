import { prisma } from "@/lib/db/prisma"
import { formatPrice, truncate } from "@/lib/utils/format"
import { bi } from "@/components/admin/bilingual"
import Link from "next/link"

export const dynamic = "force-dynamic"

async function getStats() {
  try {
    const [totalOrders, totalRevenue, totalProducts, totalCustomers, totalAffiliates, recentOrders, topProducts] =
      await Promise.all([
        prisma.order.count(),
        prisma.order.aggregate({ _sum: { total: true }, where: { paymentStatus: "PAID" } }),
        prisma.product.count({ where: { status: "ACTIVE" } }),
        prisma.user.count({ where: { role: "USER" } }),
        prisma.affiliate.count({ where: { status: "APPROVED" } }),
        prisma.order.findMany({
          take: 5,
          orderBy: { createdAt: "desc" },
          include: { user: true },
        }),
        prisma.orderItem.groupBy({
          by: ["productId", "productName"],
          _sum: { quantity: true, totalPrice: true },
          orderBy: { _sum: { quantity: "desc" } },
          take: 5,
        }),
      ])

    const prevMonth = new Date()
    prevMonth.setMonth(prevMonth.getMonth() - 1)
    const prevOrders = await prisma.order.count({ where: { createdAt: { gte: prevMonth } } })

    return {
      totalRevenue: totalRevenue._sum.total || 0,
      totalOrders,
      totalProducts,
      totalCustomers,
      totalAffiliates,
      recentOrders,
      topProducts,
      prevOrders,
    }
  } catch (error) {
    console.error("Failed to fetch admin stats:", error)
    return {
      totalRevenue: 0, totalOrders: 0, totalProducts: 0,
      totalCustomers: 0, totalAffiliates: 0,
      recentOrders: [], topProducts: [], prevOrders: 0,
    }
  }
}

export default async function AdminDashboard() {
  const stats = await getStats()

  const cards = [
    { label: bi("Total Revenue", "总营收"), value: formatPrice(Number(stats.totalRevenue)), change: "+0%", isPositive: true },
    { label: bi("Orders", "订单"), value: stats.totalOrders.toString(), change: `+${stats.prevOrders}`, isPositive: true },
    { label: bi("Products", "产品"), value: stats.totalProducts.toString(), change: bi("Active", "在售"), isPositive: true },
    { label: bi("Customers", "客户"), value: stats.totalCustomers.toString(), change: bi("All time", "累计"), isPositive: true },
    { label: bi("Affiliates", "联盟"), value: stats.totalAffiliates.toString(), change: bi("Approved", "已批准"), isPositive: true },
    { label: bi("Conversion", "转化率"), value: "0%", change: bi("N/A", "暂无"), isPositive: true },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="heading-md">{bi("Dashboard", "仪表盘")}</h1>
        <p className="text-body text-sm mt-1">{bi("Store overview and key metrics.", "店铺概览与关键指标。")}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {cards.map((card) => (
          <div key={card.label} className="bg-white border border-mist p-4">
            <p className="text-xs text-stone tracking-wider uppercase mb-1">{card.label}</p>
            <p className="text-xl font-serif">{card.value}</p>
            <p className={`text-xs mt-1 ${card.isPositive ? "text-sage" : "text-rosegold"}`}>
              {card.change}
            </p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white border border-mist p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif text-base">{bi("Recent Orders", "最近订单")}</h3>
            <Link href="/admin/orders" className="text-xs text-sage hover:underline">{bi("View all", "查看全部")}</Link>
          </div>
          {stats.recentOrders.length === 0 ? (
            <div className="text-center py-8 text-sm text-stone">{bi("No orders yet", "暂无订单")}</div>
          ) : (
            <div className="space-y-3">
              {stats.recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between py-2 border-b border-mist/50 last:border-0">
                  <div>
                    <p className="text-sm font-medium">{order.orderNumber}</p>
                    <p className="text-xs text-stone">{order.user ? `${order.user.firstName} ${order.user.lastName}` : order.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">{formatPrice(Number(order.total))}</p>
                    <p className="text-[10px] text-stone uppercase">{order.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-mist p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif text-base">{bi("Top Products", "热门产品")}</h3>
            <Link href="/admin/products" className="text-xs text-sage hover:underline">{bi("View all", "查看全部")}</Link>
          </div>
          {stats.topProducts.length === 0 ? (
            <div className="text-center py-8 text-sm text-stone">{bi("No products yet", "暂无产品")}</div>
          ) : (
            <div className="space-y-3">
              {stats.topProducts.map((item, i) => (
                <div key={item.productId || i} className="flex items-center justify-between py-2 border-b border-mist/50 last:border-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs text-stone w-4">{i + 1}.</span>
                    <p className="text-sm truncate">{truncate(item.productName, 30)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm">{item._sum.quantity} {bi("sold", "已售")}</p>
                    <p className="text-[10px] text-stone">{formatPrice(Number(item._sum.totalPrice))}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
