export type SettingGroup = "site" | "content" | "contact" | "social" | "seo" | "shipping" | "analytics"

export interface SettingMeta {
  key: string
  group: SettingGroup
  label: string
  type: "text" | "textarea" | "richtext" | "url" | "email" | "language" | "currency"
  placeholder?: string
}

export const SETTING_KEYS: SettingMeta[] = [
  { key: "site.name", group: "site", label: "Site Name", type: "text", placeholder: "e.g. Global Trade Store" },
  { key: "site.slogan", group: "site", label: "Site Slogan / Subtitle", type: "text", placeholder: "e.g. Wholesale & Retail Online" },
  { key: "site.description", group: "site", label: "Site Description", type: "textarea" },
  { key: "site.logo", group: "site", label: "Logo URL", type: "url" },
  { key: "site.logoCompany", group: "site", label: "Company Logo URL", type: "url" },
  { key: "site.favicon", group: "site", label: "Favicon URL", type: "url" },
  { key: "site.language", group: "site", label: "Default Language", type: "language" },
  { key: "site.currency", group: "site", label: "Default Currency", type: "currency" },
  { key: "site.promoBar", group: "site", label: "Announcement Bar Text", type: "text", placeholder: "e.g. Free shipping over $100" },
  { key: "content.brandStory", group: "content", label: "Brand Story (JSON)", type: "textarea", placeholder: '{ "eyebrow": "Our Story", "title": "...", "paragraphs": ["..."], "image": "", "ctaLabel": "...", "ctaHref": "/about" }' },
  { key: "content.promo1", group: "content", label: "Feature Promo Section (JSON)", type: "textarea", placeholder: '{ "eyebrow": "", "title": "...", "body": "...", "features": [{ "title": "...", "description": "..." }], "image": "", "ctaLabel": "...", "ctaHref": "/products" }' },
  { key: "content.promo2", group: "content", label: "Collection Gallery Section (JSON)", type: "textarea", placeholder: '{ "eyebrow": "", "title": "...", "tagline": "...", "collections": [{ "title": "...", "description": "...", "href": "/products" }], "ctaLabel": "...", "ctaHref": "/products" }' },
  { key: "content.testimonials", group: "content", label: "Testimonials (JSON array)", type: "textarea", placeholder: '[{ "name": "...", "location": "...", "rating": 5, "text": "...", "product": "..." }]' },
  { key: "content.instagram", group: "content", label: "Instagram Section (JSON)", type: "textarea", placeholder: '{ "handle": "@You", "handleUrl": "https://instagram.com/...", "tagline": "...", "posts": ["url1", "url2"] }' },
  { key: "content.featuredEyebrow", group: "content", label: "Featured Categories — Overline", type: "text", placeholder: "Explore" },
  { key: "content.featuredHeading", group: "content", label: "Featured Categories — Heading", type: "text", placeholder: "Our Collections" },
  { key: "content.featuredTagline", group: "content", label: "Featured Categories — Tagline", type: "text" },
  { key: "content.faq", group: "content", label: "FAQ (JSON array)", type: "textarea", placeholder: '[{ "q": "...", "a": "..." }]' },
  { key: "company.name", group: "contact", label: "Company Name", type: "text" },
  { key: "company.address", group: "contact", label: "Company Address", type: "textarea" },
  { key: "company.brief", group: "contact", label: "About / Company Intro", type: "textarea" },
  { key: "contact.email", group: "contact", label: "Contact Email", type: "email" },
  { key: "contact.phone", group: "contact", label: "Contact Phone", type: "text" },
  { key: "contact.whatsapp", group: "contact", label: "WhatsApp Number", type: "text" },
  { key: "contact.hours", group: "contact", label: "Business Hours", type: "text", placeholder: "Mon–Fri, 9am–6pm" },
  { key: "footer.about", group: "contact", label: "Footer About Text", type: "textarea" },
  { key: "footer.copyright", group: "contact", label: "Copyright Text", type: "text", placeholder: "All rights reserved." },
  { key: "social.facebook", group: "social", label: "Facebook URL", type: "url" },
  { key: "social.instagram", group: "social", label: "Instagram URL", type: "url" },
  { key: "social.linkedin", group: "social", label: "LinkedIn URL", type: "url" },
  { key: "social.youtube", group: "social", label: "YouTube URL", type: "url" },
  { key: "social.twitter", group: "social", label: "X / Twitter URL", type: "url" },
  { key: "seo.homeTitle", group: "seo", label: "Homepage SEO Title", type: "text" },
  { key: "seo.homeDescription", group: "seo", label: "Homepage SEO Description", type: "textarea" },
  { key: "seo.defaultKeywords", group: "seo", label: "Default SEO Keywords", type: "textarea" },
  { key: "shipping.freeThreshold", group: "shipping", label: "Free Shipping Threshold (USD)", type: "text" },
  { key: "shipping.standardRate", group: "shipping", label: "Standard Shipping Rate (USD)", type: "text" },
  { key: "shipping.standardDays", group: "shipping", label: "Standard Delivery Days", type: "text" },
  { key: "shipping.expressRate", group: "shipping", label: "Express Shipping Rate (USD)", type: "text" },
  { key: "shipping.expressDays", group: "shipping", label: "Express Delivery Days", type: "text" },
  { key: "shipping.returnWindow", group: "shipping", label: "Return Window (days)", type: "text" },
]

export const SETTING_GROUP_ORDER: SettingGroup[] = ["site", "content", "contact", "social", "seo", "shipping"]

/** JSON map of storefront image slot key -> uploaded URL (managed at /admin/images). */
export const IMAGE_SETTING_KEY = "images.site"

export const ALL_SETTING_KEYS = [...SETTING_KEYS.map((s) => s.key), IMAGE_SETTING_KEY]