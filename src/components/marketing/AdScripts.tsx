"use client"

import Script from "next/script"
import { usePathname } from "next/navigation"
import { useEffect } from "react"

export function FacebookPixel() {
  const pixelId = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID
  const pathname = usePathname()

  useEffect(() => {
    if (pixelId && typeof window !== "undefined" && (window as any).fbq) {
      ;(window as any).fbq("track", "PageView")
    }
  }, [pathname, pixelId])

  if (!pixelId) return null

  return (
    <>
      <Script id="fb-pixel" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${pixelId}');
          fbq('track', 'PageView');
        `}
      </Script>
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          alt=""
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
        />
      </noscript>
    </>
  )
}

export function GoogleAnalytics() {
  const gaId = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID
  if (!gaId) return null

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}');
        `}
      </Script>
    </>
  )
}

export function GoogleAds() {
  const adsId = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID
  if (!adsId) return null

  return (
    <Script id="google-ads" strategy="afterInteractive">
      {`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${adsId}');
      `}
    </Script>
  )
}

export function trackPurchase(value: number, currency: string = "USD") {
  const pixelId = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID
  const gaId = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID
  const adsId = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID

  if (pixelId && typeof window !== "undefined" && (window as any).fbq) {
    ;(window as any).fbq("track", "Purchase", { value, currency })
  }

  if (gaId && typeof window !== "undefined" && typeof (window as any).gtag === "function") {
    ;(window as any).gtag("event", "purchase", {
      transaction_id: `${Date.now()}`,
      value,
      currency,
      items: [],
    })
  }

  if (adsId && typeof window !== "undefined" && typeof (window as any).gtag === "function") {
    ;(window as any).gtag("event", "conversion", {
      send_to: `${adsId}/purchase`,
      value,
      currency,
    })
  }
}
