/*
 * Structural check of a generated quotation PDF.
 *
 * No rasteriser is available in this environment, so rather than looking at the
 * page we verify the thing that actually breaks in a hand-rolled table: text
 * collisions. pdfkit writes an explicit Tm position for every text run, so
 * inflating the content streams and reading those positions proves whether any
 * two runs overlap.
 *
 * pdfkit specifics this depends on:
 *   - one content stream per page
 *   - `Tm` precedes `Tf`
 *   - text is emitted as a hex `TJ` array of ASCII glyph codes
 *   - the page is drawn under `1 0 0 -1 0 <height>`, so a larger Tm.y is
 *     further up the page
 *
 * Widths come from the Adobe standard-14 Helvetica metrics rather than a
 * character-count guess: a crude estimate produced false positives on wrapped
 * cells, and a guard that cries wolf gets ignored.
 *
 * Usage: npx tsx scripts/verify-quotation-pdf.ts <file.pdf>
 */
import { existsSync, readFileSync } from "node:fs"
import { inflateSync } from "node:zlib"

const file = process.argv[2]
if (!file) {
  console.error("usage: npx tsx scripts/verify-quotation-pdf.ts <file.pdf>")
  process.exit(1)
}

// ---- Adobe standard-14 advance widths (units per 1000 em) ------------------
// Kept as a character sequence plus two parallel numeric rows: spelling quote
// and backslash keys inline is fragile to get right and impossible to eyeball.
const GLYPHS = ' !"#$%&\'()*+,-./:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~'
const W_REGULAR_ROW = [
  278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278,
  278, 278, 584, 584, 584, 556, 1015, 667, 667, 722, 722, 667, 611, 778, 722, 278,
  500, 667, 556, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667,
  611, 278, 278, 278, 469, 556, 333, 556, 556, 500, 556, 556, 278, 556, 556, 222,
  222, 500, 222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500,
  500, 334, 260, 334, 584,
]
const W_BOLD_ROW = [
  278, 333, 474, 556, 556, 889, 722, 238, 333, 333, 389, 584, 278, 333, 278, 278,
  333, 333, 584, 584, 584, 611, 975, 722, 722, 722, 722, 667, 611, 778, 722, 278,
  556, 722, 611, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667,
  611, 333, 278, 333, 584, 556, 333, 556, 611, 556, 611, 556, 333, 611, 611, 278,
  278, 556, 278, 889, 611, 611, 611, 611, 389, 556, 333, 611, 556, 778, 556, 556,
  500, 389, 280, 389, 584,
]

if (W_REGULAR_ROW.length !== GLYPHS.length || W_BOLD_ROW.length !== GLYPHS.length) {
  throw new Error("glyph/width table length mismatch")
}

function buildTable(row: number[]): Record<string, number> {
  const table: Record<string, number> = {}
  for (let i = 0; i < GLYPHS.length; i++) table[GLYPHS[i]] = row[i]
  for (let d = 0; d <= 9; d++) table[String(d)] = 556
  return table
}

const W_REGULAR = buildTable(W_REGULAR_ROW)
const W_BOLD = buildTable(W_BOLD_ROW)

/** Rendered width of `text` at `size` in points, for the given weight table. */
function textWidth(text: string, size: number, table: Record<string, number>): number {
  let units = 0
  for (const ch of text) units += table[ch] ?? 556
  return (units / 1000) * size
}

  const buf = readFileSync(file)
  const latin = buf.toString("latin1")

  /*
   * Structural checks below measure glyph advances with the standard-14 AFM
   * tables, which only hold for the built-in fonts. A subset TTF is written as a
   * Type0/CIDFont pair emitting glyph indices, so the decoded text and its
   * widths are both wrong and every geometry check would report noise. Detect it
   * from the font dictionary rather than the BaseFont name, whose suffix varies
   * by producer ("Arial-BoldMT", "NotoSansCJKsc-Bold", ...).
   */
  const SUBSET_TTF = /\/Subtype\s*\/Type0|\/Subtype\s*\/CIDFontType2/.test(latin)
  if (SUBSET_TTF) {
    console.log(
      "note: a subset TTF font is in use; the width/collision/bounds checks need\n" +
        "      the real font metrics and are skipped. The content checks still apply."
    )
    if (process.env.PDF_STRICT_TTF === "1") {
      console.log("  (PDF_STRICT_TTF=1 -> treating this as a failure)")
      process.exit(1)
    }
  }

