import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { cookies } from "next/headers"
import { writeFile, mkdir } from "fs/promises"
import path from "path"
import { v4 as uuidv4 } from "uuid"

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req: { cookies: await cookies() } as any })
    if (!token || token.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg"
    const allowed = ["jpg", "jpeg", "png", "webp", "gif"]
    if (!allowed.includes(ext)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const filename = `${uuidv4()}.${ext}`
    const uploadDir = path.join(process.cwd(), "public", "uploads")

    await mkdir(uploadDir, { recursive: true })
    await writeFile(path.join(uploadDir, filename), buffer)

    return NextResponse.json({ url: `/uploads/${filename}` })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
  }
}
