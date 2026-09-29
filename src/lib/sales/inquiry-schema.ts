import { Currency, InquirySource } from "@prisma/client"

/**
 * Validation for enquiry submissions, shared by the public RFQ form and the
 * admin "add enquiry" form so both enforce the same rules.
 *
 * Hand-rolled rather than a schema library: the project has no Zod/Valibot
 * dependency, and the shape is small enough that a validator would be more
 * ceremony than it saves.
 */

export interface InquiryInput {
  customerName: string
  email: string
  companyName: string
  country: string
  message: string
  quantity?: number
  unit?: string
  productId?: string
  productName?: string
  city?: string
  address?: string
  whatsapp?: string
  phone?: string
  website?: string
  jobTitle?: string
  linkedin?: string
  application?: string
  targetPrice?: number
  currency?: Currency
  locale?: string
  source?: InquirySource
}

export type FieldErrors = Partial<Record<keyof InquiryInput, string>>

// Deliberately permissive: B2B buyers write real addresses from real domains,
// and a stricter pattern rejects valid ones for no security benefit. Length
// bounds are the actual protection.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const MAX = {
  short: 200,
  medium: 500,
  long: 5000,
} as const

/**
 * Currencies the offer flow accepts. Mirrors the `Currency` enum; anything not
 * listed falls back to USD rather than failing a real enquiry over a currency
 * the sales team can still price in.
 */
export const SUPPORTED_CURRENCIES: Currency[] = [
  "USD", "EUR", "GBP", "CAD", "AUD", "CNY", "JPY", "SGD", "AED", "INR",
  "CHF", "HKD", "KRW", "MXN", "THB", "VND", "IDR", "MYR", "PHP", "NZD",
  "SEK", "NOK", "DKK", "PLN", "TRY", "BRL", "ZAR", "RUB",
]

export const SUPPORTED_UNITS = ["pcs", "tons", "sets", "meters", "boxes", "units"] as const

/**
 * Sources a public form may claim. The public endpoint is untrusted input, so
 * `CAMPAIGN` and `AI_AGENT` are excluded there — otherwise anyone could file
 * attribution data that marketing reporting depends on. Staff may set any
 * source through the admin form.
 */
export const PUBLIC_INQUIRY_SOURCES: InquirySource[] = ["WEBSITE_RFQ", "PRODUCT_PAGE"]

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : ""
}

function num(value: unknown): number | undefined {
  if (value === "" || value === null || value === undefined) return undefined
  const n = typeof value === "number" ? value : Number(value)
  return Number.isFinite(n) ? n : undefined
}

/**
 * @param requireAll when true the public RFQ contract applies: name, email,
 * company, country, product, quantity and message are all mandatory.
 */
export function validateInquiryInput(
  raw: unknown,
  { requireAll = false, allowedSources }: { requireAll?: boolean; allowedSources?: InquirySource[] } = {}
): { data?: InquiryInput; errors: FieldErrors } {
  const errors: FieldErrors = {}
  if (typeof raw !== "object" || raw === null) {
    return { errors: { customerName: "Invalid request body" } }
  }
  const body = raw as Record<string, unknown>

  const customerName = str(body.customerName ?? body.name)
  const email = str(body.email).toLowerCase()
  const companyName = str(body.companyName)
  const country = str(body.country)
  const message = str(body.message ?? body.customerMessage)
  const quantity = num(body.quantity)
  const targetPrice = num(body.targetPrice)

  if (!customerName) errors.customerName = "Name is required"
  else if (customerName.length > MAX.short) errors.customerName = "Name is too long"

  if (!email) errors.email = "Email is required"
  else if (!EMAIL_RE.test(email)) errors.email = "Email is invalid"
  else if (email.length > MAX.short) errors.email = "Email is too long"

  if (!companyName) errors.companyName = "Company is required"
  else if (companyName.length > MAX.short) errors.companyName = "Company name is too long"

  if (!country) errors.country = "Country is required"
  else if (country.length > MAX.short) errors.country = "Country is too long"

  if (requireAll && !message) errors.message = "Message is required"
  if (message.length > MAX.long) errors.message = "Message is too long"

  // A product can be identified by id (from a product page) or by free text
  // (from the generic form). Require one, not both.
  const productId = str(body.productId) || undefined
  const productName = str(body.productName) || undefined
  if (requireAll && !productId && !productName) {
    errors.productName = "Product is required"
  }

  if (quantity === undefined) {
    if (requireAll) errors.quantity = "Quantity is required"
  } else if (quantity <= 0) {
    errors.quantity = "Quantity must be greater than 0"
  } else if (quantity > 100_000_000) {
    errors.quantity = "Quantity is out of range"
  } else if (Number(quantity.toFixed(3)) !== quantity) {
    /*
     * Tons are sold in fractions (12.5 t) and profiles in millimetres, so the
     * column is decimal. But a figure needing a fourth decimal place is a typo
     * rather than a real quantity, and the column would silently round it.
     */
    errors.quantity = "Quantity must be a positive number with up to 3 decimals"
  }

  if (targetPrice !== undefined && (targetPrice < 0 || targetPrice > 1_000_000_000)) {
    errors.targetPrice = "Target price is out of range"
  }

  const unit = str(body.unit) || undefined
  if (unit && !(SUPPORTED_UNITS as readonly string[]).includes(unit)) {
    errors.unit = `Unit must be one of: ${SUPPORTED_UNITS.join(", ")}`
  }

  const currencyRaw = str(body.currency).toUpperCase() as Currency
  const currency = SUPPORTED_CURRENCIES.includes(currencyRaw) ? currencyRaw : "USD"

  const sourceRaw = str(body.source).toUpperCase() as InquirySource
  const source: InquirySource = Object.values(InquirySource).includes(sourceRaw)
    ? sourceRaw
    : "WEBSITE_RFQ"
  if (allowedSources && !allowedSources.includes(source)) {
    errors.source = `Source must be one of: ${allowedSources.join(", ")}`
  }

  const long = (value: string, max: number) => (value.length > max ? undefined : value || undefined)

  if (Object.keys(errors).length > 0) return { errors }

  return {
    errors,
    data: {
      customerName,
      email,
      companyName,
      country,
      message,
      quantity,
      unit,
      productId,
      productName,
      city: long(str(body.city), MAX.short),
      address: long(str(body.address), MAX.medium),
      whatsapp: long(str(body.whatsapp), MAX.short),
      phone: long(str(body.phone), MAX.short),
      website: long(str(body.website), MAX.short),
      jobTitle: long(str(body.jobTitle), MAX.short),
      linkedin: long(str(body.linkedin), MAX.short),
      application: long(str(body.application), MAX.long),
      targetPrice,
      currency,
      locale: long(str(body.locale), 10),
      source,
    },
  }
}
