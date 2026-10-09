import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth/admin-guard"
import { getBackupSummary } from "@/lib/backup/backup"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req)
  if (authError) return authError

  try {
    const summary = await getBackupSummary()
    return NextResponse.json(summary)
  } catch (error) {
    console.error("Backup summary error:", error)
    return NextResponse.json({ error: "无法读取备份概览" }, { status: 500 })
  }
}
