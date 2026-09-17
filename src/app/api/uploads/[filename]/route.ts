import { NextRequest, NextResponse } from "next/server"
import { readFile } from "fs/promises"
import path from "path"

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads")

const MIME_MAP: Record<string, string> = {
  webp: "image/webp",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  avif: "image/avif",
  tiff: "image/tiff",
  tif: "image/tiff",
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ filename: string }> },
) {
  const { filename } = await params

  // Reject traversal attempts and path separators outright.
  const normalized = path.posix.normalize(filename)
  if (
    !filename ||
    filename !== normalized ||
    filename === "." ||
    filename === ".." ||
    filename.includes("/") ||
    filename.includes("\\") ||
    filename.includes("..")
  ) {
    return NextResponse.json({ error: "File not found" }, { status: 404 })
  }

  const ext = filename.split(".").pop()?.toLowerCase() || ""
  const contentType = MIME_MAP[ext] || "application/octet-stream"

  try {
    const buffer = await readFile(path.join(UPLOAD_DIR, filename))
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=604800, immutable",
      },
    })
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 })
  }
}
