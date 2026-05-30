import { prisma } from "@/lib/db/prisma"
import { formatPrice, formatDateShort } from "@/lib/utils/format"

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
        <p className="text-body text-sm mt-1">View and manage customer orders. ({orders.length} total)</p>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white border border-mist p-12 text-center text-sm text-stone">No orders yet.</div>
      ) : (
        <div className="bg-white border border-mist overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-mist text-left">
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">Order</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">Customer</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">Items</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">Total</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">Payment</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">Status</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">Date</th>
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
