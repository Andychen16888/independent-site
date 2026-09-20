import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth/admin-guard"
import { getSystemMetrics } from "@/lib/system/metrics"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req)
  if (authError) return authError

  const metrics = await getSystemMetrics()
  return NextResponse.json(metrics, {
    headers: { "Cache-Control": "no-store" },
  })
}
