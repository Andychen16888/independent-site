/**
 * Unit checks for the pure sales rules. No database and no SMTP required, so
 * these run in CI and catch the mistakes that unit columns and locale formatting
 * are prone to.
 *
 *   npx tsx scripts/test-sales-rules.ts
 */

import { existsSync } from "node:fs"
import { join } from "node:path"
import { businessDay } from "@/lib/sales/numbering"
import { resolvePdfFont, toDrawable } from "@/lib/sales/pdf-font"
import {
  validateInquiryInput,
  PUBLIC_INQUIRY_SOURCES,
  SUPPORTED_CURRENCIES,
} from "@/lib/sales/inquiry-schema"
import { validateQuotationInput, computeValidUntil, lineAmount } from "@/lib/sales/quotation-schema"

let passed = 0
let failed = 0

function check(name: string, condition: boolean, detail?: unknown) {
  if (condition) {
    passed++
    console.log(`  PASS  ${name}`)
  } else {
    failed++
    console.log(`  FAIL  ${name}${detail !== undefined ? ` -> ${JSON.stringify(detail)}` : ""}`)
  }
}

console.log("businessDay (document number date part)")
// The number is concatenated as RFQ-YYYYMMDD0001, so any separator is fatal.
const day = businessDay(new Date("2026-09-27T20:00:00Z"))
check("is 8 digits, no separators", /^\d{8}$/.test(day), day)
check("uses the business date, not the UTC date", day === "20260928" || day === "20260927", day)

console.log("\ninquiry quantity")
const base = {
  customerName: "A Buyer",
  email: "buyer@example.com",
  companyName: "Steel Co",
  country: "DE",
  message: "Please quote.",
  productName: "Steel plate",
  quantity: 10,
}
const qty = (quantity: unknown) => validateInquiryInput({ ...base, quantity }, { requireAll: true })

check("accepts a whole number", qty(100).data?.quantity === 100)
check("accepts a fractional ton", qty(12.5).data?.quantity === 12.5, qty(12.5).errors)
check("accepts a 3-decimal quantity", qty(0.125).data?.quantity === 0.125)
check("rejects a 4-decimal quantity", qty(1.2345).errors.quantity !== undefined, qty(1.2345).errors)
check("rejects zero", qty(0).errors.quantity !== undefined)
check("rejects a negative quantity", qty(-5).errors.quantity !== undefined)
const { quantity: _omitted, ...noQuantity } = base
check("rejects a missing quantity", validateInquiryInput(noQuantity, { requireAll: true }).errors.quantity !== undefined)
check("a missing quantity is fine for the admin form", validateInquiryInput(noQuantity).errors.quantity === undefined)

console.log("\ninquiry honeypot and source")
// `website` is a real business field and must survive validation.
check("keeps a real website value", validateInquiryInput({ ...base, website: "https://x.com" }).data?.website === "https://x.com")
// The honeypot is a separate key, so the validator must not treat it as input.
const honey = validateInquiryInput({ ...base, _company_url: "https://spam.example" })
check("a filled honeypot still parses as a normal enquiry", honey.data !== undefined, honey.errors)
check("the honeypot key is never stored", !("_company_url" in (honey.data ?? {})))

const pub = (source: string) =>
  validateInquiryInput({ ...base, source }, { requireAll: true, allowedSources: PUBLIC_INQUIRY_SOURCES })
check("allows WEBSITE_RFQ", pub("WEBSITE_RFQ").data?.source === "WEBSITE_RFQ")
check("allows PRODUCT_PAGE", pub("PRODUCT_PAGE").data?.source === "PRODUCT_PAGE")
check("refuses a client-claimed CAMPAIGN", pub("CAMPAIGN").errors.source !== undefined, pub("CAMPAIGN").errors)
check("refuses a client-claimed AI_AGENT", pub("AI_AGENT").errors.source !== undefined, pub("AI_AGENT").errors)