const pageStreams: string[] = []
const re = /stream\r?\n/g
let m: RegExpExecArray | null
while ((m = re.exec(latin))) {
  const start = m.index + m[0].length
  const end = latin.indexOf("endstream", start)
  if (end === -1) continue
  try {
    const text = inflateSync(buf.subarray(start, end)).toString("latin1")
    if (text.includes("BT")) pageStreams.push(text)
  } catch {
    /* not a flate stream (e.g. an embedded font) */
  }
}

const pageCount = (latin.match(/\/Type\s*\/Page[^s]/g) || []).length

// Resolve /F1, /F2 ... to their real weight via the page's /Font resource
// dictionary, so bold text is measured with bold metrics instead of guessed.
const FONT_WEIGHT = new Map<string, "regular" | "bold">()
for (const dict of latin.match(/\/Font\s*<<[\s\S]*?>>/g) || []) {
  for (const entry of dict.matchAll(/\/(\w+)\s+(\d+)\s+0\s+R/g)) {
    const [, name, objNum] = entry
    const obj = new RegExp(`(?<![0-9])${objNum} 0 obj([\\s\\S]*?)endobj`).exec(latin)
    if (!obj) continue
    FONT_WEIGHT.set(name, /Helvetica-Bold/.test(obj[1]) ? "bold" : "regular")
  }
}
console.log(`font weights : ${[...FONT_WEIGHT.entries()].map(([k, v]) => `${k}=${v}`).join(", ")}`)

/*
 * CMap from each font's /ToUnicode stream, so CID-keyed text (what a subset TTF
 * emits) decodes back to the characters actually written. Without it every glyph
 * index reads as a control character and the content checks cannot run.
 */
const TO_UNICODE = new Map<string, Map<number, string>>()
for (const dict of latin.match(/\/Font\s*<<[\s\S]*?>>/g) || []) {
  for (const entry of dict.matchAll(/\/(\w+)\s+(\d+)\s+0\s+R/g)) {
    const [, name, objNum] = entry
    const obj = new RegExp(`(?<![0-9])${objNum} 0 obj([\\s\\S]*?)endobj`).exec(latin)
    if (!obj) continue
    const ref = /\/ToUnicode\s+(\d+)\s+0\s+R/.exec(obj[1])
    if (!ref) continue

    // Locate the stream by absolute offset from the object's own position, which
    // is where `inflateSync` needs it; measuring inside the captured group
    // instead yields offsets relative to the match and inflates garbage.
    const objStart = new RegExp(`(?<![0-9])${ref[1]} 0 obj`).exec(latin)?.index
    if (objStart === undefined) continue
    const sIdx = latin.indexOf("stream", objStart)
    if (sIdx === -1) continue
    const dataStart = latin.indexOf("\n", sIdx) + 1
    const dataEnd = latin.indexOf("endstream", sIdx)
    if (dataStart <= 0 || dataEnd <= dataStart) continue

    let cmap = ""
    try {
      cmap = inflateSync(buf.subarray(dataStart, dataEnd)).toString("latin1")
    } catch {
      continue
    }

    const table = new Map<number, string>()
    // bfchar: <srcCode> <dstString>
    for (const m of cmap.matchAll(/beginbfchar([\s\S]*?)endbfchar/g)) {
      for (const pair of m[1].matchAll(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]*)>/g)) {
        const src = parseInt(pair[1], 16)
        const dst = (pair[2].match(/.{4}/g) || []).map((h) => String.fromCharCode(parseInt(h, 16))).join("")
        table.set(src, dst)
      }
    }
    // bfrange: <lo> <hi> <dstStart>, plus the array form <lo> <hi> [<d1> <d2> ...]
    for (const m of cmap.matchAll(/beginbfrange([\s\S]*?)endbfrange/g)) {
      for (const range of m[1].matchAll(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*(\[[\s\S]*?\]|<[0-9A-Fa-f]*>)/g)) {
        const lo = parseInt(range[1], 16)
        const hi = parseInt(range[2], 16)
        if (range[3].startsWith("[")) {
          const items = [...range[3].matchAll(/<([0-9A-Fa-f]*)>/g)]
          items.forEach((it, i) => {
            const dst = (it[1].match(/.{4}/g) || []).map((h) => String.fromCharCode(parseInt(h, 16))).join("")
            table.set(lo + i, dst)
          })
        } else {
          const startHex = range[3].replace(/[<>]/g, "")
          const base = parseInt(startHex.slice(-4), 16)
          const prefix = startHex.length > 4 ? startHex.slice(0, -4) : ""
          for (let c = lo; c <= hi && c - lo < 65536; c++) {
            const tail = (base + (c - lo)).toString(16).padStart(4, "0")
            table.set(c, String.fromCharCode(parseInt(prefix + tail, 16)))
          }
        }
      }
    }
    if (table.size) TO_UNICODE.set(name, table)
  }
}
if (TO_UNICODE.size) {
  console.log(`cmaps        : ${[...TO_UNICODE.keys()].join(", ")} (${TO_UNICODE.values().next().value?.size} entries each)`)
}

