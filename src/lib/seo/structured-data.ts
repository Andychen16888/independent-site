import { siteUrl, siteName, defaultDescription } from "./generate-metadata"

export interface BreadcrumbItem {
  name: string
  url: string
}

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteName,
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    description: defaultDescription,
    sameAs: [
      "https://www.facebook.com/orientalbeauty",
      "https://www.pinterest.com/orientalbeauty",
      "https://www.instagram.com/orientalbeauty",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+1-888-555-0100",
      contactType: "customer service",
      email: "hello@orientalbeauty.com",
      availableLanguage: ["English"],
    },
    address: {
      "@type": "PostalAddress",
      addressCountry: "US",
    },
  }
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteName,
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  }
}

export function breadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${siteUrl}${item.url}`,
    })),
  }
}

export function productSchema(product: {
  name: string
  description: string
  sku: string
  brand?: string | null
  unitPrice: number
  originalPrice?: number | null
  currency?: string
  stock: number
  images?: { url: string; alt?: string | null }[]
  reviews?: { rating: number }[]
  url?: string
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    sku: product.sku,
    mpn: product.sku,
    brand: {
      "@type": "Brand",
      name: product.brand || siteName,
    },
    image: product.images?.map((i) => i.url.startsWith("http") ? i.url : `${siteUrl}${i.url}`) || [],
    offers: {
      "@type": "Offer",
      url: product.url || siteUrl,
      priceCurrency: product.currency || "USD",
      price: product.unitPrice.toString(),
      ...(product.originalPrice && Number(product.originalPrice) > Number(product.unitPrice)
        ? { highPrice: product.originalPrice.toString(), offerCount: "1" }
        : {}),
      availability: product.stock > 0
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: {
          "@type": "MonetaryAmount",
          value: "0",
          currency: product.currency || "USD",
        },
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: "US",
        },
      },
    },
    ...(product.reviews && product.reviews.length > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: (
          product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
        ).toFixed(1),
        reviewCount: product.reviews.length,
        bestRating: "5",
        worstRating: "1",
      },
    }),
  }
}

export function blogPostingSchema(post: {
  headline: string
  description: string
  author: string
  datePublished: string
  dateModified?: string
  image?: string | null
  url: string
}) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.headline,
    description: post.description,
    author: {
      "@type": "Person",
      name: post.author,
    },
    publisher: {
      "@type": "Organization",
      name: siteName,
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/logo.png`,
      },
    },
    datePublished: post.datePublished,
    dateModified: post.dateModified || post.datePublished,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": post.url,
    },
    ...(post.image && { image: post.image.startsWith("http") ? post.image : `${siteUrl}${post.image}` }),
  }
}

export function faqPageSchema(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  }
}

export function aboutPageSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "About Oriental Beauty",
    description: defaultDescription,
    mainEntity: {
      "@type": "Organization",
      name: siteName,
    },
  }
}

export function contactPageSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "Contact Oriental Beauty",
    description: "Get in touch with our customer service team",
    mainEntity: organizationSchema(),
  }
}

export function localBusinessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Store",
    name: siteName,
    url: siteUrl,
    description: defaultDescription,
    currencyAccepted: "USD",
    priceRange: "$$",
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: [
        "Monday", "Tuesday", "Wednesday", "Thursday", "Friday",
      ],
      opens: "09:00",
      closes: "18:00",
    },
  }
}
