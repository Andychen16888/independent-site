"use client"

import { useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import { Button } from "@/components/ui/Button"
import { CURRENCIES } from "@/lib/sales/currencies"
import { HONEYPOT_FIELD } from "@/lib/sales/honeypot"

/**
 * Units the RFQ form offers. Duplicated from the server-side
 * `SUPPORTED_UNITS` because that module imports the Prisma client, which is
 * server-only; the API re-validates the value, so a drift here can only
 * narrow the offered choices, never corrupt a stored record.
 */
const UNITS = ["pcs", "tons", "sets", "meters", "boxes", "units"] as const

/**
 * Mirrors the optional-field length limits in `inquiry-schema` (MAX.short and
 * MAX.medium). The server drops an over-length optional value instead of
 * rejecting the submission, so without these caps a long address or URL would
 * quietly disappear between the form and the inquiry record.
 */
const MAX_SHORT = 200
const MAX_ADDRESS = 500

/** Field name as the server keys it -> localized message to show. */
const FIELD_ERRORS = {
  customerName: "errRequired",
  email: "errEmail",
  companyName: "errRequired",
  country: "errRequired",
  productName: "errRequired",
  quantity: "errQuantity",
  unit: "errGeneric",
  targetPrice: "errGeneric",
  message: "errRequired",
} as const satisfies Record<string, string>

/**
 * The public request-for-quotation form.
 *
 * Prefilled with a product when the visitor came from a product page: the
 * server then snapshots the product itself, so the sales team sees a lead tied
 * to a catalogue record rather than a line of free text. The field stays
 * editable because buyers routinely ask about a variant the page did not show.
 */
export function RfqForm({
  productId,
  productName,
  locale: localeOverride,
  className = "",
}: {
  productId?: string
  productName?: string
  locale?: string
  className?: string
}) {
  const t = useTranslations("rfq")
  const activeLocale = useLocale()

  const [values, setValues] = useState({
    customerName: "",
    email: "",
    companyName: "",
    jobTitle: "",
    country: "",
    city: "",
    address: "",
    phone: "",
    whatsapp: "",
    website: "",
    linkedin: "",
    productName: productName ?? "",
    quantity: "",
    unit: "pcs",
    targetPrice: "",
    currency: "USD",
    application: "",
    message: "",
  })
  // Honeypot: hidden from humans, so anything typed here is a bot.
  const [trap, setTrap] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState("")
  const [loading, setLoading] = useState(false)
  const [inquiryNo, setInquiryNo] = useState("")

  const set = (key: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setValues((v) => ({ ...v, [key]: e.target.value }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})
    setFormError("")

    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          quantity: values.quantity === "" ? undefined : Number(values.quantity),
          targetPrice: values.targetPrice === "" ? undefined : Number(values.targetPrice),
          productId,
          locale: localeOverride ?? activeLocale,
          source: productId ? "PRODUCT_PAGE" : "WEBSITE_RFQ",
          [HONEYPOT_FIELD]: trap,
        }),
      })
      const json = await res.json().catch(() => ({}))

      if (!res.ok) {
        if (json.fields) setErrors(json.fields)
        setFormError(json.error || t("genericError"))
        return
      }
      setInquiryNo(json.inquiryNo ?? "")
    } catch {
      setFormError(t("genericError"))
    } finally {
      setLoading(false)
    }
  }

  if (inquiryNo) {
    return (
      <div className={`border border-mist bg-white p-8 md:p-10 text-center ${className}`}>
        <h2 className="heading-md mb-3">{t("successTitle")}</h2>
        <p className="text-body mb-2">{t("successBody")}</p>
        <p className="text-sm text-stone mb-6">
          {t("reference")}: <span className="font-medium text-charcoal">{inquiryNo}</span>
        </p>
        <p className="text-sm text-stone">{t("successHint")}</p>
      </div>
    )
  }

  const field = (key: keyof typeof values) => (errors[key] ? "border-rosegold" : "border-mist")

  /*
   * The server returns its validation problems keyed by field, with an English
   * message. Those messages are not translation keys, so map each field to a
   * fixed localized string instead of trying to translate the server text:
   * a field either rejected the value or it did not, and that distinction is
   * what the visitor needs.
   */
  const errText = (key: string) => {
    if (!errors[key]) return null
    const messageKey: "errRequired" | "errEmail" | "errQuantity" | "errGeneric" =
      FIELD_ERRORS[key as keyof typeof FIELD_ERRORS] ?? "errGeneric"
    return t(messageKey)
  }

  const labelCls = "block text-caption text-charcoal mb-1"
  const inputCls =
    "w-full border bg-white px-3 py-2.5 text-sm text-charcoal transition-colors focus:outline-none focus:border-charcoal"

  return (
    <form onSubmit={submit} className={`space-y-5 ${className}`} noValidate>
      {formError && (
        <div role="alert" className="border border-rosegold/40 bg-rosegold/5 px-4 py-3 text-sm text-rosegold">
          {formError}
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label className={labelCls} htmlFor="rfq-name">
            {t("name")} <span className="text-rosegold">*</span>
          </label>
          <input
            id="rfq-name"
            name="customerName"
            required
            value={values.customerName}
            onChange={set("customerName")}
            className={`${inputCls} ${field("customerName")}`}
            autoComplete="name"
          />
          {errText("customerName") && <p className="mt-1 text-xs text-rosegold">{errText("customerName")}</p>}
        </div>

        <div>
          <label className={labelCls} htmlFor="rfq-email">
            {t("email")} <span className="text-rosegold">*</span>
          </label>
          <input
            id="rfq-email"
            name="email"
            type="email"
            required
            value={values.email}
            onChange={set("email")}
            className={`${inputCls} ${field("email")}`}
            autoComplete="email"
          />
          {errText("email") && <p className="mt-1 text-xs text-rosegold">{errText("email")}</p>}
        </div>

        <div>
          <label className={labelCls} htmlFor="rfq-company">
            {t("company")} <span className="text-rosegold">*</span>
          </label>
          <input
            id="rfq-company"
            name="companyName"
            required
            value={values.companyName}
            onChange={set("companyName")}
            className={`${inputCls} ${field("companyName")}`}
            autoComplete="organization"
          />
          {errText("companyName") && <p className="mt-1 text-xs text-rosegold">{errText("companyName")}</p>}
        </div>

        <div>
          <label className={labelCls} htmlFor="rfq-job-title">
            {t("jobTitle")}
          </label>
          <input
            id="rfq-job-title"
            name="jobTitle"
            value={values.jobTitle}
            onChange={set("jobTitle")}
            maxLength={MAX_SHORT}
            className={inputCls}
            autoComplete="organization-title"
          />
        </div>

        <div>
          <label className={labelCls} htmlFor="rfq-country">
            {t("country")} <span className="text-rosegold">*</span>
          </label>
          <input
            id="rfq-country"
            name="country"
            required
            value={values.country}
            onChange={set("country")}
            className={`${inputCls} ${field("country")}`}
            autoComplete="country-name"
          />
          {errText("country") && <p className="mt-1 text-xs text-rosegold">{errText("country")}</p>}
        </div>

        <div>
          <label className={labelCls} htmlFor="rfq-city">
            {t("city")}
          </label>
          <input
            id="rfq-city"
            name="city"
            value={values.city}
            onChange={set("city")}
            maxLength={MAX_SHORT}
            className={inputCls}
            autoComplete="address-level2"
          />
        </div>

        <div className="md:col-span-2">
          <label className={labelCls} htmlFor="rfq-address">
            {t("address")}
          </label>
          <input
            id="rfq-address"
            name="address"
            value={values.address}
            onChange={set("address")}
            maxLength={MAX_ADDRESS}
            className={inputCls}
            autoComplete="street-address"
          />
        </div>

        <div>
          <label className={labelCls} htmlFor="rfq-phone">
            {t("phone")}
          </label>
          <input
            id="rfq-phone"
            name="phone"
            type="tel"
            value={values.phone}
            onChange={set("phone")}
            className={`${inputCls} ${field("phone")}`}
            autoComplete="tel"
          />
        </div>

        <div>
          <label className={labelCls} htmlFor="rfq-whatsapp">
            {t("whatsapp")}
          </label>
          <input
            id="rfq-whatsapp"
            name="whatsapp"
            type="tel"
            value={values.whatsapp}
            onChange={set("whatsapp")}
            className={`${inputCls} ${field("whatsapp")}`}
          />
        </div>

        <div>
          <label className={labelCls} htmlFor="rfq-website">
            {t("website")}
          </label>
          <input
            id="rfq-website"
            name="website"
            type="url"
            value={values.website}
            onChange={set("website")}
            maxLength={MAX_SHORT}
            className={inputCls}
            autoComplete="url"
          />
        </div>

        <div>
          <label className={labelCls} htmlFor="rfq-linkedin">
            {t("linkedin")}
          </label>
          <input
            id="rfq-linkedin"
            name="linkedin"
            type="url"
            value={values.linkedin}
            onChange={set("linkedin")}
            maxLength={MAX_SHORT}
            className={inputCls}
          />
        </div>
      </div>

      <div className="border-t border-mist pt-5">
        <label className={labelCls} htmlFor="rfq-product">
          {t("product")} <span className="text-rosegold">*</span>
        </label>
        <input
          id="rfq-product"
          name="productName"
          required
          value={values.productName}
          onChange={set("productName")}
          className={`${inputCls} ${field("productName")}`}
          placeholder={t("productPlaceholder")}
        />
        {errText("productName") && <p className="mt-1 text-xs text-rosegold">{errText("productName")}</p>}
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className={labelCls} htmlFor="rfq-quantity">
            {t("quantity")} <span className="text-rosegold">*</span>
          </label>
          <input
            id="rfq-quantity"
            name="quantity"
            required
            inputMode="decimal"
            value={values.quantity}
            onChange={set("quantity")}
            className={`${inputCls} ${field("quantity")}`}
          />
        </div>

        <div>
          <label className={labelCls} htmlFor="rfq-unit">
            {t("unit")}
          </label>
          <select
            id="rfq-unit"
            name="unit"
            value={values.unit}
            onChange={set("unit")}
            className={`${inputCls} ${field("unit")}`}
          >
            {UNITS.map((u) => (
              <option key={u} value={u}>
                {t(`unit_${u}`)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelCls} htmlFor="rfq-target">
            {t("targetPrice")}
          </label>
          <input
            id="rfq-target"
            name="targetPrice"
            inputMode="decimal"
            value={values.targetPrice}
            onChange={set("targetPrice")}
            className={`${inputCls} ${field("targetPrice")}`}
          />
        </div>

        <div>
          <label className={labelCls} htmlFor="rfq-currency">
            {t("currency")}
          </label>
          <select
            id="rfq-currency"
            name="currency"
            value={values.currency}
            onChange={set("currency")}
            className={inputCls}
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code}
              </option>
            ))}
          </select>
        </div>
      </div>
      {errText("quantity") && <p className="-mt-3 text-xs text-rosegold">{errText("quantity")}</p>}

      <div>
        <label className={labelCls} htmlFor="rfq-application">
          {t("application")}
        </label>
        <input
          id="rfq-application"
          name="application"
          value={values.application}
          onChange={set("application")}
          className={inputCls}
          placeholder={t("applicationPlaceholder")}
        />
      </div>

      <div>
        <label className={labelCls} htmlFor="rfq-message">
          {t("message")} <span className="text-rosegold">*</span>
        </label>
        <textarea
          id="rfq-message"
          name="message"
          required
          rows={6}
          value={values.message}
          onChange={set("message")}
          className={`${inputCls} ${field("message")}`}
          placeholder={t("messagePlaceholder")}
        />
        {errText("message") && <p className="mt-1 text-xs text-rosegold">{errText("message")}</p>}
      </div>

      {/* Honeypot. aria-hidden plus a negative tabindex so it is skipped by
          screen readers and keyboard users, and kept out of the layout. */}
      <div aria-hidden="true" className="absolute h-0 w-0 overflow-hidden opacity-0">
        <label htmlFor="rfq-company-url">Company URL</label>
        <input
          id="rfq-company-url"
          name={HONEYPOT_FIELD}
          tabIndex={-1}
          autoComplete="off"
          value={trap}
          onChange={(e) => setTrap(e.target.value)}
        />
      </div>

      <div className="flex flex-col items-start gap-4 pt-1 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-md text-xs leading-relaxed text-stone">{t("privacyNote")}</p>
        <Button type="submit" size="lg" loading={loading} loadingLabel={t("sending")} className="w-full sm:w-auto">
          {t("submit")}
        </Button>
      </div>
    </form>
  )
}