console.log(`page count   : ${pageCount} (${pageStreams.length} content streams)`)

interface Run {
  page: number
  x: number
  y: number
  size: number
  font: string
  text: string
  /** Kerning adjustment in 1/1000 em, summed from the TJ array. */
  kern: number
}

const runs: Run[] = []
pageStreams.forEach((stream, idx) => {
  const runRe =
    /BT\s+[\d.\-]+\s+[\d.\-]+\s+[\d.\-]+\s+[\d.\-]+\s+([\d.\-]+)\s+([\d.\-]+)\s+Tm\s*\/(\w+)\s+([\d.]+)\s+Tf\s*\[([\s\S]*?)\]\s*TJ/g
  let r: RegExpExecArray | null
  while ((r = runRe.exec(stream))) {
    // The TJ array interleaves hex glyph chunks with kerning numbers. A positive
    // number tightens the gap, so it reduces the advance. pdfkit right-aligns
    // using the kerned width, and ignoring this overstates every width by a few
    // points and reports clean text as bleeding past the margin.
    const cmap = TO_UNICODE.get(r[3])
    let text = ""
    let kern = 0
    for (const token of r[5].trim().split(/\s+/)) {
      if (token.startsWith("<")) {
        const bytes = Buffer.from(token.slice(1, -1), "hex")
        if (cmap) {
          // CID font: each 2-byte code is a glyph index into the ToUnicode CMap.
          for (let i = 0; i + 1 < bytes.length; i += 2) {
            const gid = (bytes[i] << 8) | bytes[i + 1]
            text += cmap.get(gid) ?? ""
          }
        } else {
          text += bytes.toString("latin1")
        }
      } else {
        kern += Number(token)
      }
    }
    if (!text.trim()) continue
    runs.push({
      page: idx + 1,
      x: Number(r[1]),
      y: Number(r[2]),
      font: r[3],
      size: Number(r[4]),
      text,
      kern,
    })
  }
})

console.log(`text runs    : ${runs.length}`)

const PAGE_W = 595.28
const PAGE_H = 841.89

/** Kerned advance width of the run, matching how pdfkit positioned it. */
const widthOf = (r: Run) =>
  textWidth(r.text, r.size, FONT_WEIGHT.get(r.font) === "bold" ? W_BOLD : W_REGULAR) -
  (r.kern / 1000) * r.size

// ---- Collision detection --------------------------------------------------
// Two runs collide when they share a baseline and their horizontal extents
// overlap. This is the failure mode of a table whose cell padding or reserved
// row height is wrong.
const EPS_Y = 1.0
// Overlap needs a glyph width, so the same TTF caveat applies here.
let collisions = 0
if (SUBSET_TTF) {
  console.log(`collisions   : skipped (subset TTF, widths unknown)`)
}
for (let i = 0; !SUBSET_TTF && i < runs.length; i++) {
  for (let j = i + 1; j < runs.length; j++) {
    const a = runs[i]
    const b = runs[j]
    if (a.page !== b.page) continue
    if (Math.abs(a.y - b.y) > EPS_Y) continue
    const overlap = Math.min(a.x + widthOf(a), b.x + widthOf(b)) - Math.max(a.x, b.x)
    if (overlap > 0.5) {
      collisions++
      if (collisions <= 8) {
        console.log(
          `  COLLISION p${a.page} y=${a.y.toFixed(1)}: "${a.text}" ` +
            `x[${a.x.toFixed(1)}..${(a.x + widthOf(a)).toFixed(1)}]  vs  "${b.text}" ` +
            `x[${b.x.toFixed(1)}..${(b.x + widthOf(b)).toFixed(1)}]  overlap=${overlap.toFixed(1)}pt`
        )
      }
    }
  }
}
if (!SUBSET_TTF) console.log(`collisions   : ${collisions}`)

// ---- Bounds ---------------------------------------------------------------
const offPage = runs.filter((r) => r.x < 0 || r.x > PAGE_W || r.y < 0 || r.y > PAGE_H)
console.log(`off-page runs: ${offPage.length}`)

