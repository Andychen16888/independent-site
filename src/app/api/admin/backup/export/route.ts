import { NextRequest } from "next/server"
import { requireAdmin } from "@/lib/auth/admin-guard"
import { createBackup } from "@/lib/backup/backup"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 300

export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req)
  if (authError) return authError

  try {
    const { bytes, filename } = await createBackup()
    return new Response(Buffer.from(bytes), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(bytes.byteLength),
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    console.error("Backup export error:", error)
    return Response.json({ error: "导出备份失败" }, { status: 500 })
  }
}
