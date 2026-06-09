import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getToken } from "next-auth/jwt"

async function checkAdmin(req: NextRequest) {
  let token = await getToken({ req, secureCookie: false })
  if (!token) {
    token = await getToken({ req, secureCookie: true })
  }
  if (!token || token.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  return null
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await checkAdmin(req)
  if (authError) return authError

  try {
    const { id } = await params
    const affiliate = await prisma.affiliate.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        referrals: {
          orderBy: { createdAt: "desc" },
          include: {
            referredUser: { select: { firstName: true, lastName: true, email: true } },
            order: { select: { orderNumber: true, total: true, createdAt: true } },
          },
        },
      },
    })
    if (!affiliate) {
      return NextResponse.json({ error: "Affiliate not found" }, { status: 404 })
    }
    return NextResponse.json({ affiliate })
  } catch (error) {
    console.error("Admin affiliate get error:", error)
    return NextResponse.json({ error: "Failed to fetch affiliate" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await checkAdmin(req)
  if (authError) return authError

  try {
    const { id } = await params
    const body = await req.json()
    const { status, commissionRate, paypalEmail } = body

    const affiliate = await prisma.affiliate.update({
      where: { id },
      data: {
        ...(status !== undefined && { status }),
        ...(commissionRate !== undefined && { commissionRate: parseFloat(commissionRate) }),
        ...(paypalEmail !== undefined && { paypalEmail: paypalEmail || null }),
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    })

    return NextResponse.json({ affiliate })
  } catch (error) {
    console.error("Admin affiliate update error:", error)
    return NextResponse.json({ error: "Failed to update affiliate" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await checkAdmin(req)
  if (authError) return authError

  try {
    const { id } = await params
    await prisma.affiliate.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Admin affiliate delete error:", error)
    return NextResponse.json({ error: "Failed to delete affiliate" }, { status: 500 })
  }
}
