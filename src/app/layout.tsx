import type { Metadata, Viewport } from "next"
import { Inter, Cormorant_Garamond } from "next/font/google"
import { NextIntlClientProvider } from "next-intl"
import { getLocale } from "next-intl/server"
import { Providers } from "@/components/layout/Providers"
import { FacebookPixel, GoogleAnalytics, GoogleAds } from "@/components/marketing/AdScripts"
import {
  organizationSchema,
  websiteSchema,
  localBusinessSchema,
  brandSchema,
} from "@/lib/seo/structured-data"
import { getSiteSeo, getSettingsForKeys } from "@/lib/settings/settings"
import { routing, rtlLocales } from "@/i18n/routing"
import { ogLocaleMap } from "@/lib/seo/generate-metadata"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-serif",
  display: "swap",
})

function buildAlternates(baseUrl: string, locale: string, path = "/") {
  const languages: Record<string, string> = {}
  for (const loc of routing.locales) {
    languages[loc] = `${baseUrl}/${loc}${path === "/" ? "" : path}`
  }
  return {
    canonical: `${baseUrl}/${locale}${path === "/" ? "" : path}`,
    languages: {
      ...languages,
      "x-default": `${baseUrl}/en${path === "/" ? "" : path}`,
    },
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSiteSeo()
  const locale = await getLocale()
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://commoditychina.com"
  const ogImage = seo.logo && /^https?:\/\//.test(seo.logo)
    ? { url: seo.logo, width: 1200, height: 630, alt: seo.siteName }
    : { url: "/og-default.jpg", width: 1200, height: 630, alt: seo.siteName }
  const keywords = (seo.defaultKeywords || "").split(",").map((k) => k.trim()).filter(Boolean)

  return {
    title: {
      default: seo.homepageTitle,
      template: `%s | ${seo.siteName}`,
    },
    description: seo.siteDescription,
    keywords,
    authors: [{ name: seo.siteName }],
    creator: seo.siteName,
    publisher: seo.siteName,
    metadataBase: new URL(baseUrl),
    alternates: buildAlternates(baseUrl, locale),
    openGraph: {
      type: "website",
      locale: ogLocaleMap[locale] || "en_US",
      siteName: seo.siteName,
      title: seo.homepageTitle,
      description: seo.homepageDescription,
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      site: process.env.NEXT_PUBLIC_TWITTER_HANDLE || undefined,
      title: seo.homepageTitle,
      description: seo.homepageDescription,
      images: [ogImage.url],
    },
    robots: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
      yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION,
      yahoo: process.env.NEXT_PUBLIC_BING_VERIFICATION,
    },
    category: "ecommerce",
    classification: "E-commerce",
  }
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#FFFFF0",
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [seo, locale, contactSettings] = await Promise.all([
    getSiteSeo(),
    getLocale(),
    getSettingsForKeys(["company.address"]),
  ])
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://commoditychina.com"
  const dir = rtlLocales.has(locale) ? "rtl" : "ltr"
  const servedMarkets =
    process.env.NEXT_PUBLIC_SERVED_MARKETS?.split(",").map((s) => s.trim()).filter(Boolean) || [
      "Southeast Asia",
      "Africa",
      "Middle East",
    ]
  const countryCode = process.env.NEXT_PUBLIC_BUSINESS_COUNTRY_CODE || "CN"
  const socialLinks = [
    seo.social.facebook,
    seo.social.instagram,
    seo.social.linkedin,
    seo.social.youtube,
    seo.social.twitter,
  ].filter(Boolean)

  const jsonLd = [
    organizationSchema({
      name: seo.siteName,
      url: baseUrl,
      description: seo.siteDescription,
      logo: seo.logo || undefined,
      sameAs: socialLinks,
      email: seo.contactEmail || undefined,
      phone: seo.contactPhone || undefined,
    }),
    websiteSchema({ name: seo.siteName, url: baseUrl }),
    localBusinessSchema({
      name: seo.siteName,
      url: baseUrl,
      description: seo.siteDescription,
      address: contactSettings["company.address"] || undefined,
      countryCode,
      areaServed: servedMarkets,
    }),
    brandSchema({
      name: seo.siteName,
      description: seo.siteDescription,
      url: baseUrl,
      logo: seo.logo || undefined,
      sameAs: socialLinks,
    }),
  ]

  const favicon = seo.favicon && /^https?:\/\//.test(seo.favicon) ? seo.favicon : undefined

  return (
    <html lang={locale} dir={dir} className={`${inter.variable} ${cormorant.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {favicon && <link rel="icon" href={favicon} />}
        <meta name="format-detection" content="telephone=no, address=no, email=no" />
        <meta name="google-site-verification" content={process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || ""} />
        <meta name="msvalidate.01" content={process.env.NEXT_PUBLIC_BING_VERIFICATION || ""} />
        <meta name="application-name" content={seo.siteName} />
        <meta name="apple-mobile-web-app-title" content={seo.siteName} />
        <meta name="generator" content="Next.js" />
        <meta name="robots" content="max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <FacebookPixel />
      <GoogleAnalytics />
      <GoogleAds />
      <body className="min-h-screen bg-ivory text-charcoal antialiased">
        <NextIntlClientProvider>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