// Widths are only meaningful for the built-in fonts; see the TTF note above.
const marginViolations = SUBSET_TTF
  ? []
  : runs.filter((r) => r.x < 39.5 || r.x + widthOf(r) > PAGE_W - 39.5)
console.log(`margin bleed : ${marginViolations.length}${SUBSET_TTF ? " (skipped: TTF)" : ""}`)
for (const r of marginViolations) {
  const right = r.x + widthOf(r)
  console.log(
    `  p${r.page} y=${r.y.toFixed(1)} x=${r.x.toFixed(1)} w=${widthOf(r).toFixed(1)} ` +
      `right=${right.toFixed(1)} limit=${(PAGE_W - 39.5).toFixed(1)} ` +
      `side=${r.x < 39.5 ? "LEFT" : "RIGHT"} | "${r.text}"`
  )
}

// ---- Content sanity (ASCII labels so the output survives any console) -----
const allText = runs.map((r) => r.text).join(" ")
/**
 * A wrapped line is emitted as a separate text run, so a long value can straddle
 * two runs and pick up a joining space mid-word ("balance bef" + "ore"). Compare
 * with whitespace removed as a fallback so wrapping is not read as corruption.
 */
const squash = (s: string) => s.replace(/\s+/g, "")
const has = (s: string) => allText.includes(s) || squash(allText).includes(squash(s))

/** Runs whose decoded text contains any character outside printable Latin-1. */
const nonLatinRuns = () =>
  runs.filter((r) => [...r.text].some((c) => c.codePointAt(0)! > 0x7f && c !== "\n"))
if (process.env.PDF_DEBUG_NONLATIN) {
  for (const r of nonLatinRuns()) {
    console.log(
      `  run p${r.page} ${r.font} ${r.size}pt y=${r.y.toFixed(1)} ` +
        `${JSON.stringify(r.text)} :: ${[...r.text].map((c) => c.codePointAt(0)!.toString(16)).join(" ")}`
    )
  }
}
const checks: [string, boolean][] = [
  ["heading QUOTATION", has("QUOTATION")],
  ["quotation no QT-xxxxxxxxxxx", /QT-\d{11}/.test(allText)],
  ["inquiry ref RFQ-", /RFQ-\d{9,}/.test(allText)],
  // At least one thousands group: raw `6250.00` reads as noise on a B2B offer.
  ["thousands separator", /\d{1,3},\d{3}(?:,\d{3})*\.\d{2}/.test(allText)],
  ["currency symbol $", has("$")],
  ["label MOQ", has("MOQ")],
  ["label LEAD TIME", has("LEAD TIME")],
  ["label PAYMENT TERMS", has("PAYMENT TERMS")],
  ["label SHIPPING TERMS", has("SHIPPING TERMS")],
  ["label VALIDITY", has("VALIDITY")],
  ["label QUOTED TO", has("QUOTED TO")],
  ["label SUPPLIER", has("SUPPLIER")],
  ["label DESCRIPTION", has("DESCRIPTION")],
  ["label QTY", has("QTY")],
  ["label UNIT PRICE", has("UNIT PRICE")],
  ["label AMOUNT", has("AMOUNT")],
  ["label TOTAL", has("TOTAL")],
  ["label NOTE", has("NOTE")],
  ["validity sentence", has("valid until")],
]

/*
 * The fixture's own values are supplied by the generator, so the identity checks
 * below are read from a manifest the generator writes next to the PDF. That keeps
 * the verifier honest for both the ASCII and the --intl fixture without either
 * hard-coding the other's text.
 */
interface Manifest {
  supplier?: string
  customer?: string
  supplierEmail?: string
  customerEmail?: string
  /** Values the configured font covers, which must survive into the PDF verbatim. */
  values?: string[]
  /**
   * Values exceeding the font's glyph coverage. `expected` is the exact form a
   * correct renderer must produce, with `?` in place of each undrawable character.
   */
  partialValues?: { source: string; expected: string }[]
  /** True when the fixture is non-Latin. */
  intl?: boolean
  /** True when a real Unicode TTF was embedded, false for the built-in Helvetica. */
  unicodeFont?: boolean
}
let manifest: Manifest = {}
const manifestPath = file.replace(/\.pdf$/i, ".json")
if (existsSync(manifestPath)) {
  try {
    manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as Manifest
  } catch (e) {
    console.error(`  could not parse ${manifestPath}: ${e instanceof Error ? e.message : e}`)
  }
}

