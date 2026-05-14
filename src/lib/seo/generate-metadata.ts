import { Metadata } from "next"
import { SEOData } from "@/types"

export const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "Oriental Beauty"
export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://orientalbeauty.com"
export const defaultDescription = "Discover the perfect blend of Eastern beauty rituals and artisanal craftsmanship. Premium peptide skincare and authentic oriental home decor."

export function generateMetadata(data: SEOData): Metadata {
  const title = data.title ? `${data.title} | ${siteName}` : siteName
  const description = data.description || defaultDescription

  return {
    title: data.title ? `${data.title} | ${siteName}` : siteName,
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
      siteName,
      images: data.ogImage
        ? [{ url: data.ogImage, width: 1200, height: 630, alt: title }]
        : [{ url: "/og-default.jpg", width: 1200, height: 630, alt: siteName }],
      type: (data.ogType === "article" ? "article" : "website") as "website" | "article",
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: data.ogImage ? [data.ogImage] : [],
      site: "@orientalbeauty",
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
