import { Metadata } from "next"
import { SEOData } from "@/types"
import { routing } from "@/i18n/routing"

export const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "Commodities From China"
export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://commoditychina.com"
export const defaultDescription = "Quality electronics, LED lighting, kitchenware, and everyday household commodities sourced directly from China for retail and wholesale B2B buyers worldwide."

export const ogLocaleMap: Record<string, string> = {
  en: "en_US",
  zh: "zh_CN",
  es: "es_ES",
  pt: "pt_BR",
  fr: "fr_FR",
  de: "de_DE",
  ru: "ru_RU",
  ar: "ar_SA",
}

/** Return an absolute URL for a given site path (or as-is if already absolute). */
export function absoluteUrl(path: string): string {
  if (!path) return siteUrl
  return path.startsWith("http") ? path : `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`
}

/** Prefix a site path with a locale segment (localePrefix: "always"). */
export function localizedPath(locale: string, path?: string): string {
  const p = path || "/"
  const clean = p.startsWith("/") ? p : `/${p}`
  return clean === "/" ? `/${locale}` : `/${locale}${clean}`
}

/** Build an absolute localized URL for a site path. */
export function localizedUrl(locale: string, path?: string): string {
  return `${siteUrl}${localizedPath(locale, path)}`
}

/** Absolute hreflang alternates (all locales + x-default) for a site path. */
export function buildHreflang(locale: string, path?: string): Record<string, string> {
  const languages: Record<string, string> = {}
  for (const loc of routing.locales) {
    languages[loc] = localizedUrl(loc, path)
  }
  languages["x-default"] = localizedUrl("en", path)
  return languages
}

export function generateMetadata(
  data: SEOData & { siteName?: string; siteDescription?: string; locale?: string } = { title: "", description: "" }
): Metadata {
  const name = data.siteName || siteName
  const locale = data.locale || "en"
  const title = data.title ? `${data.title} | ${name}` : name
  const description = data.description || data.siteDescription || defaultDescription
  const canonical = data.canonical ? localizedUrl(locale, data.canonical) : undefined
  const ogImage = data.ogImage
    ? [{ url: absoluteUrl(data.ogImage), width: 1200, height: 630, alt: title }]
    : [{ url: `${siteUrl}/og-default.jpg`, width: 1200, height: 630, alt: name }]

  return {
    title: data.title ? `${data.title} | ${name}` : name,
    description,
    keywords: data.keywords,
    metadataBase: new URL(siteUrl),
    alternates: {
      canonical,
      languages: canonical ? buildHreflang(locale, data.canonical) : buildHreflang(locale),
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: name,
      images: ogImage,
      type: (data.ogType === "article" ? "article" : "website") as "website" | "article",
      locale: ogLocaleMap[locale] || "en_US",
      ...(data.articlePublishedTime
        ? {
            type: "article" as const,
            article: {
              publishedTime: data.articlePublishedTime,
              ...(data.articleModifiedTime ? { modifiedTime: data.articleModifiedTime } : {}),
              ...(data.articleAuthors && data.articleAuthors.length
                ? { authors: data.articleAuthors }
                : {}),
              ...(data.articleTags && data.articleTags.length ? { tags: data.articleTags } : {}),
            },
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [absoluteUrl(data.ogImage || "/og-default.jpg")],
      site: process.env.NEXT_PUBLIC_TWITTER_HANDLE || "@commoditychina",
    },
    robots: {
      index: data.noindex !== true,
      follow: data.nofollow !== true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  }
}

export function generateProductSchema(product: any) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    sku: product.sku,
    brand: {
      "@type": "Brand",
      name: product.brand || siteName,
    },
    image: product.images?.map((i: any) => absoluteUrl(i.url)) || [],
    offers: {
      "@type": "Offer",
      price: product.unitPrice.toString(),
      priceCurrency: product.currency || "USD",
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
    ...(product.reviews?.length > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: (
          product.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) /
          product.reviews.length
        ).toFixed(1),
        reviewCount: product.reviews.length,
      },
    }),
  }
}

export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.url),
    })),
  }
}