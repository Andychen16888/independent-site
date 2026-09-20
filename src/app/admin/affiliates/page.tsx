import Link from "next/link"
import { prisma } from "@/lib/db/prisma"
import { formatDateShort, formatPrice } from "@/lib/utils/format"
import { bi } from "@/components/admin/bilingual"
import ApproveButton from "./ApproveButton"
import DeleteAffiliateButton from "./DeleteAffiliateButton"

export const dynamic = "force-dynamic"

async function getAffiliates() {
  try {
    return await prisma.affiliate.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        _count: { select: { referrals: true } },
      },
    })
  } catch (error) {
    console.error("Failed to fetch affiliates:", error)
    return []
  }
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: "bg-stone/10 text-stone",
    APPROVED: "bg-sage/10 text-sage",
    REJECTED: "bg-rosegold/10 text-rosegold",
    SUSPENDED: "bg-rosegold/10 text-rosegold",
  }
  return (
    <span className={`text-[10px] uppercase tracking-wider px-2 py-1 ${styles[status] || "bg-stone/10 text-stone"}`}>
      {status === "PENDING"
        ? bi("Pending", "待审核")
        : status === "APPROVED"
          ? bi("Approved", "已批准")
          : status === "REJECTED"
            ? bi("Rejected", "已拒绝")
            : status === "SUSPENDED"
              ? bi("Suspended", "已暂停")
              : status}
    </span>
  )
}

export default async function AdminAffiliatesPage() {
  const affiliates = await getAffiliates()

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="heading-md">{bi("Affiliates", "联盟推广")}</h1>
          <p className="text-body text-sm mt-1">{bi("Manage affiliate partners and commissions.", "管理联盟伙伴与佣金。")} ({affiliates.length} {bi("total", "总计")})</p>
        </div>
      </div>

      {affiliates.length === 0 ? (
        <div className="bg-white border border-mist p-12 text-center text-sm text-stone">{bi("No affiliates yet.", "暂无联盟成员。")}</div>
      ) : (
        <div className="bg-white border border-mist overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-mist text-left">
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">{bi("Affiliate", "成员")}</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">{bi("Code", "代码")}</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">{bi("Status", "状态")}</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">{bi("Commission", "佣金")}</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">{bi("Earned", "已赚取")}</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">{bi("Referrals", "推荐")}</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">{bi("Joined", "加入")}</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">{bi("Actions", "操作")}</th>
              </tr>
            </thead>
            <tbody>
              {affiliates.map((aff) => (
                <tr key={aff.id} className="border-b border-mist/50 hover:bg-ivory/50 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/admin/affiliates/${aff.id}`} className="font-medium hover:underline">
                      {[aff.user.firstName, aff.user.lastName].filter(Boolean).join(" ") || aff.user.email}
                    </Link>
                    <span className="block text-[10px] text-stone">{aff.user.email}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-stone font-mono">{aff.code}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={aff.status} />
                    {aff.status === "PENDING" && (
                      <div className="mt-1">
                        <ApproveButton affiliateId={aff.id} />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs">{Number(aff.commissionRate)}%</td>
                  <td className="px-4 py-3 text-xs">{formatPrice(Number(aff.totalEarned))}</td>
                  <td className="px-4 py-3 text-xs text-stone">{aff._count.referrals}</td>
                  <td className="px-4 py-3 text-xs text-stone">{formatDateShort(aff.createdAt)}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/affiliates/${aff.id}`}
                      className="text-[10px] text-stone hover:text-charcoal underline mr-2"
                    >
                      {bi("View", "查看")}
                    </Link>
                    <DeleteAffiliateButton affiliateId={aff.id} name={[aff.user.firstName, aff.user.lastName].filter(Boolean).join(" ") || aff.user.email} />
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
