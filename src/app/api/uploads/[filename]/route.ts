import { NextRequest, NextResponse } from "next/server"
import path from "path"
import { readUploadedFile } from "../../../../lib/uploads"

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
    const found = await readUploadedFile(filename)
    if (!found) throw new Error("missing")
    return new NextResponse(found.data, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=604800, immutable",
      },
    })
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 })
  }
}
