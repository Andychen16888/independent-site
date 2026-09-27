#!/usr/bin/env node
// 在需要数据库连接的命令前做前置检查。
// 目的：把 Prisma 的 "P1012 Environment variable not found: DATABASE_URL"
// 这种不易理解的报错，换成能直接照做的修复步骤。
// 不修改任何环境变量，只读 .env 与 process.env 后判断。

import { existsSync, readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"

function findEnvFile() {
  let dir = process.cwd()
  for (let depth = 0; depth < 5; depth++) {
    const candidate = resolve(dir, ".env")
    if (existsSync(candidate)) return candidate
    const parent = dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  return null
}

function readEnvValue(envFile, key) {
  if (!envFile) return undefined
  for (const line of readFileSync(envFile, "utf-8").split("\n")) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const sep = trimmed.indexOf("=")
    if (sep === -1) continue
    if (trimmed.slice(0, sep).trim() !== key) continue
    let value = trimmed.slice(sep + 1).trim()
    if (!/^["']/.test(value)) {
      const hash = value.indexOf(" #")
      if (hash !== -1) value = value.slice(0, hash).trim()
    }
    return value.replace(/^["']|["']$/g, "")
  }
  return undefined
}

const envFile = findEnvFile()
const fromFile = readEnvValue(envFile, "DATABASE_URL")
const fromProcess = process.env.DATABASE_URL

if (!fromFile && !fromProcess) {
  console.error(
    [
      "",
      "[db] ERROR: DATABASE_URL is not set, cannot connect to PostgreSQL.",
      envFile
        ? `  Found ${envFile}, but DATABASE_URL is missing or commented out in it.`
        : `  No .env file found (searched up to 5 levels from ${process.cwd()}).`,
      "",
      "  Fix:",
      "    cp .env.example .env",
      "    nano .env",
      "",
      "  Then set this line (replace PASSWORD with the real one):",
      `    DATABASE_URL="postgresql://b2b_user:PASSWORD@localhost:5432/b2b_independent_site?schema=public"`,
      "",
      `  Reminder: the database and role must exist first (see DEPLOYMENT.md section 3).`,
      "",
    ].join("\n"),
  )
  process.exit(1)
}

const value = fromProcess || fromFile
if (!value.includes("@")) {
  console.error(
    [
      "",
      `[db] ERROR: DATABASE_URL looks malformed: ${value}`,
      '  Expected format: postgresql://USER:PASSWORD@HOST:5432/DB_NAME?schema=public',
      "",
    ].join("\n"),
  )
  process.exit(1)
}