/*
 * Identity checks, driven by the manifest the generator wrote beside the PDF.
 *
 * The generator measures the configured font's real glyph coverage and sorts the
 * fixture's values accordingly. Values the font covers must appear verbatim.
 * Values it does not cover must appear with '?' substituted for each missing
 * character and must NOT appear intact, which is what distinguishes correct
 * substitution from silently emitting the wrong glyph or a .notdef box.
 */

if (manifest.values || manifest.partialValues) {
  const covered = manifest.values ?? []
  const partial = manifest.partialValues ?? []
  if (partial.length) {
    console.log(
      `\n${partial.length} value(s) exceed the configured font's glyph coverage; each is\n` +
        "expected in the PDF with '?' in place of every undrawable character."
    )
  }

  checks.push(
    ["supplier email", has(manifest.supplierEmail ?? "")],
    ["customer email", has(manifest.customerEmail ?? "")],
    ["quotation number", /QT-\d{11}/.test(allText)],
    // Covered values must arrive intact.
    ...covered.map((v, i) => [`covered value ${i + 1} intact`, has(v)] as [string, boolean]),
    // Each uncovered value must have lost every character the font cannot draw.
    //
    // This compares presence, not order or spacing. PDFKit shapes a mixed-direction
    // value through the bidi algorithm, so an Arabic run between two Latin words
    // comes out visually reordered with its spaces moved, and a whole-string
    // equality check would call a correct document corrupt. The authoritative
    // signal that substitution happened is the .notdef check below.
    ...partial.map((p, i) => {
      const undrawable = [...new Set([...p.source])].filter(
        (c) => c !== "?" && c !== " " && !p.expected.includes(c)
      )
      const leaked = undrawable.filter((c) => allText.includes(c))
      return [
        `uncovered value ${i + 1} has no undrawable character`,
        undrawable.length > 0 && leaked.length === 0,
      ] as [string, boolean]
    }),
    // The decisive check: a character with no glyph in the embedded font comes
    // through as .notdef, which decodes to U+0000. Any of these means the renderer
    // emitted a blank box in a document the customer is meant to treat as binding.
    [
      "no .notdef glyph in the document",
      !runs.some((r) => r.text.includes("\u0000")),
    ],
    // Where characters were dropped, the substitution marker must be visible.
    [
      "substitution marker present when something was dropped",
      partial.length === 0 || allText.includes("?"),
    ]
  )

  // Nothing beyond Latin may survive the built-in Helvetica.
  if (!manifest.unicodeFont) {
    checks.push(["no non-Latin glyph emitted by the built-in font", !/[Ѐ-ӿ؀-ۿ฀-๿一-鿿]/.test(allText)])
  }
} else {
  console.log("(no fixture manifest beside the PDF; identity checks skipped)")
}
console.log("\ncontent checks:")
let failed = 0
for (const [label, ok] of checks) {
  if (!ok) failed++
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}`)
}

// ---- Table geometry -------------------------------------------------------
console.log("\nper-page geometry:")
const byPage = new Map<number, Run[]>()
for (const r of runs) byPage.set(r.page, [...(byPage.get(r.page) ?? []), r])
for (const [p, list] of [...byPage.entries()].sort((a, b) => a[0] - b[0])) {
  const baselines = [...new Set(list.map((r) => Math.round(r.y)))].sort((a, b) => b - a)
  const minX = Math.min(...list.map((r) => r.x))
  const maxRight = Math.max(...list.map((r) => r.x + widthOf(r)))
  console.log(
    `  page ${p}: ${String(list.length).padStart(3)} runs, ` +
      `${String(baselines.length).padStart(3)} baselines, ` +
      `x[${minX.toFixed(0)}..${maxRight.toFixed(0)}]`
  )
}

// Every page after the first must repeat the column header, otherwise a buyer
// reading page 2 cannot tell which column is the amount.
if (pageCount > 1) {
  let headerRepeats = 0
  for (let p = 2; p <= pageCount; p++) {
    if (byPage.get(p)?.some((r) => r.text === "DESCRIPTION")) headerRepeats++
  }
  console.log(`\nheader repeated on ${headerRepeats}/${pageCount - 1} continuation pages`)
  if (headerRepeats !== pageCount - 1) {
    console.log("  FAIL  continuation page missing the column header")
    failed++
  }
}

const ok = collisions === 0 && failed === 0 && offPage.length === 0 && marginViolations.length === 0 && runs.length > 0
console.log(`\nresult: ${ok ? "PASS" : "FAIL"}`)
process.exit(ok ? 0 : 1)
