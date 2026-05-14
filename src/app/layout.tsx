import type { Metadata, Viewport } from "next"
import { Inter, Cormorant_Garamond } from "next/font/google"
import { Providers } from "@/components/layout/Providers"
import { FacebookPixel, GoogleAnalytics, GoogleAds } from "@/components/marketing/AdScripts"
import { PromoBar } from "@/components/marketing/PromoBar"
import { organizationSchema, websiteSchema, localBusinessSchema } from "@/lib/seo/structured-data"
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

export const metadata: Metadata = {
  title: {
    default: "Oriental Beauty | Premium Skincare & Artisanal Living",
    template: "%s | Oriental Beauty",
  },
  description:
    "Discover the perfect blend of Eastern beauty rituals and artisanal craftsmanship. Premium peptide skincare and authentic oriental home decor.",
  keywords: [
    "peptide skincare", "oriental beauty", "handmade ceramics", "asian skincare",
    "artisanal home decor", "premium skincare", "eastern lifestyle",
    "anti-aging serum", "korean skincare", "japanese ceramics",
    "natural skincare", "luxury beauty", "organic skincare",
  ],
  authors: [{ name: "Oriental Beauty" }],
  creator: "Oriental Beauty",
  publisher: "Oriental Beauty",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://orientalbeauty.com"),
  alternates: {
    canonical: "/",
    languages: { "en-US": "/" },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Oriental Beauty",
    title: "Oriental Beauty | Premium Skincare & Artisanal Living",
    description:
      "Discover the perfect blend of Eastern beauty rituals and artisanal craftsmanship.",
    images: [{ url: "/og-default.jpg", width: 1200, height: 630, alt: "Oriental Beauty" }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@orientalbeauty",
    creator: "@orientalbeauty",
    title: "Oriental Beauty | Premium Skincare & Artisanal Living",
    description:
      "Discover the perfect blend of Eastern beauty rituals and artisanal craftsmanship.",
    images: ["/og-default.jpg"],
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
  category: "beauty",
  classification: "E-commerce",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#FFFFF0",
}

const jsonLd = [
  organizationSchema(),
  websiteSchema(),
  localBusinessSchema(),
]

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${cormorant.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="format-detection" content="telephone=no, address=no, email=no" />
        <meta name="google-site-verification" content={process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || ""} />
        <meta name="msvalidate.01" content={process.env.NEXT_PUBLIC_BING_VERIFICATION || ""} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <FacebookPixel />
      <GoogleAnalytics />
      <GoogleAds />
      <body className="min-h-screen bg-ivory text-charcoal antialiased">
        <PromoBar />
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
