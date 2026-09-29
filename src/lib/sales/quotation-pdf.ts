import PDFDocument from "pdfkit"
import type { Currency } from "@prisma/client"
import { pdfLine, pdfText, registerPdfFonts, type PdfFont } from "./pdf-font"

export interface QuotationPdfLine {
  productName: string
  specification?: string | null
  quantity: number
  unit?: string | null
  unitPrice: number
  amount: number
}

export interface QuotationPdfData {
  quotationNo: string
  createdAt: Date
  validUntil: Date | null
  validityDays: number
  currency: Currency
  moq?: string | null
  leadTime?: string | null
  paymentTerms?: string | null
  shippingTerms?: string | null
  note?: string | null
  totalAmount: number
  items: QuotationPdfLine[]
  inquiry: {
    inquiryNo: string
    customerName: string
    companyName?: string | null
    email: string
    phone?: string | null
    whatsapp?: string | null
    country?: string | null
    city?: string | null
    address?: string | null
  }
  supplier: {
    siteName: string
    companyName?: string | null
    address?: string | null
    phone?: string | null
    email?: string | null
    website?: string | null
  }
}

const CURRENCY_SYMBOL: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  CNY: "¥",
  JPY: "¥",
  AUD: "A$",
  CAD: "C$",
}

const INK = "#1a1a1a"
const MUTED = "#6b7280"
const LINE = "#e5e7eb"
const ZEBRA = "#fafafa"

const PAGE = { width: 595.28, height: 841.89, margin: 40 }

function money(amount: number, currency: Currency): string {
  const symbol = CURRENCY_SYMBOL[currency] ?? `${currency} `
  // Thousands separators matter on a B2B offer: buyers compare figures digit by
  // digit, so raw `1200000` reads as noise while `1,200,000.00` reads as a price.
  return (
    symbol +
    amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  )
}

function shortDate(value: Date | null): string {
  if (!value) return "—"
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(value)
}

/**
 * Renders the offer as a Buffer.
 *
 * Every element is placed at an absolute coordinate and the document flow cursor
 * is tracked by hand. pdfkit's `text()` advances `doc.y` as a side effect, so
 * laying out a table out of `doc.y` makes each cell in a row drop below the
 * previous one; `drawAt` freezes the flow position around the call instead.
 */
