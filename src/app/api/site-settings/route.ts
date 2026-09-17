import { NextResponse } from "next/server"
import { cache } from "react"
import { getSiteSettings } from "@/lib/settings/settings"

export const dynamic = "force-dynamic"

export async function GET() {
  const settings = await getSiteSettings()
  return NextResponse.json({ settings })
}

export async function getPublicSettings() {
  return cache(async () => getSiteSettings())()
}