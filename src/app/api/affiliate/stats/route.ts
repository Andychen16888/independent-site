import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getServerAuthSession } from "@/lib/auth/get-server-session"

export async function GET() {
  try {
    const session = await getServerAuthSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const affiliate = await prisma.affiliate.findUnique({
      where: { userId: (session.user as any).id },
      include: {
        referrals: {
          include: { order: { select: { orderNumber: true } } },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    })

    if (!affiliate) {
      return NextResponse.json(null)
    }

    return NextResponse.json({
      code: affiliate.code,
      status: affiliate.status,
      commissionRate: affiliate.commissionRate,
      totalEarned: affiliate.totalEarned,
      totalWithdrawn: affiliate.totalWithdrawn,
      referralCount: affiliate.referrals.length,
      conversionCount: affiliate.referrals.filter((r) => r.status === "CONVERTED").length,
      recentReferrals: affiliate.referrals,
    })
  } catch (error) {
    console.error("Affiliate stats error:", error)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}
