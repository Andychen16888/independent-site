import { defineConfig } from "prisma/config"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

try {
  const envFile = readFileSync(resolve(".env"), "utf-8")
  for (const line of envFile.split("\n")) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const sep = trimmed.indexOf("=")
    if (sep === -1) continue
    const key = trimmed.slice(0, sep).trim()
    const value = trimmed.slice(sep + 1).trim().replace(/^["']|["']$/g, "")
    if (!process.env[key]) process.env[key] = value
  }
} catch {
  // .env not found, rely on existing env vars
}

export default defineConfig({
  seed: "tsx prisma/seed.ts",
})
