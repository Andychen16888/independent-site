/**
 * Font handling for the quotation PDF.
 *
 * PDFKit's built-in Helvetica is WinAnsi-encoded. It does not fail loudly on
 * characters it cannot represent — it writes the wrong glyph code, so a Chinese
 * or Arabic buyer name renders as mojibake in a document the customer is meant to
 * treat as binding. Verified behaviour of the built-in font:
 *
 *   "Łódź"   -> "\x14\x1f6Az"      (Latin Extended lost, silently)
 *   "Сталь"  -> "B\x14BC\x04;D"   (Cyrillic lost)
 *   "张三"    -> "_ N\t"            (CJK lost)
 *   "محمد"   -> "dV-dV/"           (Arabic lost, wrong glyphs)
 *
 * A real Unicode font fixes this properly, so the fonts are looked up at runtime
 * rather than hard-coded. Nothing is bundled: a font file is a licensed artefact
 * and should be chosen and committed by the site operator, not shipped by a
 * dependency. Set QUOTATION_PDF_FONT / _FONT_BOLD to the path of a single
 * .ttf or .otf face, or drop files named quotation-regular.ttf /
 * quotation-bold.ttf in public/fonts.
 *
 * Font *collections* (.ttc, .otc) are rejected. PDFKit cannot subset one and
 * only discovers that when drawing text, so accepting one would turn a
 * misconfiguration into a failed PDF request rather than a legible document.
 *
 * When no Unicode font is configured the renderer falls back to Helvetica and
 * runs every string through `toWinAnsi`, which strips what cannot be encoded
 * instead of emitting a wrong glyph. Losing a character is visible; a wrong
 * price or name is not.
 */

import { existsSync } from "node:fs"
import { join } from "node:path"
import * as fontkit from "fontkit"

export interface PdfFont {
  regular: string
  bold: string
  /** True when a real Unicode TTF is in use, so WinAnsi sanitising is not needed. */
  unicode: boolean
  /**
   * Reports whether the font actually has a glyph for a character. Null when no
   * Unicode font is configured, in which case coverage is decided by WinAnsi.
   */
  hasGlyph?: (char: string) => boolean
}

const FALLBACK: PdfFont = { regular: "Helvetica", bold: "Helvetica-Bold", unicode: false }

let cached: PdfFont | null = null

/**
 * Loads a TTF with fontkit to test glyph coverage.
 *
 * A Unicode TTF is not automatically complete. SimHei, for instance, carries CJK
 * and Cyrillic but no Arabic or Thai, and PDFKit renders a missing glyph as a
 * silent `.notdef` box rather than failing. Configuring a font therefore does not
 * by itself make the document safe; the coverage of the chosen face has to be
 * checked per character.
 *
 * Returns null for anything that is not a single embeddable face -- most often a
 * font *collection* such as `msyh.ttc`. A collection opens fine and reports no
 * coverage API, and PDFKit only discovers it cannot subset the font when the
 * first line of text is drawn, which is outside any error handling this module
 * can offer. Rejecting it here turns a failed PDF request into a usable document.
 */
function glyphLookup(path: string): ((char: string) => boolean) | null {
  try {
    const font = fontkit.openSync(path) as { hasGlyphForCodePoint?: (cp: number) => boolean }
    if (typeof font?.hasGlyphForCodePoint !== "function") {
      console.warn(
        `Quotation PDF font ${path} is not a single embeddable font face ` +
          "(font collections such as .ttc are not supported). " +
          "Point QUOTATION_PDF_FONT at a .ttf or .otf file instead."
      )
      return null
    }
    return (char: string) => {
      const cp = char.codePointAt(0)
      return cp === undefined ? false : font.hasGlyphForCodePoint!(cp)
    }
  } catch (e) {
    console.error(`Quotation PDF font ${path} could not be inspected for glyph coverage`, e)
    return null
  }
}

/** Candidate paths in priority order: explicit env var, then public/fonts. */
function candidates(prefix: "REGULAR" | "BOLD"): string[] {
  const envKey = prefix === "REGULAR" ? "QUOTATION_PDF_FONT" : "QUOTATION_PDF_FONT_BOLD"
  const fileName = prefix === "REGULAR" ? "quotation-regular.ttf" : "quotation-bold.ttf"
  const list: string[] = []
  const fromEnv = process.env[envKey]
  if (fromEnv) list.push(fromEnv)
  list.push(join(process.cwd(), "public", "fonts", fileName))
  return list
}

