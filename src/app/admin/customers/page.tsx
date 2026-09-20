import { prisma } from "@/lib/db/prisma"
import { formatDateShort } from "@/lib/utils/format"
import { bi } from "@/components/admin/bilingual"

export const dynamic = "force-dynamic"

async function getCustomers() {
  try {
    return await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { orders: true, reviews: true } } },
    })
  } catch (error) {
    console.error("Failed to fetch customers:", error)
    return []
  }
}

export default async function AdminCustomersPage() {
  const customers = await getCustomers()

  return (
    <div>
      <div className="mb-8">
        <h1 className="heading-md">{bi("Customers", "客户")}</h1>
        <p className="text-body text-sm mt-1">{bi("View and manage customers.", "查看并管理客户。")} ({customers.length} {bi("total", "总计")})</p>
      </div>

      {customers.length === 0 ? (
        <div className="bg-white border border-mist p-12 text-center text-sm text-stone">{bi("No customers yet.", "暂无客户。")}</div>
      ) : (
        <div className="bg-white border border-mist overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-mist text-left">
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">{bi("Name", "姓名")}</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">{bi("Email", "邮箱")}</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">{bi("Role", "角色")}</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">{bi("Orders", "订单")}</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">{bi("Reviews", "评价")}</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">{bi("Joined", "加入时间")}</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((user) => (
                <tr key={user.id} className="border-b border-mist/50 hover:bg-ivory/50 transition-colors">
                  <td className="px-4 py-3">
                    {user.firstName || user.lastName
                      ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
                      : <span className="text-stone italic">{bi("No name", "无姓名")}</span>}
                  </td>
                  <td className="px-4 py-3 text-xs">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] uppercase tracking-wider px-2 py-1 ${
                      user.role === "ADMIN" ? "bg-sage/10 text-sage" :
                      user.role === "AFFILIATE" ? "bg-blue/10 text-blue" :
                      user.role === "MODERATOR" ? "bg-amber/10 text-amber" :
                      "bg-stone/10 text-stone"
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-stone">{user._count.orders}</td>
                  <td className="px-4 py-3 text-xs text-stone">{user._count.reviews}</td>
                  <td className="px-4 py-3 text-xs text-stone">{formatDateShort(user.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
