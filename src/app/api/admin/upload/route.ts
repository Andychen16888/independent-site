import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { writeFile, mkdir } from "fs/promises"
import path from "path"
import { v4 as uuidv4 } from "uuid"
import sharp from "sharp"

const ALLOWED_MIMES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif", "image/tiff"]
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export async function POST(req: NextRequest) {
  try {
    let token = await getToken({ req, secureCookie: false })
    if (!token) {
      token = await getToken({ req, secureCookie: true })
    }
    if (!token || token.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!ALLOWED_MIMES.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File too large. Maximum size is 5MB." }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    let image: sharp.Sharp
    let metadata: sharp.Metadata
    try {
      image = sharp(buffer)
      metadata = await image.metadata()
      if (!metadata.format) {
        return NextResponse.json({ error: "Invalid image file" }, { status: 400 })
      }
    } catch {
      return NextResponse.json({ error: "Invalid image file" }, { status: 400 })
    }

    const isAnimatedGif = metadata.format === "gif" && (metadata.pages ? metadata.pages > 1 : false)

    let processedBuffer: Buffer
    if (isAnimatedGif) {
      processedBuffer = buffer
    } else {
      processedBuffer = await image.webp({ quality: 85, effort: 4 }).toBuffer()
    }

    const filename = isAnimatedGif ? `${uuidv4()}.gif` : `${uuidv4()}.webp`
    const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads")

    await mkdir(uploadDir, { recursive: true })
    await writeFile(path.join(uploadDir, filename), processedBuffer)

    return NextResponse.json({ url: `/api/uploads/${filename}` })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
  }
}
