/**
 * One-off repair for categories whose slug was stored as free text.
 *
 * The admin slug field used to be written to the database verbatim, so a
 * category named "LED Lighting" ended up with the slug "led lighting". That URL
 * (encoded as /categories/led%20lighting) is what the storefront used to link
 * to, and it never resolved reliably.
 *
 * The storefront now resolves and redirects legacy slugs on its own, so running
 * this script is optional: it only cleans up the stored values. Old URLs keep
 * working afterwards, because the category page redirects them to the new slug.
 *
 * Usage:  npx tsx scripts/fix-category-slugs.ts            (dry run, prints a report)
 *         npx tsx scripts/fix-category-slugs.ts --apply    (writes the new slugs)
 */
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { PrismaClient } from "@prisma/client"
import { canonicalCategorySlug, isUrlSafeCategorySlug } from "../src/lib/categories/slug"

const APPLY = process.argv.includes("--apply")

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

export interface CategorySlugRow {
  id: string
  name: string
  slug: string | null
}

export interface CategorySlugFix extends CategorySlugRow {
  nextSlug: string
}

/** Pure part: which rows need a fix and what each one becomes. */
export function planCategorySlugFixes(
  categories: CategorySlugRow[]
): CategorySlugFix[] {
  const reserved = new Set(
    categories.filter((c) => isUrlSafeCategorySlug(c.slug)).map((c) => c.slug as string)
  )
  const fixes: CategorySlugFix[] = []

  for (const category of categories) {
    const current = category.slug ?? ""
    const desired = canonicalCategorySlug(current, category.name)
    if (isUrlSafeCategorySlug(current) && current === desired) continue
    if (reserved.has(desired) && desired !== current) {
      console.warn(`  ! "${desired}" is taken, keeping ${JSON.stringify(current)} for ${category.name}`)
      continue
    }
    reserved.add(desired)
    fixes.push({ ...category, nextSlug: desired })
  }

  return fixes
}

async function main() {
  const categories = await prisma.category.findMany({
    select: { id: true, name: true, slug: true },
    orderBy: { name: "asc" },
  })

  const fixes = planCategorySlugFixes(categories)
  if (fixes.length === 0) {
    console.log(`All ${categories.length} category slugs are already URL-safe.`)
    return
  }

  console.log(`${fixes.length} of ${categories.length} categories need a slug fix:\n`)
  for (const { id, slug, nextSlug, name } of fixes) {
    console.log(`  ${slug}  ->  ${nextSlug}   (${name})`)
    if (APPLY) {
      await prisma.category.update({ where: { id }, data: { slug: nextSlug } })
    }
  }

  console.log(
    APPLY
      ? `\nUpdated ${fixes.length} category slugs. Old /categories/<old slug> URLs now 301 to the new ones.`
      : "\nDry run only. Re-run with --apply to write these changes."
  )
}

const invokedDirectly = (process.argv[1] ?? "")
  .replace(/\\/g, "/")
  .endsWith("fix-category-slugs.ts")
if (invokedDirectly) {
  main()
    .catch((error) => {
      console.error(error)
      process.exitCode = 1
    })
    .finally(() => prisma.$disconnect())
}
