/**
 * Currencies the quotation form offers.
 *
 * Duplicated from the Prisma `Currency` enum rather than imported from it, because
 * this list reaches client components and the generated client is server-only. The
 * API re-validates against the real enum, so a value that drifts out of sync here
 * is rejected on submit rather than written — the duplication can only narrow the
 * choices offered, never corrupt a stored record.
 */
export const CURRENCIES = [
  { code: "USD", label: "USD — US Dollar", symbol: "$" },
  { code: "EUR", label: "EUR — Euro", symbol: "€" },
  { code: "GBP", label: "GBP — Pound Sterling", symbol: "£" },
  { code: "CAD", label: "CAD — Canadian Dollar", symbol: "C$" },
  { code: "AUD", label: "AUD — Australian Dollar", symbol: "A$" },
  { code: "CNY", label: "CNY — Chinese Yuan", symbol: "¥" },
  { code: "JPY", label: "JPY — Japanese Yen", symbol: "¥" },
  { code: "SGD", label: "SGD — Singapore Dollar", symbol: "S$" },
  { code: "AED", label: "AED — UAE Dirham", symbol: "د.إ" },
  { code: "INR", label: "INR — Indian Rupee", symbol: "₹" },
  { code: "CHF", label: "CHF — Swiss Franc", symbol: "CHF" },
  { code: "HKD", label: "HKD — Hong Kong Dollar", symbol: "HK$" },
  { code: "KRW", label: "KRW — Korean Won", symbol: "₩" },
  { code: "MXN", label: "MXN — Mexican Peso", symbol: "MX$" },
  { code: "THB", label: "THB — Thai Baht", symbol: "฿" },
  { code: "VND", label: "VND — Vietnamese Dong", symbol: "₫" },
  { code: "IDR", label: "IDR — Indonesian Rupiah", symbol: "Rp" },
  { code: "MYR", label: "MYR — Malaysian Ringgit", symbol: "RM" },
  { code: "PHP", label: "PHP — Philippine Peso", symbol: "₱" },
  { code: "NZD", label: "NZD — New Zealand Dollar", symbol: "NZ$" },
  { code: "SEK", label: "SEK — Swedish Krona", symbol: "kr" },
  { code: "NOK", label: "NOK — Norwegian Krone", symbol: "kr" },
  { code: "DKK", label: "DKK — Danish Krone", symbol: "kr" },
  { code: "PLN", label: "PLN — Polish Zloty", symbol: "zł" },
  { code: "TRY", label: "TRY — Turkish Lira", symbol: "₺" },
  { code: "BRL", label: "BRL — Brazilian Real", symbol: "R$" },
  { code: "ZAR", label: "ZAR — South African Rand", symbol: "R" },
  { code: "RUB", label: "RUB — Russian Ruble", symbol: "₽" },
] as const

export type CurrencyCode = (typeof CURRENCIES)[number]["code"]

/** Formats an amount with the currency, falling back to `CODE 12.34`. */
export function formatMoney(amount: number | null | undefined, currency: string): string {
  if (amount == null) return "—"
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(amount)
  } catch {
    // An unknown or legacy code must not blank the whole table cell.
    return `${amount.toFixed(2)} ${currency}`
  }
}
