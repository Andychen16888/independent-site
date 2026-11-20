import { NextResponse } from "next/server"
import { GENERIC_SITE_URL } from "@/lib/settings/brand"
import crypto from "crypto"
import { prisma } from "@/lib/db/prisma"
import { sendPasswordResetEmail } from "@/lib/email/resend"

export async function POST(req: Request) {
  try {
    const { email } = await req.json()

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } })

    if (!user) {
      return NextResponse.json(
        { message: "If that email exists, a reset link has been sent." },
        { status: 200 }
      )
    }

    const resetToken = crypto.randomBytes(32).toString("hex")
    const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000)

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpires },
    })

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || GENERIC_SITE_URL
    const resetUrl = `${siteUrl}/auth/reset-password?token=${resetToken}&email=${encodeURIComponent(user.email)}`

    await sendPasswordResetEmail(user.email, resetUrl)

    return NextResponse.json(
      { message: "If that email exists, a reset link has been sent." },
      { status: 200 }
    )
  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
