import { Currency, Prisma, QuotationStatus } from "@prisma/client"

export interface QuotationItemInput {
  productId?: string | null
  productName: string
  specification?: string | null
  quantity: number
  unit?: string | null
  unitPrice: number
}

export interface QuotationInput {
  status?: QuotationStatus
  currency?: Currency
  moq?: string | null
  leadTime?: string | null
  paymentTerms?: string | null
  shippingTerms?: string | null
  validityDays?: number
  note?: string | null
  items: QuotationItemInput[]
}

export type QuotationFieldErrors = Partial<
  Record<"items" | "validityDays" | "currency" | "status", string>
>

const MAX_ITEMS = 200
const MAX_NAME = 300

function str(value: unknown, max = MAX_NAME): string | null {
  if (value === null || value === undefined) return null
  const s = String(value).trim()
  if (!s) return null
  return s.slice(0, max)
}

function num(value: unknown): number | undefined {
  if (value === "" || value === null || value === undefined) return undefined
  const n = typeof value === "number" ? value : Number(value)
  return Number.isFinite(n) ? n : undefined
}

/**
 * Line amounts are rounded to two decimals at the line, not summed from raw
 * quantities: rounding the total alone lets a PDF's stated total disagree with
 * the visible line figures, which is exactly the discrepancy a buyer queries.
 */
/** Decimal columns are written as strings so no binary float error creeps in. */
export function decimalString(value: number): string {
  return value.toFixed(3)
}

export function lineAmount(quantity: number, unitPrice: number): number {
  return Math.round(quantity * unitPrice * 100) / 100
}

export function validateQuotationInput(
  raw: unknown
): { data?: QuotationInput; total?: number; errors: QuotationFieldErrors } {
  const errors: QuotationFieldErrors = {}
  if (typeof raw !== "object" || raw === null) {
    return { errors: { items: "Invalid request body" } }
  }
  const body = raw as Record<string, unknown>

  const rawItems = Array.isArray(body.items) ? body.items : []
  if (rawItems.length === 0) {
    errors.items = "At least one line item is required"
  }
  if (rawItems.length > MAX_ITEMS) {
    errors.items = `A quotation cannot have more than ${MAX_ITEMS} lines`
  }

  const items: QuotationItemInput[] = []
  for (const entry of rawItems) {
    if (typeof entry !== "object" || entry === null) continue
    const row = entry as Record<string, unknown>

    const productName = str(row.productName)
    const quantity = num(row.quantity)
    const unitPrice = num(row.unitPrice)

    if (!productName) {
      errors.items = "Every line needs a product name"
      break
    }
    if (quantity === undefined || quantity <= 0) {
      errors.items = `"${productName}": quantity must be greater than 0`
      break
    }
    if (unitPrice === undefined || unitPrice < 0) {
      errors.items = `"${productName}": unit price must be zero or more`
      break
    }

    items.push({
      productId: str(row.productId),
      productName,
      specification: str(row.specification, 2000),
      quantity,
      unit: str(row.unit, 20),
      unitPrice: Math.round(unitPrice * 100) / 100,
    })
  }

  let validityDays = 30
  const rawValidity = num(body.validityDays)
  if (rawValidity !== undefined) {
    if (rawValidity < 1 || rawValidity > 730) {
      errors.validityDays = "Validity must be between 1 and 730 days"
    } else {
      validityDays = Math.round(rawValidity)
    }
  }

  const currencyRaw = String(body.currency || "USD").toUpperCase() as Currency
  const currency = (Object.values(Currency) as string[]).includes(currencyRaw)
    ? currencyRaw
    : "USD"

  const statusRaw = String(body.status || "DRAFT").toUpperCase() as QuotationStatus
  const status = (Object.values(QuotationStatus) as string[]).includes(statusRaw)
    ? statusRaw
    : "DRAFT"

  if (Object.keys(errors).length > 0) return { errors }

  const total = Number(items.reduce((sum, i) => sum + lineAmount(i.quantity, i.unitPrice), 0).toFixed(2))

  return {
    errors,
    total,
    data: {
      status,
      currency,
      moq: str(body.moq),
      leadTime: str(body.leadTime),
      paymentTerms: str(body.paymentTerms, 500),
      shippingTerms: str(body.shippingTerms, 500),
      validityDays,
      note: str(body.note, 4000),
      items,
    },
  }
}

/** validUntil is derived from validityDays rather than sent by the client. */
export function computeValidUntil(validityDays: number, from: Date = new Date()): Date {
  const until = new Date(from)
  until.setDate(until.getDate() + validityDays)
  return until
}

export function buildQuotationCreate(
  input: QuotationInput,
  total: number,
  inquiryId: string,
  quotationNo: string,
  now: Date = new Date()
): Prisma.QuotationCreateInput {
  return {
    quotationNo,
    status: input.status ?? "DRAFT",
    currency: input.currency ?? "USD",
    moq: input.moq ?? null,
    leadTime: input.leadTime ?? null,
    paymentTerms: input.paymentTerms ?? null,
    shippingTerms: input.shippingTerms ?? null,
    validityDays: input.validityDays ?? 30,
    validUntil: computeValidUntil(input.validityDays ?? 30, now),
    note: input.note ?? null,
    totalAmount: total,
    sentAt: input.status === "SENT" ? now : null,
    inquiry: { connect: { id: inquiryId } },
    items: {
      create: input.items.map((item, sortOrder) => ({
        productId: item.productId ?? null,
        productName: item.productName,
        specification: item.specification ?? null,
        quantity: decimalString(item.quantity),
        unit: item.unit ?? null,
        unitPrice: item.unitPrice,
        amount: lineAmount(item.quantity, item.unitPrice),
        sortOrder,
      })),
    },
  }
}
