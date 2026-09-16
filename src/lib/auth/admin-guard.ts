import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

export async function getAdminToken(req: NextRequest) {
  let token = await getToken({ req, secureCookie: false })
  if (!token) {
    token = await getToken({ req, secureCookie: true })
  }
  return token && token.role === "ADMIN" ? token : null
}

export async function requireAdmin(req: NextRequest): Promise<NextResponse | null> {
  const token = await getAdminToken(req)
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  return null
}