import { Metadata } from "next"
import { SEOData } from "@/types"

export const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "Global Commerce"
export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://example.com"
export const defaultDescription = "Premium skincare and artisanal home decor brand blending Eastern beauty rituals with modern science."

export function generateMetadata(data: SEOData & { siteName?: string; siteDescription?: string } = { title: "", description: "" }): Metadata {
  const name = data.siteName || siteName
  const title = data.title ? `${data.title} | ${name}` : name
  const description = data.description || data.siteDescription || defaultDescription

  return {
    title: data.title ? `${data.title} | ${name}` : name,
    description,
    keywords: data.keywords,
    metadataBase: new URL(siteUrl),
    alternates: {
      canonical: data.canonical || siteUrl,
      languages: {
        "en-US": siteUrl,
      },
    },
    openGraph: {
      title,
      description,
      url: data.canonical || siteUrl,
      siteName: name,
      images: data.ogImage
        ? [{ url: data.ogImage, width: 1200, height: 630, alt: title }]
        : [{ url: "/og-default.jpg", width: 1200, height: 630, alt: name }],
      type: (data.ogType === "article" ? "article" : "website") as "website" | "article",
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: data.ogImage ? [data.ogImage] : [],
      site: process.env.NEXT_PUBLIC_TWITTER_HANDLE || "@orbrand",
    },
    robots: {
      index: data.noindex !== true,
      follow: data.nofollow !== true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
    other: {
      "geo.region": "US",
      "geo.placename": "United States",
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
    image: product.images?.map((i: any) => i.url) || [],
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
      item: item.url,
    })),
  }
}
