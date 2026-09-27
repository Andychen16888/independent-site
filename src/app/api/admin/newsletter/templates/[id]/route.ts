import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth/admin-guard"
import { prisma } from "@/lib/db/prisma"

export const dynamic = "force-dynamic"

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAdmin(req)
  if (authError) return authError

  const { id } = await params

  try {
    await prisma.newsletterTemplate.delete({ where: { id } })
  } catch (e) {
    if (e instanceof Error && "code" in e && (e as { code?: string }).code === "P2025") {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }
    throw e
  }

  return NextResponse.json({ ok: true })
}
