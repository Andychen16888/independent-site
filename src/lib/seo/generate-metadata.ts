import { Metadata } from "next"
import { SEOData } from "@/types"

const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "Oriental Beauty"
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://orientalbeauty.com"
const defaultDescription = "Discover the perfect blend of Eastern beauty rituals and artisanal craftsmanship. Premium peptide skincare and authentic oriental home decor."

export function generateMetadata(data: SEOData): Metadata {
  return {
    title: data.title ? `${data.title} | ${siteName}` : siteName,
    description: data.description || defaultDescription,
    keywords: data.keywords,
    openGraph: {
      title: data.title || siteName,
      description: data.description || defaultDescription,
      url: data.canonical || siteUrl,
      siteName,
      images: data.ogImage ? [{ url: data.ogImage }] : [],
      type: (data.ogType as any) || "website",
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: data.title || siteName,
      description: data.description || defaultDescription,
      images: data.ogImage ? [data.ogImage] : [],
    },
    alternates: {
      canonical: data.canonical,
    },
    robots: {
      index: true,
      follow: true,
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

export { siteName, siteUrl, defaultDescription }
