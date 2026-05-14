import type { Metadata, Viewport } from "next"
import { Inter, Cormorant_Garamond } from "next/font/google"
import { Providers } from "@/components/layout/Providers"
import { FacebookPixel, GoogleAnalytics, GoogleAds } from "@/components/marketing/AdScripts"
import { PromoBar } from "@/components/marketing/PromoBar"
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
    "peptide skincare",
    "oriental beauty",
    "handmade ceramics",
    "asian skincare",
    "artisanal home decor",
    "premium skincare",
    "eastern lifestyle",
  ],
  authors: [{ name: "Oriental Beauty" }],
  creator: "Oriental Beauty",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://orientalbeauty.com"),
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Oriental Beauty",
    title: "Oriental Beauty | Premium Skincare & Artisanal Living",
    description:
      "Discover the perfect blend of Eastern beauty rituals and artisanal craftsmanship.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Oriental Beauty | Premium Skincare & Artisanal Living",
    description:
      "Discover the perfect blend of Eastern beauty rituals and artisanal craftsmanship.",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#FFFFF0",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${cormorant.variable}`}>
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
