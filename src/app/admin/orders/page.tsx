import { prisma } from "@/lib/db/prisma"
import { formatPrice, formatDateShort } from "@/lib/utils/format"
import { bi } from "@/components/admin/bilingual"

export const dynamic = "force-dynamic"

const statusColors: Record<string, string> = {
  PENDING: "bg-amber/10 text-amber",
  CONFIRMED: "bg-blue/10 text-blue",
  PROCESSING: "bg-sky/10 text-sky",
  SHIPPED: "bg-sage/10 text-sage",
  DELIVERED: "bg-emerald/10 text-emerald",
  CANCELLED: "bg-rosegold/10 text-rosegold",
  REFUNDED: "bg-stone/10 text-stone",
}

async function getOrders() {
  try {
    return await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: { user: true, items: true },
    })
  } catch (error) {
    console.error("Failed to fetch orders:", error)
    return []
  }
}

export default async function AdminOrdersPage() {
  const orders = await getOrders()

  return (
    <div>
      <div className="mb-8">
        <h1 className="heading-md">Orders</h1>
        <p className="text-body text-sm mt-1">{bi("View and manage customer orders.", "查看并管理客户订单。")} ({orders.length} {bi("total", "总计")})</p>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white border border-mist p-12 text-center text-sm text-stone">{bi("No orders yet.", "暂无订单。")}</div>
      ) : (
        <div className="bg-white border border-mist overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-mist text-left">
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">{bi("Order", "订单")}</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">{bi("Customer", "客户")}</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">{bi("Items", "商品数")}</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">{bi("Total", "总额")}</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">{bi("Payment", "支付")}</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">{bi("Status", "状态")}</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">{bi("Date", "日期")}</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-mist/50 hover:bg-ivory/50 transition-colors">
                  <td className="px-4 py-3 font-medium">{order.orderNumber}</td>
                  <td className="px-4 py-3">
                    {order.user
                      ? `${order.user.firstName || ""} ${order.user.lastName || ""}`.trim()
                      : order.email}
                  </td>
                  <td className="px-4 py-3 text-stone text-xs">{order.items.length}</td>
                  <td className="px-4 py-3">{formatPrice(Number(order.total))}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] uppercase tracking-wider px-2 py-1 ${
                      order.paymentStatus === "PAID" ? "bg-emerald/10 text-emerald" :
                      order.paymentStatus === "PENDING" ? "bg-amber/10 text-amber" :
                      "bg-rosegold/10 text-rosegold"
                    }`}>
                      {order.paymentStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] uppercase tracking-wider px-2 py-1 ${statusColors[order.status] || ""}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-stone text-xs">{formatDateShort(order.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
