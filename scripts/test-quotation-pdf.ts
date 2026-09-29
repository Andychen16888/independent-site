/**
 * Generates a quotation PDF using non-Latin customer and product data, so the
 * font handling can be checked end to end.
 *
 *   npx tsx scripts/test-quotation-pdf.ts <out.pdf> [rows] [--intl]
 *
 * With --intl the fixture uses CJK, Arabic, Thai, Cyrillic and accented Latin
 * names. Under the built-in Helvetica these are unrepresentable, so the renderer
 * must either substitute a real Unicode font or strip them — never emit a wrong
 * glyph. With a TTF configured, every name must survive intact.
 */

import { writeFileSync } from "node:fs"
import { renderQuotationPdf } from "@/lib/sales/quotation-pdf"
import { resolvePdfFont, toWinAnsi } from "@/lib/sales/pdf-font"

/** True when the built-in Helvetica can represent a character, i.e. it is WinAnsi. */
const isWinAnsi = (char: string) => toWinAnsi(char) === char

const args = process.argv.slice(2)
const out = args[0] || "out.pdf"
const rows = Number(args[1]) || 6
const intl = args.includes("--intl")

const NAMES = intl
  ? [
      "张伟",
      "محمد العلي",
      "สมชาย วงศ์ไทย",
      "Сталь Торг",
      "Łódź Spółka",
      "株式会社山田鋼鉄",
      "Nguyễn Văn A",
      "Çelik Ltd.",
    ]
  : [
      "Heavy-Duty Seamless Steel Pipe",
      "Industrial Grade Stainless Steel Flange",
      "Hydraulic Cylinder Assembly",
      "Centrifugal Pump Body",
      "Rubber V-Belt Drive Set",
      "Heavy Duty Gearbox",
      "Weld Neck Flange 1500 Class",
      "Carbon Steel Coil",
    ]

const font = resolvePdfFont()
console.log(`font         : ${font.unicode ? "unicode TTF" : "Helvetica (built-in)"}`)

const data = {
  quotationNo: intl ? "QT-20260927001" : "QT-20260927001",
  createdAt: new Date("2026-09-27T09:00:00Z"),
  validUntil: new Date("2026-10-27T09:00:00Z"),
  validityDays: 30,
  currency: "USD" as const,
  moq: intl ? "10 吨 / 吨" : "10 MT / 20 ft container",
  leadTime: intl ? "船运 25-30 天" : "25-30 days by sea",
  paymentTerms: intl ? "30% 定金，余款发货前付清" : "30% T/T deposit, balance before shipment",
  shippingTerms: intl ? "FOB 上海" : "FOB Shanghai, CIF on request",
  note: intl
    ? "价格以最终确认的数量和规格为准。任何规格或数量的变更都需要重新报价。/ 最终价格需经双方书面确认。"
    : "All prices are based on the specification listed above and are subject to final confirmation. Any change to specification, quantity or packaging will be requoted.",
  totalAmount: 0,
  items: Array.from({ length: rows }, (_, i) => {
    const unitPrice = 12.5 + i * 3.75
    const quantity = 100 + i * 25
    return {
      productName: NAMES[i % NAMES.length],
      specification: intl
        ? "材质：ASTM A105 / A240 · 标准：ASME B16.5 · 面：RF · 压力等级：1500 · 证书：EN 10204 3.1"
        : "Material: ASTM A105 / A240 · Standard: ASME B16.5 · Face: RF · Pressure class: 1500 · Certificate: EN 10204 3.1 mill test certificate supplied with each shipment, third party inspection by SGS available on request.",
      quantity,
      unit: intl ? "吨" : "pcs",
      unitPrice,
      amount: Math.round(quantity * unitPrice * 100) / 100,
    }
  }),
  inquiry: {
    inquiryNo: intl ? "RFQ-202609270001" : "RFQ-202609270001",
    customerName: intl ? "张伟 / محمد / สมชาย" : "Jane Whitfield",
    companyName: intl ? "全球钢铁贸易有限公司" : "Global Steel Trading Co., Ltd.",
    email: "buyer@example.com",
    phone: "+86 21 5555 1234",
    whatsapp: "+971 50 555 1234",
    country: intl ? "中国" : "United Arab Emirates",
    city: intl ? "上海" : "Dubai",
    address: intl ? "上海市浦东新区世纪大道 100 号 20 层" : "Sheikh Zayed Road, PO Box 12345",
  },
  supplier: {
    siteName: intl ? "东方金属供应" : "Oriental Metal Supply",
    companyName: intl ? "东方金属供应有限公司" : "Oriental Metal Supply Co., Ltd.",
    address: intl ? "中国上海市青浦区工业园区路 88 号" : "No. 88 Industrial Park Road, Qingpu, Shanghai, China",
    phone: "+86 21 5555 0000",
    email: "sales@example.com",
    website: "https://example.com",
  },
}

data.totalAmount = Number(data.items.reduce((s, i) => s + i.amount, 0).toFixed(2))
console.log(`total       : ${data.totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })} ${data.currency}`)

async function main() {
  const pdf = await renderQuotationPdf(data)
  writeFileSync(out, pdf)

  /*
   * Write the values the verifier must find, so it checks what this fixture
   * actually rendered instead of a hard-coded copy of an older one. For the
   * non-Latin fixture these are the names themselves: under a TTF they must come
   * through intact, which is the whole point of the --intl run.
   */
  const candidates: string[] = [data.moq, data.leadTime, data.paymentTerms, data.shippingTerms]
  if (intl) {
    candidates.push(data.inquiry.customerName, data.inquiry.companyName, data.items[0].productName)
  }

  /*
   * Split the values by what the configured font can actually draw. A value the
   * font covers must survive verbatim; one it does not cover is expected to come
   * out with `?` in place of the missing characters. Both are correct, but only
   * the second is acceptable if the operator picked a font without the coverage,
   * so the verifier is told which is which instead of guessing.
   */
  const drawable = (char: string) => {
    if (char === "\n" || char === "\t") return true
    if (!font.unicode) return isWinAnsi(char)
    return font.hasGlyph ? font.hasGlyph(char) : true
  }
  const fullyCovered = candidates.filter((v) => v && Array.from(v).every(drawable))
  // The exact substituted form is recorded, so the verifier compares against what
  // a correct renderer must produce rather than merely noticing something is off.
  const partiallyCovered = candidates
    .filter((v) => v && !Array.from(v).every(drawable))
    .map((source) => ({ source, expected: Array.from(source, (c) => (drawable(c) ? c : "?")).join("") }))

  writeFileSync(
    out.replace(/\.pdf$/i, ".json"),
    JSON.stringify(
      {
        supplier: data.supplier.siteName,
        customer: data.inquiry.companyName,
        supplierEmail: data.supplier.email,
        customerEmail: data.inquiry.email,
        values: fullyCovered,
        partialValues: partiallyCovered,
        intl,
        unicodeFont: font.unicode,
      },
      null,
      2
    )
  )
  if (partiallyCovered.length) {
    console.log(`partial     : ${partiallyCovered.length} value(s) exceed the font's glyph coverage`)
  }

  console.log(`bytes       : ${pdf.length}`)
  console.log(`wrote ${out}`)
}

main()
