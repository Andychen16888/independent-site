import { defineConfig } from "prisma/config"
import { existsSync, readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"

// Prisma 6 检测到 prisma.config.ts 就不再自动加载 .env（会打印
// "Prisma config detected, skipping environment variable loading"），
// 因此必须由本文件把 .env 读进 process.env。

// 从 cwd 逐级向上查找，避免依赖「恰好在项目根目录执行命令」
function findEnvFile(): string | null {
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

const envFile = findEnvFile()

if (envFile) {
  const raw = readFileSync(envFile, "utf-8")
  for (const line of raw.split("\n")) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const sep = trimmed.indexOf("=")
    if (sep === -1) continue
    const key = trimmed.slice(0, sep).trim()
    if (!key) continue
    let value = trimmed.slice(sep + 1).trim()
    // 未加引号的值，剥掉行尾注释（dotenv 的常见行为）
    if (!/^["']/.test(value)) {
      const hash = value.indexOf(" #")
      if (hash !== -1) value = value.slice(0, hash).trim()
    }
    value = value.replace(/^["']|["']$/g, "")
    // 真实环境变量优先，不覆盖已存在的值
    if (!process.env[key]) process.env[key] = value
  }
}

const databaseUrl = process.env.DATABASE_URL

// 这里只警告不抛错：prisma generate / next build 不需要连库，
// 若在此处 throw 会让无数据库的 CI 与本地构建直接失败。
if (!databaseUrl) {
  console.warn(
    [
      "",
      "[prisma.config] WARNING: DATABASE_URL is not set.",
      envFile
        ? `  Read ${envFile}, but no usable DATABASE_URL was found (check whether the line is commented out with #).`
        : `  No .env file found (searched up to 5 levels from ${process.cwd()}).`,
      "",
      "  These commands will fail: db:migrate / db:seed / db:push / db:studio",
      "",
      "  Fix:",
      "    cp .env.example .env",
      "    nano .env",
      `    DATABASE_URL="postgresql://b2b_user:PASSWORD@localhost:5432/b2b_independent_site?schema=public"`,
      "",
    ].join("\n"),
  )
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
  // 显式下发连接串：Prisma 6 的 schema 校验走 WASM(get-config)，
  // 不保证能读到上面注入的 process.env，直接给出可绕过该不确定性。
  ...(databaseUrl ? { datasource: { url: databaseUrl } } : {}),
})