export async function renderQuotationPdf(data: QuotationPdfData): Promise<Buffer> {
  const doc = new PDFDocument({
    size: "A4",
    margin: PAGE.margin,
    info: { Title: `Quotation ${data.quotationNo}`, Author: data.supplier.siteName },
  })

  /*
   * Resolved before any text is drawn. When a Unicode TTF is configured the
   * face renders CJK/Arabic/Cyrillic correctly; otherwise the built-in
   * Helvetica is used and `t()` strips what it cannot encode. Measured text uses
   * the same faces as drawing, or every column width below would be computed for
   * one font and rendered in another.
   */
  const font: PdfFont = registerPdfFonts(doc)
  /** Multi-line: keeps the break between a product name and its specification. */
  const t = (value: string | null | undefined) => pdfText(value, font)
  /** Single-line, for cells and figures that must not wrap. */
  const tl = (value: string | null | undefined) => pdfLine(value, font)
  const regular = font.regular
  const bold = font.bold

  const chunks: Buffer[] = []
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on("data", (c: Buffer) => chunks.push(c))
    doc.on("end", () => resolve(Buffer.concat(chunks)))
    doc.on("error", reject)
  })

  const left = PAGE.margin
  const right = PAGE.width - PAGE.margin
  const contentWidth = right - left
  const bottomLimit = PAGE.height - PAGE.margin

  /** Draw without disturbing the flow cursor. */
  function drawAt(x: number, y: number, fn: (d: PDFKit.PDFDocument) => void) {
    const sx = doc.x
    const sy = doc.y
    doc.x = x
    doc.y = y
    fn(doc)
    doc.x = sx
    doc.y = sy
  }

  /** Manual cursor; the only thing allowed to move the layout down. */
  let cursor = PAGE.margin

  const line = (y: number, width = 0.5, color = LINE) => {
    doc.moveTo(left, y).lineTo(right, y).lineWidth(width).strokeColor(color).stroke()
  }

  // ---- Header -------------------------------------------------------------
  const headerBottom = Math.max(
    // Supplier block, measured rather than assumed, because a long registered
    // address must not run into the QUOTATION block beside it.
    PAGE.margin + 26 + supplierBlockHeight(data.supplier),
    PAGE.margin + 58
  )

  drawAt(left, PAGE.margin, (d) => {
    d.fillColor(INK).fontSize(20).font(bold).text(t(data.supplier.siteName), {
      width: contentWidth * 0.6,
    })
    d
      .moveDown(0.2)
      .fontSize(9)
      .font(regular)
      .fillColor(MUTED)
      .text(t([data.supplier.companyName, data.supplier.address].filter(Boolean).join("\n")), {
        width: contentWidth * 0.6,
      })
  })

  const metaX = right - 220
  const metaLines: [string, number][] = [
    [tl(data.quotationNo), 10],
    [`Date: ${shortDate(data.createdAt)}`, 10],
    [`Valid until: ${shortDate(data.validUntil)}`, 10],
    [`Our ref: ${tl(data.inquiry.inquiryNo)}`, 8],
  ]
  drawAt(metaX, PAGE.margin - 4, (d) => {
    d.fontSize(16).font(bold).fillColor(INK).text("QUOTATION", { width: 220, align: "right" })
    let y = PAGE.margin + 20
    for (const [text, size] of metaLines) {
      d.fontSize(size).font(regular).fillColor(MUTED).text(text, metaX, y, {
        width: 220,
        align: "right",
        lineBreak: false,
      })
      y += size + 4
    }
  })

  cursor = headerBottom + 14
  line(cursor)
  cursor += 16

  // ---- Parties ------------------------------------------------------------
  const colGap = 20
  const colWidth = (contentWidth - colGap) / 2

  const drawParty = (heading: string, lines: (string | null | undefined)[], x: number) => {
    const body = t(lines.filter((l): l is string => Boolean(l && l.trim())).join("\n"))
    const headingH = 11
    const bodyH = doc.fontSize(9.5).font(regular).heightOfString(body, { width: colWidth })
    drawAt(x, cursor, (d) => {
      d
        .fontSize(8)
        .font(bold)
        .fillColor(MUTED)
        .text(heading.toUpperCase(), { width: colWidth })
    })
    drawAt(x, cursor + headingH, (d) => {
      d.fontSize(9.5).font(regular).fillColor(INK).text(body, { width: colWidth })
    })
    return headingH + bodyH
  }

  const leftPartyH = drawParty(
    "Quoted to",
    [
      data.inquiry.customerName,
      data.inquiry.companyName,
      [data.inquiry.city, data.inquiry.country].filter(Boolean).join(", "),
      data.inquiry.address,
      data.inquiry.email,
      [data.inquiry.phone, data.inquiry.whatsapp].filter(Boolean).join(" / "),
    ],
    left
  )
  const rightPartyH = drawParty(
    "Supplier",
    [
      data.supplier.siteName,
      data.supplier.companyName,
      data.supplier.address,
      data.supplier.email,
      [data.supplier.phone, data.supplier.website].filter(Boolean).join(" / "),
    ],
    left + colWidth + colGap
  )

  cursor += Math.max(leftPartyH, rightPartyH) + 14
  line(cursor)
  cursor += 14

  // ---- Terms --------------------------------------------------------------
  // Terms are free text typed by staff, so they need sanitising like any other
  // user-supplied value.
  const terms: [string, string][] = [
    ["MOQ", t(data.moq) || "—"],
    ["Lead time", t(data.leadTime) || "—"],
    ["Payment terms", t(data.paymentTerms) || "—"],
    ["Shipping terms", t(data.shippingTerms) || "—"],
    ["Validity", `${data.validityDays} days`],
  ]
  const termColWidth = contentWidth / 3
  const termRowHeight = 30
  terms.forEach(([label, value], i) => {
    const x = left + (i % 3) * termColWidth
    const y = cursor + Math.floor(i / 3) * termRowHeight
    drawAt(x, y, (d) => {
      d
        .fontSize(7.5)
        .font(bold)
        .fillColor(MUTED)
        .text(label.toUpperCase(), { width: termColWidth - 12 })
    })
    const valueH = drawAt(x, y + 12, (d) => {
      d.fontSize(9.5).font(regular).fillColor(INK).text(value, { width: termColWidth - 12 })
      return 0
    })
    void valueH
  })
  cursor += Math.ceil(terms.length / 3) * termRowHeight + 4

  // ---- Line items table ---------------------------------------------------
  // Description absorbs the slack so long product names wrap instead of
  // truncating; the numeric columns stay fixed so figures line up.
  const PAD = 6
  /*
   * Column widths are fractions of the content width. qty is sized against the
   * widest realistic figure — a 3-decimal tonnage with a unit, e.g.
   * "999999.999 tons" measures 70.8pt at 9.5pt Helvetica — because a quantity
   * that overflows its column is silently clipped by `lineBreak: false` and the
   * buyer reads a different number than the one quoted.
   */
  const cols = {
    no: 26,
    description: contentWidth * 0.4,
    qty: contentWidth * 0.16,
    unitPrice: contentWidth * 0.17,
    amount: 0,
  }
  cols.amount = contentWidth - cols.no - cols.description - cols.qty - cols.unitPrice

  const tableHeader = (y: number) => {
    doc.rect(left, y, contentWidth, 20).fill("#f4f5f7")
    let x = left + PAD
    drawAt(x, y + 6.5, (d) => {
      d.fontSize(7.5).font(bold).fillColor(MUTED).text("#", { width: cols.no - PAD })
    })
    x += cols.no
    drawAt(x, y + 6.5, (d) => {
      d
        .fontSize(7.5)
        .font(bold)
        .fillColor(MUTED)
        .text("DESCRIPTION", { width: cols.description - PAD })
    })
    x += cols.description
    drawAt(x, y + 6.5, (d) => {
      d
        .fontSize(7.5)
        .font(bold)
        .fillColor(MUTED)
        .text("QTY", { width: cols.qty - PAD, align: "right" })
    })
    x += cols.qty
    drawAt(x, y + 6.5, (d) => {
      d
        .fontSize(7.5)
        .font(bold)
        .fillColor(MUTED)
        .text("UNIT PRICE", { width: cols.unitPrice - PAD, align: "right" })
    })
    x += cols.unitPrice
    drawAt(x, y + 6.5, (d) => {
      d
        .fontSize(7.5)
        .font(bold)
        .fillColor(MUTED)
        .text("AMOUNT", { width: cols.amount - PAD, align: "right" })
    })
    return y + 20
  }

  cursor = tableHeader(cursor)

  /*
   * Room that must stay free at the foot of the last page for the total, the
   * optional note and the closing sentence.
   *
   * The closing sentence is measured here rather than assumed to be one line: it
   * wraps to two on a narrow page, and reserving a flat 78pt let the overflow
   * orphan onto a page of its own, leaving a buyer with a final page containing
   * no table at all.
   */
  const closingText =
    `This quotation is valid until ${shortDate(data.validUntil)}. Prices are subject to final ` +
    `confirmation of specification and quantity. Please reference ${tl(data.quotationNo)} ` +
    `when replying.`
  const closingH = doc.fontSize(8).font(regular).heightOfString(tl(closingText), {
    width: contentWidth,
  })
  const noteH = data.note
    ? doc.fontSize(9).font(regular).heightOfString(t(data.note), { width: contentWidth })
    : 0

  /*
   * The trailing block is the total row, the optional note and the closing
   * sentence. Its height is measured here — before the item loop — so the same
   * value both reserves space at the foot of the last page and decides whether
   * the block needs a page of its own. Deriving the reserve and the break test
   * from one measurement is what stops the two disagreeing and orphaning the
   * closing onto an empty final page.
   */
  const tailH = 10 + 20 + (data.note ? 8 + 11 + noteH : 0) + 20 + closingH

  data.items.forEach((item, index) => {
    const descText = t(
      item.specification
        ? `${item.productName}\n${item.specification}`
        : item.productName
    )

    const descH = doc.fontSize(9.5).font(regular).heightOfString(descText, {
      width: cols.description - PAD,
    })
    const rowHeight = Math.max(22, descH + PAD * 2)

    // Break before drawing, never mid-row.
    if (cursor + rowHeight > bottomLimit - tailH) {
      doc.addPage()
      cursor = PAGE.margin
      cursor = tableHeader(cursor)
    }

    const y = cursor
    if (index % 2 === 1) {
      doc.rect(left, y, contentWidth, rowHeight).fill(ZEBRA)
    }

    // The index cell is plain ASCII, so the new one on a continuation page is
    // never a wrapping risk.

    // `isBold` rather than `bold`: the latter now names the font family.
    const rightCell = (text: string, x: number, width: number, isBold = false) => {
      drawAt(x, y + PAD, (d) => {
        d
          .fontSize(9.5)
          .font(isBold ? bold : regular)
          .fillColor(isBold ? INK : MUTED)
          // Flattened and `lineBreak:false`: a long product name in a numeric
          // column must be truncated by the column, not wrap into the next one.
          .text(tl(text), { width: width - PAD, align: "right", lineBreak: false })
      })
    }

    let x = left + PAD
    drawAt(x, y + PAD, (d) => {
      d.fontSize(9.5).font(regular).fillColor(MUTED).text(String(index + 1), {
        width: cols.no - PAD,
      })
    })
    x += cols.no
    drawAt(x, y + PAD, (d) => {
      d.fontSize(9.5).font(regular).fillColor(INK).text(descText, {
        width: cols.description - PAD,
      })
    })
    x += cols.description
    rightCell(
      item.unit ? `${item.quantity} ${tl(item.unit)}` : String(item.quantity),
      x,
      cols.qty
    )
    x += cols.qty
    rightCell(money(item.unitPrice, data.currency), x, cols.unitPrice)
    x += cols.unitPrice
    rightCell(money(item.amount, data.currency), x, cols.amount, true)

    cursor = y + rowHeight
    line(cursor)
  })

  // ---- Total --------------------------------------------------------------
  /*
   * The total, the optional note and the closing sentence are one visual block
   * and are kept together. Their combined height is measured rather than
   * estimated, because a note or a wrapped closing sentence that spilled onto a
   * fresh page would leave the buyer with a final page holding nothing but
   * boilerplate.
   */
  if (cursor + tailH > bottomLimit) {
    doc.addPage()
    cursor = PAGE.margin
  }
  cursor += 10
  const totalTop = cursor
  drawAt(right - cols.amount - 110, totalTop, (d) => {
    d
      .fontSize(9)
      .font(bold)
      .fillColor(MUTED)
      .text("TOTAL", { width: 110, align: "right" })
  })
  drawAt(right - cols.amount, totalTop - 3, (d) => {
    d
      .fontSize(13)
      .font(bold)
      .fillColor(INK)
      .text(money(data.totalAmount, data.currency), { width: cols.amount, align: "right" })
  })
  cursor = totalTop + 20

  // ---- Note ---------------------------------------------------------------
  if (data.note) {
    // Bound to a local first: the callback closes over this, and reading
    // `data.note` inside it would widen back to string | null | undefined.
    // `noteH` is the value measured before the item loop, so the two agree, and
    // the `tailH` check above has already guaranteed this block fits.
    const note = t(data.note)
    drawAt(left, cursor + 8, (d) => {
      d.fontSize(8).font(bold).fillColor(MUTED).text("NOTE", { width: contentWidth })
    })
    drawAt(left, cursor + 8 + 11, (d) => {
      d.fontSize(9).font(regular).fillColor(INK).text(note, { width: contentWidth })
    })
    cursor += 8 + 11 + noteH
  }

  // ---- Closing ------------------------------------------------------------
  // Pinned to the foot of the page. The `tailH` check above guarantees it fits
  // below the total, so this can no longer need a page of its own.
  cursor = Math.max(cursor + 10, bottomLimit - closingH - 14)
  line(cursor)
  drawAt(left, cursor + 10, (d) => {
    d
      .fontSize(8)
      .font(regular)
      .fillColor(MUTED)
      .text(tl(closingText), { width: contentWidth, align: "center" })
  })

  doc.end()
  return done
}

/** Estimated height of the supplier address block, used to size the header. */
function supplierBlockHeight(supplier: QuotationPdfData["supplier"]): number {
  const lines = [supplier.companyName, supplier.address].filter(Boolean)
  return 26 + lines.length * 11
}
