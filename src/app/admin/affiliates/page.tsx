import Link from "next/link"
import { prisma } from "@/lib/db/prisma"
import { formatDateShort, formatPrice } from "@/lib/utils/format"
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
      {status}
    </span>
  )
}

export default async function AdminAffiliatesPage() {
  const affiliates = await getAffiliates()

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="heading-md">Affiliates</h1>
          <p className="text-body text-sm mt-1">Manage affiliate partners and commissions. ({affiliates.length} total)</p>
        </div>
      </div>

      {affiliates.length === 0 ? (
        <div className="bg-white border border-mist p-12 text-center text-sm text-stone">No affiliates yet.</div>
      ) : (
        <div className="bg-white border border-mist overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-mist text-left">
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">Affiliate</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">Code</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">Status</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">Commission</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">Earned</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">Referrals</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">Joined</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone font-medium">Actions</th>
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
                      View
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
