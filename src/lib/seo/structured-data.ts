import { siteUrl, siteName, defaultDescription } from "./generate-metadata"

export interface BreadcrumbItem {
  name: string
  url: string
}

export function organizationSchema(
  data?: {
    name?: string
    url?: string
    description?: string
    logo?: string
    sameAs?: string[]
    email?: string
    phone?: string
  }
) {
  const name = data?.name || siteName
  const url = data?.url || siteUrl
  const description = data?.description || defaultDescription
  const sameAs = data?.sameAs
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name,
    url,
    logo: data?.logo || `${siteUrl}/logo.png`,
    description,
    ...(sameAs && sameAs.length > 0 ? { sameAs } : { sameAs: [] }),
    ...(data?.email || data?.phone
      ? {
          contactPoint: {
            "@type": "ContactPoint",
            ...(data?.phone ? { telephone: data.phone } : {}),
            contactType: "customer service",
            ...(data?.email ? { email: data.email } : {}),
          },
        }
      : {}),
  }
}

export function websiteSchema(data?: { name?: string; url?: string }) {
  const name = data?.name || siteName
  const url = data?.url || siteUrl
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name,
    url,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${url}/search?q={search_term_string}`,
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
  unitPrice: number | null
  originalPrice?: number | null
  currency?: string
  stock: number
  images?: { url: string; alt?: string | null }[]
  reviews?: { rating: number }[]
  url?: string
}) {
  const hasPrice = product.unitPrice != null
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
    ...(hasPrice && {
      offers: {
        "@type": "Offer",
        url: product.url || siteUrl,
        priceCurrency: product.currency || "USD",
        price: product.unitPrice!.toString(),
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
    }),
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

export function aboutPageSchema(data?: { name?: string; description?: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: data?.name || `About ${siteName}`,
    description: data?.description || defaultDescription,
    mainEntity: {
      "@type": "Organization",
      name: siteName,
    },
  }
}

export function contactPageSchema(data?: { name?: string; description?: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: data?.name || `Contact ${siteName}`,
    description: data?.description || "Get in touch with our customer service team",
    mainEntity: organizationSchema(),
  }
}

export function localBusinessSchema(
  data?: {
    name?: string
    url?: string
    description?: string
    currency?: string
    priceRange?: string
    address?: string
    countryCode?: string
    areaServed?: string[]
    openingHours?: {
      days?: string[]
      opens?: string
      closes?: string
    }
  }
) {
  const hours = data?.openingHours || {}
  return {
    "@context": "https://schema.org",
    "@type": "Store",
    name: data?.name || siteName,
    url: data?.url || siteUrl,
    description: data?.description || defaultDescription,
    ...(data?.address
      ? {
          address: {
            "@type": "PostalAddress",
            streetAddress: data.address,
            addressCountry: data.countryCode || "CN",
          },
        }
      : {}),
    ...(data?.areaServed && data.areaServed.length > 0
      ? {
          areaServed: data.areaServed.map((region) => ({
            "@type": "Country",
            name: region,
          })),
        }
      : {}),
    currencyAccepted: data?.currency || "USD",
    priceRange: data?.priceRange || "$$",
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: hours.days || [
        "Monday", "Tuesday", "Wednesday", "Thursday", "Friday",
      ],
      opens: hours.opens || "09:00",
      closes: hours.closes || "18:00",
    },
  }
}

export function howToSchema(params: {
  name: string
  description: string
  image?: string
  totalTime?: string
  estimatedCost?: string
  steps: { text: string; image?: string; duration?: string }[]
}) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: params.name,
    description: params.description,
    ...(params.image && { image: { "@type": "ImageObject", url: params.image } }),
    ...(params.totalTime && { totalTime: params.totalTime }),
    ...(params.estimatedCost && {
      estimatedCost: { "@type": "MonetaryAmount", currency: "USD", value: params.estimatedCost },
    }),
    step: params.steps.map((step, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: step.text.split(".")[0],
      text: step.text,
      ...(step.image && { image: { "@type": "ImageObject", url: step.image } }),
      ...(step.duration && { duration: step.duration }),
    })),
  }
}

export function videoObjectSchema(video: {
  name: string
  description: string
  contentUrl: string
  uploadDate: string
  thumbnailUrl?: string
  duration?: string
}) {
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: video.name,
    description: video.description,
    contentUrl: video.contentUrl,
    uploadDate: video.uploadDate,
    ...(video.thumbnailUrl && { thumbnailUrl: video.thumbnailUrl }),
    ...(video.duration && { duration: video.duration }),
  }
}

export function personSchema(person: {
  name: string
  description?: string
  image?: string
  jobTitle?: string
  sameAs?: string[]
  knowsAbout?: string[]
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: person.name,
    ...(person.description && { description: person.description }),
    ...(person.image && { image: person.image }),
    ...(person.jobTitle && { jobTitle: person.jobTitle }),
    ...(person.sameAs && { sameAs: person.sameAs }),
    ...(person.knowsAbout && { knowsAbout: person.knowsAbout }),
  }
}

export function articleSchema(article: {
  headline: string
  description: string
  author: { name: string; url?: string }
  datePublished: string
  dateModified?: string
  image?: string | null
  url: string
  articleSection?: string
  keywords?: string
  speakable?: { cssSelector: string[] }
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.headline,
    description: article.description,
    author: {
      "@type": "Person",
      name: article.author.name,
      ...(article.author.url && { url: article.author.url }),
    },
    publisher: {
      "@type": "Organization",
      name: siteName,
      logo: { "@type": "ImageObject", url: `${siteUrl}/logo.png` },
    },
    datePublished: article.datePublished,
    dateModified: article.dateModified || article.datePublished,
    mainEntityOfPage: { "@type": "WebPage", "@id": article.url },
    ...(article.image && { image: article.image }),
    ...(article.articleSection && { articleSection: article.articleSection }),
    ...(article.keywords && { keywords: article.keywords }),
    ...(article.speakable && {
      speakable: {
        "@type": "SpeakableSpecification",
        cssSelector: article.speakable.cssSelector,
      },
    }),
  }
}

export function qaPageSchema(qa: {
  question: string
  answer: string
  author?: string
  dateCreated?: string
}) {
  return {
    "@context": "https://schema.org",
    "@type": "QAPage",
    mainEntity: {
      "@type": "Question",
      name: qa.question,
      text: qa.question,
      answerCount: 1,
      ...(qa.author && { author: { "@type": "Person", name: qa.author } }),
      ...(qa.dateCreated && { dateCreated: qa.dateCreated }),
      acceptedAnswer: {
        "@type": "Answer",
        text: qa.answer,
        ...(qa.author && { author: { "@type": "Person", name: qa.author } }),
      },
    },
  }
}

export function productComparisonSchema(products: {
  name: string
  image?: string
  description: string
  price: string
  sku?: string
  url?: string
  rating?: string
  reviewCount?: number
}[], comparisonHeadline: string) {
  return {
    "@context": "https://schema.org",
    "@type": "ProductGroup",
    name: comparisonHeadline,
    description: `Compare ${products.length} products from ${siteName}`,
    variesBy: ["https://schema.org/sku", "https://schema.org/price"],
    productGroupID: "compare-" + Date.now(),
    hasVariant: products.map((p) => ({
      "@type": "Product",
      name: p.name,
      description: p.description,
      ...(p.image && { image: p.image }),
      ...(p.sku && { sku: p.sku }),
      offers: {
        "@type": "Offer",
        price: p.price,
        priceCurrency: "USD",
        ...(p.url && { url: p.url }),
      },
      ...(p.rating && {
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: p.rating,
          reviewCount: p.reviewCount || 0,
        },
      }),
    })),
  }
}

export function productGroupSchema(category: {
  name: string
  description: string
  url: string
  image?: string
  products: {
    name: string
    url: string
    price: number | null
    image?: string
    sku?: string
    rating?: number
    reviewCount?: number
  }[]
}) {
  return {
    "@context": "https://schema.org",
    "@type": "ProductGroup",
    name: category.name,
    description: category.description,
    url: category.url,
    ...(category.image && { image: category.image }),
    productGroupID: category.url,
    variesBy: ["https://schema.org/sku", "https://schema.org/price"],
    hasVariant: category.products.map((p) => ({
      "@type": "Product",
      name: p.name,
      url: p.url,
      sku: p.sku || p.name.toLowerCase().replace(/\s+/g, "-"),
      ...(p.price != null && {
        offers: {
          "@type": "Offer",
          price: p.price,
          priceCurrency: "USD",
          url: p.url,
        },
      }),
      ...(p.image && { image: p.image }),
      ...(p.rating && {
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: p.rating,
          reviewCount: p.reviewCount || 0,
        },
      }),
    })),
  }
}

export function brandSchema(brand: {
  name: string
  description: string
  url?: string
  logo?: string
  sameAs?: string[]
  knowsAbout?: string[]
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Brand",
    name: brand.name,
    description: brand.description,
    ...(brand.url && { url: brand.url }),
    ...(brand.logo && { logo: { "@type": "ImageObject", url: brand.logo } }),
    ...(brand.sameAs && { sameAs: brand.sameAs }),
    ...(brand.knowsAbout && { knowsAbout: brand.knowsAbout }),
  }
}
