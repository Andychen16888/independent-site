import { NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/db/prisma"
import { generateUnsubscribeToken } from "@/lib/newsletter/token"

// Deliberately permissive: a stricter pattern would reject valid but unusual
// addresses, and a bogus signup is harmless next to the admin-side sending cap.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: Request) {
  try {
    const { email } = await req.json()

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const normalized = email.trim().toLowerCase()
    if (!EMAIL_RE.test(normalized)) {
      return NextResponse.json({ error: "Email is invalid" }, { status: 400 })
    }

    // Emails are stored as submitted, so an older row may hold a mixed-case
    // address. Probe case-insensitively instead of normalising on write,
    // which would collide with those rows on the unique index.
    const existing = await prisma.newsletter.findFirst({
      where: { email: { equals: normalized, mode: "insensitive" } },
    })
    if (existing) {
      return NextResponse.json({ message: "Already subscribed" })
    }

    try {
      // The token is minted here so every subscriber can be sent a working
      // unsubscribe link, which bulk marketing mail legally requires.
      await prisma.newsletter.create({
        data: { email: normalized, unsubscribeToken: generateUnsubscribeToken() },
      })
    } catch (e) {
      // Lost a race against a concurrent identical signup.
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        return NextResponse.json({ message: "Already subscribed" })
      }
      throw e
    }

    return NextResponse.json({ message: "Subscribed successfully" })
  } catch (error) {
    console.error("Newsletter error:", error)
    return NextResponse.json({ error: "Subscription failed" }, { status: 500 })
  }
}
