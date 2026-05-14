import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getServerAuthSession } from "@/lib/auth/get-server-session"

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerAuthSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const data = await req.json()
    const userId = (session.user as any).id

    if (data.isDefault) {
      await prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      })
    }

    const { id: _, userId: __, createdAt: ___, updatedAt: ____, ...updateData } = data
    const address = await prisma.address.update({
      where: { id, userId },
      data: updateData,
    })

    return NextResponse.json(address)
  } catch (error) {
    console.error("Address update error:", error)
    return NextResponse.json({ error: "Failed to update address" }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerAuthSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    await prisma.address.deleteMany({
      where: { id, userId: (session.user as any).id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Address delete error:", error)
    return NextResponse.json({ error: "Failed to delete address" }, { status: 500 })
  }
}
