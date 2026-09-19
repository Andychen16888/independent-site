import { getRequestConfig } from "next-intl/server"
import { routing } from "./routing"

async function loadMessages(locale: string): Promise<Record<string, unknown>> {
  try {
    return (await import(`../../messages/${locale}.json`)).default as Record<string, unknown>
  } catch (error) {
    console.error(`[i18n] Failed to load messages for locale "${locale}", falling back to "${routing.defaultLocale}".`, error)
    return (await import(`../../messages/${routing.defaultLocale}.json`)).default as Record<string, unknown>
  }
}

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale

  if (!locale || !routing.locales.includes(locale as (typeof routing.locales)[number])) {
    locale = routing.defaultLocale
  }

  return {
    locale,
    messages: await loadMessages(locale),
  }
})