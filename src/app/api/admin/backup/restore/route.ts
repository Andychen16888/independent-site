import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { requireAdmin } from "@/lib/auth/admin-guard"
import { MAX_RESTORE_BYTES, restoreBackup } from "@/lib/backup/backup"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 300

export async function POST(req: NextRequest) {
  const authError = await requireAdmin(req)
  if (authError) return authError

  try {
    const formData = await req.formData()
    const file = formData.get("file")
    const wipe = formData.get("wipe") === "true"

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "请选择备份文件" }, { status: 400 })
    }
    if (file.size > MAX_RESTORE_BYTES) {
      return NextResponse.json(
        { error: "备份文件过大（超过 50MB），请先在服务器上调高 nginx client_max_body_size" },
        { status: 413 },
      )
    }

    const bytes = new Uint8Array(await file.arrayBuffer())
    const summary = await restoreBackup(bytes, { wipe })

    // Content changed, so regenerate the storefront (all locales).
    revalidatePath("/", "layout")

    return NextResponse.json({ success: true, summary })
  } catch (error) {
    console.error("Backup restore error:", error)
    const message = error instanceof Error ? error.message : "恢复备份失败"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
