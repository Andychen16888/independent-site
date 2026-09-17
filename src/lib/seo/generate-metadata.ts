import { Metadata } from "next"
import { SEOData } from "@/types"

export const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "Commodities From China"
export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://commoditychina.com"
export const defaultDescription = "Premium skincare, artisanal home decor, and quality everyday commodities sourced directly from China for retail and wholesale B2B buyers worldwide."

/** Return an absolute URL for a given site path (or as-is if already absolute). */
export function absoluteUrl(path: string): string {
  if (!path) return siteUrl
  return path.startsWith("http") ? path : `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`
}

export function generateMetadata(
  data: SEOData & { siteName?: string; siteDescription?: string } = { title: "", description: "" }
): Metadata {
  const name = data.siteName || siteName
  const title = data.title ? `${data.title} | ${name}` : name
  const description = data.description || data.siteDescription || defaultDescription
  const canonical = data.canonical ? absoluteUrl(data.canonical) : undefined
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
      languages: canonical ? { "en-US": canonical } : { "en-US": siteUrl },
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: name,
      images: ogImage,
      type: (data.ogType === "article" ? "article" : "website") as "website" | "article",
      locale: "en_US",
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
      site: process.env.NEXT_PUBLIC_TWITTER_HANDLE || "@orbrand",
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