import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { requireAdmin } from "@/lib/auth/admin-guard"
import { SETTING_KEYS } from "@/lib/settings/keys"
import { updateSiteSettings } from "@/lib/settings/settings"

export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req)
  if (authError) return authError

  const rows = await prisma.siteSetting.findMany()
  const settings: Record<string, string> = {}
  for (const row of rows) settings[row.key] = row.value

  return NextResponse.json({ settings, meta: SETTING_KEYS })
}

export async function PUT(req: NextRequest) {
  const authError = await requireAdmin(req)
  if (authError) return authError

  const body = await req.json()
  const { settings } = body
  if (!settings || typeof settings !== "object") {
    return NextResponse.json({ error: "settings is required" }, { status: 400 })
  }

  await updateSiteSettings(settings)

  const rows = await prisma.siteSetting.findMany()
  const updated: Record<string, string> = {}
  for (const row of rows) updated[row.key] = row.value

  return NextResponse.json({ settings: updated })
}