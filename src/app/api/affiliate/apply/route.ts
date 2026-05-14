import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getServerAuthSession } from "@/lib/auth/get-server-session"

export async function POST(req: Request) {
  try {
    const session = await getServerAuthSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
      include: { affiliate: true },
    })

    if (user?.affiliate) {
      return NextResponse.json({ error: "Already applied" }, { status: 409 })
    }

    const code = `OB-${(session.user as any).id.slice(0, 6).toUpperCase()}`

    await prisma.affiliate.create({
      data: {
        userId: (session.user as any).id,
        code,
        status: "PENDING",
      },
    })

    return NextResponse.json({ message: "Application submitted successfully", code })
  } catch (error) {
    console.error("Affiliate apply error:", error)
    return NextResponse.json({ error: "Failed to submit application" }, { status: 500 })
  }
}
