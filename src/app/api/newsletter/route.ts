import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"

export async function POST(req: Request) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const existing = await prisma.newsletter.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ message: "Already subscribed" })
    }

    await prisma.newsletter.create({ data: { email } })

    return NextResponse.json({ message: "Subscribed successfully" })
  } catch (error) {
    console.error("Newsletter error:", error)
    return NextResponse.json({ error: "Subscription failed" }, { status: 500 })
  }
}
