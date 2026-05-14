import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getServerAuthSession } from "@/lib/auth/get-server-session"

export async function PUT(req: Request) {
  try {
    const session = await getServerAuthSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { firstName, lastName } = await req.json()

    const user = await prisma.user.update({
      where: { id: (session.user as any).id },
      data: { firstName, lastName },
    })

    return NextResponse.json({ id: user.id, firstName: user.firstName, lastName: user.lastName })
  } catch (error) {
    console.error("Profile update error:", error)
    return NextResponse.json({ error: "Update failed" }, { status: 500 })
  }
}
