/**
 * Regression checks for the category URL resolution that used to 404.
 *
 * A category slugged as free text ("led lighting") produced the URL
 * /categories/led%20lighting, which no route matched. These checks pin the
 * tolerant matching and the canonical slug used by every generated link.
 *
 * Usage:  npx tsx scripts/test-category-slugs.ts
 */
import { canonicalCategorySlug, normalizeCategoryKey, isUrlSafeCategorySlug } from "../src/lib/categories/slug"
import { matchCategoryInList, collectCategoryBranch } from "../src/lib/categories/query"

let failures = 0

function check(label: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected)
  if (!ok) failures += 1
  console.log(
    `${ok ? "PASS" : "FAIL"}  ${label}  got=${JSON.stringify(actual)} want=${JSON.stringify(expected)}`
  )
}

/** Stands in for the database: category 1 was slugged from free text. */
const categories = [
  { id: "1", name: "LED Lighting", slug: "led lighting", parentId: null, isActive: true },
  { id: "2", name: "LED Christmas Lights", slug: "led-christmas-lights", parentId: "1", isActive: true },
  { id: "3", name: "LED Bulbs", slug: "cat-9x8ab", parentId: "1", isActive: true },
  { id: "4", name: "Minerals", slug: "minerals", parentId: null, isActive: true },
  { id: "5", name: "Hidden", slug: "hidden-cat", parentId: null, isActive: false },
]

check("space slug resolves itself", matchCategoryInList(categories, "led lighting")?.id, "1")
check("hyphen url finds space slug", matchCategoryInList(categories, "led-lighting")?.id, "1")
check("uppercase url finds space slug", matchCategoryInList(categories, "LED-Lighting")?.id, "1")
check("underscore url finds space slug", matchCategoryInList(categories, "led_lighting")?.id, "1")
check("slug wins over name", matchCategoryInList(categories, "led-bulbs")?.id, "3")
check("alias resolves", matchCategoryInList(categories, "led-lights")?.id, "1")
check("unknown slug stays null", matchCategoryInList(categories, "nope-not-here"), null)
check("empty slug stays null", matchCategoryInList(categories, ""), null)
check("no fuzzy prefix match", matchCategoryInList(categories, "led christmas"), null)

const sameName = [
  { id: "9", name: "Dup", slug: "aaa", parentId: null, isActive: false },
  { id: "10", name: "Dup", slug: "bbb", parentId: null, isActive: true },
]
check("active wins over inactive", matchCategoryInList(sameName, "dup")?.id, "10")

check("canonical slug", canonicalCategorySlug("LED Lighting"), "led-lighting")
check("canonical keeps safe slug", canonicalCategorySlug("led-lighting"), "led-lighting")
check("canonical falls back to name", canonicalCategorySlug("!!!", "LED Lighting"), "led-lighting")
check("canonical keeps non-latin", canonicalCategorySlug("矿产品"), "矿产品")
check("url safe check rejects spaces", isUrlSafeCategorySlug("led lighting"), false)
check("url safe check accepts hyphens", isUrlSafeCategorySlug("led-lighting"), true)
check("normalize key", normalizeCategoryKey("Café  LED_Lighting"), "cafe-led-lighting")

check("branch includes children", Array.from(collectCategoryBranch(categories, "1")).sort(), [
  "1",
  "2",
  "3",
])

console.log(failures === 0 ? "\nAll category slug checks passed." : `\n${failures} check(s) failed.`)
process.exitCode = failures === 0 ? 0 : 1