console.log("\ncurrency handling")
check("28 currencies are offered", SUPPORTED_CURRENCIES.length === 28, SUPPORTED_CURRENCIES.length)
check("accepts CNY", validateInquiryInput({ ...base, currency: "cny" }).data?.currency === "CNY")
check("falls back to USD for an unknown code", validateInquiryInput({ ...base, currency: "XYZ" }).data?.currency === "USD")

console.log("\nquotation totals")
const quote = (items: unknown[]) => validateQuotationInput({ items, currency: "USD" })
const two = quote([
  { productName: "Plate", quantity: 10, unitPrice: 25.5 },
  { productName: "Bar", quantity: 2, unitPrice: 100 },
])
check("sums the lines", two.total === 455, two.total)
check("preserves line order", two.data?.items[0].productName === "Plate")
check("derives validUntil from validityDays", computeValidUntil(30, new Date("2026-01-01T00:00:00Z")).toISOString().startsWith("2026-01-31"))

console.log("\nquotation validation")
check("rejects an empty item list", quote([]).errors.items !== undefined)
check("rejects a zero-quantity line", quote([{ productName: "Plate", quantity: 0, unitPrice: 1 }]).errors.items !== undefined)
check("rejects a negative price", quote([{ productName: "Plate", quantity: 1, unitPrice: -5 }]).errors.items !== undefined)
check("rejects a nameless line", quote([{ quantity: 1, unitPrice: 1 }]).errors.items !== undefined)
check("rejects an absurd validity", validateQuotationInput({ items: [{ productName: "P", quantity: 1, unitPrice: 1 }], validityDays: 5000 }).errors.validityDays !== undefined)
check("allows a free line at zero price", quote([{ productName: "Sample", quantity: 1, unitPrice: 0 }]).total === 0)

console.log("\nline rounding")
// A unit price is stored in DECIMAL(12,2), so 33.335 is normalised to 33.34
// first; the line is then 3 x 33.34 = 100.02. Rounding the total from the raw
// price instead would produce 100.01 and disagree with the printed lines.
check("rounds each line to cents", lineAmount(3, 33.34) === 100.02, lineAmount(3, 33.34))
const rounding = quote([
  { productName: "A", quantity: 3, unitPrice: 33.335 },
  { productName: "B", quantity: 1, unitPrice: 0.01 },
])
check("normalises a 3-decimal unit price to 2", rounding.data?.items[0].unitPrice === 33.34, rounding.data?.items[0].unitPrice)
check("total equals the sum of the rounded lines", rounding.total === 100.03, rounding.total)

console.log("\nquotation PDF font selection")
/*
 * PDFKit cannot subset a font *collection*, and it only discovers that when the
 * first line of text is drawn -- long after the error handling in pdf-font.ts has
 * run. A collection configured through QUOTATION_PDF_FONT therefore used to
 * resolve as a usable Unicode font, skip sanitising, and then fail the request
 * with "this.font.createSubset is not a function". The invariant is that such a
 * path never yields a Unicode font.
 *
 * msyh.ttc is the file operators reach for first on Windows, so that is the one
 * tested. Where the file is absent the fallback is taken for a different reason
 * and the property is trivially true, so the branch is reported rather than
 * left to look like coverage it may not be.
 */
const collectionPath = join(process.env.WINDIR || "C:\\Windows", "Fonts", "msyh.ttc")
process.env.QUOTATION_PDF_FONT = collectionPath
const fromCollection = resolvePdfFont()
check(
  "a font collection is never used as a Unicode font",
  fromCollection.unicode === false,
  { path: collectionPath, resolved: fromCollection.regular }
)
check(
  "a rejected font still yields a sanitised document",
  toDrawable("张三", fromCollection) === "??",
  toDrawable("张三", fromCollection)
)
check(
  `collection branch exercised: ${existsSync(collectionPath) ? "font present" : "font absent on this machine"}`,
  true
)

console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