export function resolvePdfFont(): PdfFont {
  if (cached) return cached

  const existing = (prefix: "REGULAR" | "BOLD") => candidates(prefix).find((p) => p && existsSync(p))

  /*
   * A font is only accepted if its coverage can be inspected. That single test
   * rejects font collections (which PDFKit cannot subset) and unreadable files,
   * and it is also what makes the sanitiser trustworthy: without `hasGlyph`,
   * `toDrawable` would let every character through and PDFKit would emit
   * `.notdef` boxes for whatever the font happens to lack. Falling back to
   * Helvetica loses characters visibly, which is the safer failure for a
   * document the customer treats as binding.
   */
  const regular = existing("REGULAR")
  let hasGlyph: ((char: string) => boolean) | null = null
  if (regular) hasGlyph = glyphLookup(regular)

  if (!regular || !hasGlyph) {
    cached = FALLBACK
    return cached
  }

  // A bold face is optional; the regular face is reused when absent, which costs
  // emphasis but never legibility.
  const bold = existing("BOLD") ?? regular
  cached = { regular, bold, unicode: true, hasGlyph }
  return cached
}

/**
 * PDFKit resolves the standard 14 fonts by name; a TTF has to be registered on
 * the document first. Call once per document before any text is drawn.
 */
export function registerPdfFonts(doc: PDFKit.PDFDocument): PdfFont {
  const font = resolvePdfFont()
  if (font.unicode) {
    try {
      doc.registerFont("body", font.regular)
      doc.registerFont("body-bold", font.bold)
      // The coverage lookup must be carried over, not dropped: without it the
      // sanitiser treats every character as drawable and PDFKit silently emits
      // .notdef boxes for whatever the font does not cover.
      return { regular: "body", bold: "body-bold", unicode: true, hasGlyph: font.hasGlyph }
    } catch (e) {
      // An unreadable or malformed TTF must not fail the whole document; drop
      // back to the built-in font and sanitise.
      console.error("Quotation PDF font could not be registered, falling back", e)
    }
  }
  return FALLBACK
}

/*
 * WinAnsi (cp1252) is Latin-1 plus a set of typographic characters in 0x80-0x9F.
 * Anything outside it cannot be represented, so it is replaced rather than
 * passed through to become the wrong glyph.
 */
const WIN_ANSI_RE = /[^\u0000-\u007F\u20AC\u201A\u0192\u201E\u2026\u2020\u2021\u02C6\u2030\u0160\u2039\u0152\u017D\u2018\u2019\u201C\u201D\u2022\u2013\u2014\u02DC\u2122\u0161\u203A\u0153\u017E\u0178]/g

/** Strips characters the built-in font would mis-render. */
export function toWinAnsi(value: string): string {
  return value.replace(WIN_ANSI_RE, "?")
}

/**
 * Replaces every character the font in use cannot draw.
 *
 * With the built-in Helvetica that is every non-WinAnsi character. With a Unicode
 * TTF it is whatever that particular face lacks, which is not nothing: a CJK font
 * with no Arabic coverage would otherwise emit `.notdef` boxes for an Arabic
 * buyer name. Characters the font genuinely has are left untouched.
 */
export function toDrawable(value: string, font: PdfFont): string {
  if (!font.unicode) return toWinAnsi(value)
  if (!font.hasGlyph) return value
  return Array.from(value, (char) =>
    char === "\n" || char === "\t" || font.hasGlyph!(char) ? char : "?"
  ).join("")
}

/** Collapses every whitespace run, newlines included, to a single space. */
function flatten(value: string): string {
  return value.replace(/\s+/g, " ").trim()
}

/**
 * Multi-line value: horizontal whitespace runs are collapsed but line breaks are
 * preserved, because the renderer relies on them to lay out a product name above
 * its specification.
 */
export function pdfText(value: string | null | undefined, font: PdfFont): string {
  if (value == null) return ""
  const trimmed = value
    .split(/\r?\n/)
    .map((line) => line.replace(/[^\S\n]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
  return toDrawable(trimmed, font)
}

/** Single-line value, for table cells and right-aligned figures. */
export function pdfLine(value: string | null | undefined, font: PdfFont): string {
  if (value == null) return ""
  return toDrawable(flatten(value), font)
}
