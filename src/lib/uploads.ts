import { existsSync } from "fs"
import { promises as fs } from "fs"
import path from "path"

/**
 * Stable uploads directory resolution.
 *
 * Previously both the upload and serve routes relied on
 * `process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads")`. Under the
 * standalone server (`.next/standalone/server.js`) the process chdir()s into
 * `.next/standalone`, so without UPLOAD_DIR the fallback pointed at a folder
 * that `next build` wipes on every rebuild — losing all uploaded images.
 *
 * Resolution order (so the path can NEVER silently land inside the build
 * output):
 *   1. `UPLOAD_DIR` env, unless it points inside `.next` (defense against a
 *      stale/legacy PM2 env that redirected uploads into the build folder).
 *   2. `<project-root>/uploads`, found by walking up from the bundle location
 *      until a directory containing `prisma/`, `messages/` and `public/`
 *      (only the true repo root has all three; the standalone build output
 *      has `public/` and `messages/` but never `prisma/`).
 *   3. `<cwd>/uploads` as a last-resort dev fallback.
 */
export function getUploadDir(): string {
  const env = process.env.UPLOAD_DIR?.trim()
  if (env && !pointsInsideNext(env)) return env

  const root = findProjectRoot(__dirname || process.cwd())
  if (root) return path.join(root, "uploads")

  return path.join(process.cwd(), "uploads")
}

function pointsInsideNext(dir: string): boolean {
  const normalized = dir.split(/[\\/]/).join("/")
  return normalized.includes("/.next/") || normalized.endsWith("/.next")
}

function findProjectRoot(startDir: string): string | null {
  let dir = startDir
  for (let i = 0; i < 16; i++) {
    if (isProjectRoot(dir)) return dir
    const parent = path.dirname(dir)
    if (parent === dir) return null
    dir = parent
  }
  return null
}

function isProjectRoot(dir: string): boolean {
  return (
    existsSync(path.join(dir, "prisma")) &&
    existsSync(path.join(dir, "messages")) &&
    existsSync(path.join(dir, "public"))
  )
}

/**
 * Read an uploaded file, falling back to legacy locations (files that may
 * still be sitting in `.next/standalone/uploads` or `public/uploads` from
 * earlier deployments). When found outside the primary dir it is copied back
 * into the primary dir so future rebuilds keep it.
 */
export async function readUploadedFile(
  filename: string,
): Promise<{ data: ArrayBuffer; from: string } | null> {
  const primary = getUploadDir()
  const candidates = legacyUploadDirs(primary)

  for (const dir of candidates) {
    const filePath = path.join(dir, filename)
    try {
      const raw = await fs.readFile(filePath)
      const data = raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength) as ArrayBuffer
      if (path.resolve(dir) !== path.resolve(primary)) {
        void fs
          .mkdir(path.dirname(primary), { recursive: true })
          .then(() => fs.copyFile(filePath, path.join(primary, filename)))
          .catch(() => {
            // best-effort migration; serving from the found location still works
          })
      }
      return { data, from: dir }
    } catch {
      // try next candidate
    }
  }
  return null
}

function legacyUploadDirs(primary: string): string[] {
  const cwd = process.cwd()
  const root = findProjectRoot(__dirname || cwd)
  const dirs = new Set<string>([])
  dirs.add(path.resolve(primary))
  dirs.add(path.resolve(cwd, "uploads"))
  dirs.add(path.resolve(cwd, "public", "uploads"))
  if (root) {
    dirs.add(path.resolve(root, "uploads"))
    dirs.add(path.resolve(root, "public", "uploads"))
    dirs.add(path.resolve(root, ".next", "standalone", "uploads"))
    dirs.add(path.resolve(root, ".next", "standalone", "public", "uploads"))
  }
  return [...dirs]
}