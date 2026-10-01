/**
 * One-off repair for products whose slug was stored as free text.
 *
 * The admin slug field used to be written to the database verbatim, so products
 * created from a name like "Radar Sensor T8 LED Tube Light" ended up with a
 * slug full of spaces. Those URLs 404 through some hosts and never index well.
 *
 * Usage:  npx tsx scripts/fix-product-slugs.ts            (dry run, prints a report)
 *         npx tsx scripts/fix-product-slugs.ts --apply    (writes the new slugs)
 */
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { PrismaClient } from "@prisma/client"
import { slugify, MAX_SLUG_LENGTH } from "../src/lib/utils/format"

const APPLY = process.argv.includes("--apply")
const SAFE_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

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

const prisma = new PrismaClient()

function isSafe(value: string | null | undefined): boolean {
  if (!value) return false
  if (value.length > MAX_SLUG_LENGTH) return false
  return SAFE_SLUG.test(value)
}

export interface SlugRow {
  id: string
  name: string
  slug: string | null
}

/** Pure part: which rows need a fix and what each one becomes. */
export function planSlugFixes(products: SlugRow[]): Array<SlugRow & { nextSlug: string }> {
  const reserved = new Set(products.filter((p) => isSafe(p.slug)).map((p) => p.slug as string))
  const fixes: Array<SlugRow & { nextSlug: string }> = []

  for (const product of products.filter((p) => !isSafe(p.slug))) {
    const base = slugify(product.slug ?? "") || slugify(product.name) || `product-${Date.now().toString(36)}`
    let candidate = base
    let suffix = 1
    while (reserved.has(candidate)) {
      suffix += 1
      const tail = `-${suffix}`
      candidate = `${base.slice(0, MAX_SLUG_LENGTH - tail.length)}${tail}`
    }
    reserved.add(candidate)
    fixes.push({ ...product, nextSlug: candidate })
  }

  return fixes
}

async function main() {
  const products = await prisma.product.findMany({
    select: { id: true, name: true, slug: true },
    orderBy: { name: "asc" },
  })

  const fixes = planSlugFixes(products)
  if (fixes.length === 0) {
    console.log(`All ${products.length} product slugs are already URL-safe.`)
    return
  }

  console.log(`${fixes.length} of ${products.length} products need a slug fix:\n`)
  for (const { id, slug, nextSlug, name } of fixes) {
    console.log(`  ${slug}  ->  ${nextSlug}   (${name})`)
    if (APPLY) {
      await prisma.product.update({ where: { id }, data: { slug: nextSlug } })
    }
  }

  console.log(APPLY ? `\nUpdated ${fixes.length} product slugs.` : "\nDry run only. Re-run with --apply to write these changes.")
}

const invokedDirectly = (process.argv[1] ?? "").replace(/\\/g, "/").endsWith("fix-product-slugs.ts")
if (invokedDirectly) {
  main()
    .catch((error) => {
      console.error(error)
      process.exitCode = 1
    })
    .finally(() => prisma.$disconnect())
}