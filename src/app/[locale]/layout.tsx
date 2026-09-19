import { NextIntlClientProvider } from "next-intl"
import { setRequestLocale, getMessages } from "next-intl/server"
import { hasLocale } from "next-intl"
import { notFound } from "next/navigation"
import { routing, rtlLocales } from "@/i18n/routing"
import { LocaleHtmlSync } from "@/components/ui/LocaleHtmlSync"

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }
  setRequestLocale(locale)
  const messages = await getMessages()
  return (
    <NextIntlClientProvider locale={locale as (typeof routing.locales)[number]} messages={messages}>
      <LocaleHtmlSync locale={locale as (typeof routing.locales)[number]} dir={rtlLocales.has(locale) ? "rtl" : "ltr"} />
      {children}
    </NextIntlClientProvider>
  )
}