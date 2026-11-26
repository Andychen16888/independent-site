import { APP_LOCALES, type AppLocale } from "@/lib/i18n/locales"

type FooterMessages = {
  footer?: {
    companyBrief?: string
    addressLine?: string
  }
}

export type FooterDefaults = Record<AppLocale, { brief: string; address: string }>

export async function loadFooterDefaults(): Promise<FooterDefaults> {
  const entries = await Promise.all(
    APP_LOCALES.map(async (locale) => {
      const messages = (await import(`../../../messages/${locale}.json`)).default as FooterMessages
      return [
        locale,
        {
          brief: messages.footer?.companyBrief || "",
          address: messages.footer?.addressLine || "",
        },
      ] as const
    })
  )
  return Object.fromEntries(entries) as FooterDefaults
}
