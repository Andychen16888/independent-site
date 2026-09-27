import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { requireAdmin } from "@/lib/auth/admin-guard"
import { prisma } from "@/lib/db/prisma"
import { MAX_BODY, MAX_SUBJECT } from "@/lib/newsletter/constants"

export const dynamic = "force-dynamic"

const MAX_NAME = 80

/** Reusable subject/body pairs. */
export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req)
  if (authError) return authError

  const templates = await prisma.newsletterTemplate.findMany({
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      subject: true,
      body: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  return NextResponse.json({ templates })
}

/**
 * Create or overwrite a template by name.
 *
 * Saving under an existing name updates it rather than erroring: the dashboard
 * treats the name as the handle, and a stale duplicate is never what the admin
 * meant to keep.
 */
export async function POST(req: NextRequest) {
  const authError = await requireAdmin(req)
  if (authError) return authError

  const payload = (await req.json().catch(() => null)) as {
    id?: unknown
    name?: unknown
    subject?: unknown
    body?: unknown
  } | null

  if (!payload) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const name = typeof payload.name === "string" ? payload.name.trim() : ""
  const subject = typeof payload.subject === "string" ? payload.subject.trim() : ""
  const body = typeof payload.body === "string" ? payload.body.trim() : ""

  if (!name || name.length > MAX_NAME) {
    return NextResponse.json({ error: `Name is required (max ${MAX_NAME} characters)` }, { status: 400 })
  }
  if (!subject || subject.length > MAX_SUBJECT) {
    return NextResponse.json({ error: `Subject is required (max ${MAX_SUBJECT} characters)` }, { status: 400 })
  }
  if (!body || body.length > MAX_BODY) {
    return NextResponse.json({ error: `Body is required (max ${MAX_BODY} characters)` }, { status: 400 })
  }

  const id = typeof payload.id === "string" && payload.id ? payload.id : undefined

  if (id) {
    const existing = await prisma.newsletterTemplate.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }
    const updated = await prisma.newsletterTemplate.update({
      where: { id },
      data: { name, subject, body },
      select: { id: true, name: true, subject: true, body: true, updatedAt: true },
    })
    return NextResponse.json({ template: updated })
  }

  try {
    const created = await prisma.newsletterTemplate.create({
      data: { name, subject, body },
      select: { id: true, name: true, subject: true, body: true, updatedAt: true },
    })
    return NextResponse.json({ template: created })
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ error: "A template with that name already exists" }, { status: 409 })
    }
    throw e
  }
}
